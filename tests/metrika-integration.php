<?php

/**
 * @file
 * Local check: drush php:script tests/metrika-integration.php.
 * Uses process-only requests and overrides; never sends Yandex telemetry.
 */

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Config\ConfigFactoryOverrideInterface;
use Drupal\Core\Config\StorageInterface;
use Drupal\Core\Controller\HtmlFormController;
use Drupal\Core\Routing\RouteMatch;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\Core\Session\UserSession;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Route;

function assert_metrika_result(bool $test_result, string $test_message): void {
  if (!$test_result) {
    throw new RuntimeException($test_message);
  }
}

// Exercise the HTTP form controller: direct getForm() skips argument resolution.
$settings_route = \Drupal::service('router.route_provider')->getRouteByName('jurenites_metrika.settings');
$settings_request = Request::create('http://jurenites.local/admin/config/services/yandex-metrika');
$settings_request->attributes->add($settings_route->getDefaults());
$settings_request->attributes->set('_route', 'jurenites_metrika.settings');
$settings_request->attributes->set('_route_object', $settings_route);
$form_controller = new HtmlFormController(\Drupal::service('http_kernel.controller.argument_resolver'), \Drupal::formBuilder(), \Drupal::service('class_resolver'));
$settings_form = $form_controller->getContentResult($settings_request, RouteMatch::createFromRequest($settings_request));
assert_metrika_result($settings_form['counter_id']['#default_value'] === \Drupal::config('jurenites_metrika.settings')->get('counter_id'), 'Counter ID is not available in the routed settings form.');

$test_override = new class implements ConfigFactoryOverrideInterface {
  public array $tracking_settings = ['tracking_enabled' => TRUE, 'counter_id' => '113437271'];

  public function loadOverrides($config_names): array {
    return ['jurenites_metrika.settings' => $this->tracking_settings];
  }

  public function getCacheSuffix(): string {
    return 'metrika_integration';
  }

  public function createConfigObject($config_name, $collection_name = StorageInterface::DEFAULT_COLLECTION) {
    return NULL;
  }

  public function getCacheableMetadata($config_name): CacheableMetadata {
    return new CacheableMetadata();
  }
};
\Drupal::configFactory()->addOverride($test_override);

$request_stack = \Drupal::service('request_stack');
$account_proxy = \Drupal::currentUser();
$original_account = $account_proxy->getAccount();
$trusted_hosts = Request::getTrustedHosts();
Request::setTrustedHosts(['^jurenites\.local$', '^jurenites\.com$', '^www\.jurenites\.com$', '^preview\.jurenites\.com$']);

$request_cases = [
  ['jurenites.com', '/', '/', FALSE, FALSE, TRUE],
  ['www.jurenites.com', '/ru', '/', FALSE, FALSE, TRUE],
  ['jurenites.local', '/', '/', FALSE, FALSE, FALSE],
  ['preview.jurenites.com', '/', '/', FALSE, FALSE, FALSE],
  ['jurenites.com', '/', '/', TRUE, FALSE, FALSE],
  ['jurenites.com', '/admin/config', '/admin/config', FALSE, TRUE, FALSE],
  ['jurenites.com', '/custom-admin', '/custom-admin', FALSE, TRUE, FALSE],
  ['jurenites.com', '/user/login', '/user/login', FALSE, FALSE, FALSE],
  ['jurenites.com', '/ru/user/login', '/user/login', FALSE, FALSE, FALSE],
  ['jurenites.com', '/node/1/edit', '/node/1/edit', FALSE, FALSE, FALSE],
];
try {
  foreach ($request_cases as [$request_host, $request_path, $internal_path, $signed_in, $admin_route, $expect_tracking]) {
    $test_request = Request::create('https://' . $request_host . $request_path);
    $test_request->attributes->set('_route', 'metrika_test');
    $test_request->attributes->set('_route_object', new Route($internal_path, [], [], ['_admin_route' => $admin_route]));
    $request_stack->push($test_request);
    \Drupal::service('path.current')->setPath($internal_path, $test_request);
    $account_proxy->setAccount($signed_in ? new UserSession(['uid' => 1, 'roles' => ['authenticated']]) : new AnonymousUserSession());
    try {
      $page_attachments = [];
      $page_bottom = [];
      jurenites_metrika_page_attachments($page_attachments);
      jurenites_metrika_page_bottom($page_bottom);
      $head_items = $page_attachments['#attached']['html_head'] ?? [];
      assert_metrika_result(count($head_items) === ($expect_tracking ? 1 : 0), 'Incorrect tracking for ' . $request_host . $request_path);
      assert_metrika_result(isset($page_bottom['jurenites_metrika_beacon']) === $expect_tracking, 'Beacon eligibility differs from the script.');
      foreach ([$page_attachments, $page_bottom] as $cacheable_elements) {
        assert_metrika_result(in_array('config:jurenites_metrika.settings', $cacheable_elements['#cache']['tags'], TRUE), 'Missing configuration cache tag.');
        assert_metrika_result(!array_diff(['url.site', 'url.path', 'route', 'user.roles:authenticated'], $cacheable_elements['#cache']['contexts']), 'Missing visibility cache contexts.');
      }
      if ($expect_tracking) {
        $script_element = $head_items[0][0];
        $script_markup = (string) \Drupal::service('renderer')->renderInIsolation($script_element);
        assert_metrika_result(str_contains($script_markup, '<script>') && str_contains($script_markup, 'const counter_id = 113437271;'), 'Counter script did not render.');
        assert_metrika_result(!str_contains($script_markup, 'METRIKA_COUNTER_ID'), 'Unresolved counter placeholder.');
        $beacon_markup = (string) \Drupal::service('renderer')->renderInIsolation($page_bottom);
        assert_metrika_result(str_contains($beacon_markup, '<noscript>') && str_contains($beacon_markup, 'https://mc.yandex.ru/watch/113437271'), 'Missing fallback beacon.');
        assert_metrika_result(!preg_match('/\s(?:style|width|height)=/', $beacon_markup), 'Beacon contains inline presentation.');

        foreach ([['tracking_enabled' => FALSE, 'counter_id' => '113437271'], ['tracking_enabled' => TRUE, 'counter_id' => ''], ['tracking_enabled' => TRUE, 'counter_id' => '1;alert(1)']] as $disabled_settings) {
          $test_override->tracking_settings = $disabled_settings;
          \Drupal::configFactory()->reset('jurenites_metrika.settings');
          $disabled_elements = [];
          assert_metrika_result(jurenites_metrika_tracking_counter($disabled_elements) === NULL, 'Disabled or invalid counter was injected.');
        }
        $test_override->tracking_settings = ['tracking_enabled' => TRUE, 'counter_id' => '113437271'];
        \Drupal::configFactory()->reset('jurenites_metrika.settings');
      }
      echo $request_host . $request_path . ': ' . ($expect_tracking ? 'script and beacon' : 'excluded') . "\n";
    }
    finally {
      $request_stack->pop();
    }
  }
}
finally {
  $account_proxy->setAccount($original_account);
  Request::setTrustedHosts($trusted_hosts);
}

foreach (['/', '/ru', '/user/login', '/ru/user/login'] as $request_path) {
  $page_response = \Drupal::httpClient()->get('http://127.0.0.1' . $request_path, [
    'headers' => ['Host' => 'jurenites.local'],
    'http_errors' => FALSE,
    'allow_redirects' => FALSE,
  ]);
  assert_metrika_result($page_response->getStatusCode() === 200, 'Unexpected local HTTP status for ' . $request_path);
  assert_metrika_result(!str_contains((string) $page_response->getBody(), 'mc.yandex.ru'), 'Local page contains live Yandex tracking.');
}
echo "Settings form, visibility, cache metadata, rendered markup, disabled/invalid settings, and local HTTP suppression passed.\n";
