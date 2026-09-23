<?php

/**
 * @file
 * Local check: drush php:script tests/clarity-integration.php.
 */

use Drupal\Core\Session\AnonymousUserSession;
use Drupal\Core\Session\UserSession;

$clarity_config = \Drupal::config('ms_clarity.settings');
$project_id = $clarity_config->get('account');
if (!$project_id) {
  throw new RuntimeException('Configure the Clarity project ID before verification.');
}

// Regress the Drupal 11 constructor failure in the upstream settings form.
$settings_form = \Drupal::formBuilder()->getForm('Drupal\\ms_clarity\\Form\\MicrosoftClarityAdminSettingsForm');
if ($settings_form['general']['accounts']['#default_value'] !== $project_id) {
  throw new RuntimeException('The settings form does not expose the saved project ID.');
}
echo "Settings form builds and displays the saved project ID.\n";

$visibility_tracker = \Drupal::service('ms_clarity.visibility');
if (!$visibility_tracker->getUserVisibilty(new AnonymousUserSession())
  || $visibility_tracker->getUserVisibilty(new UserSession(['uid' => 1, 'roles' => ['authenticated', 'administrator']]))) {
  throw new RuntimeException('Expected anonymous-only tracking.');
}
echo "Anonymous visitors included; authenticated administrator excluded.\n";

$page_attachments = [];
ms_clarity_page_attachments($page_attachments);
foreach (['url.path', 'user.roles'] as $cache_context) {
  if (!in_array($cache_context, $page_attachments['#cache']['contexts'] ?? [], TRUE)) {
    throw new RuntimeException("Missing cache context: $cache_context");
  }
}
if (!in_array('config:ms_clarity.settings', $page_attachments['#cache']['tags'] ?? [], TRUE)) {
  throw new RuntimeException('Cached output will not invalidate when settings change.');
}
echo "Tracking attachments carry configuration and visibility cache metadata.\n";

foreach ([['/', TRUE], ['/ru', TRUE], ['/user/login', FALSE], ['/ru/user/login', FALSE]] as [$request_path, $expect_tracking]) {
  $page_response = \Drupal::httpClient()->get('http://127.0.0.1' . $request_path, [
    'headers' => ['Host' => 'jurenites.local'],
    'allow_redirects' => FALSE,
    'http_errors' => FALSE,
  ]);
  if ($page_response->getStatusCode() !== 200) {
    throw new RuntimeException("Unexpected HTTP status for $request_path: " . $page_response->getStatusCode());
  }
  $response_html = (string) $page_response->getBody();
  preg_match('/<head\b[^>]*>(.*?)<\/head>/is', $response_html, $head_match);
  $tracking_count = substr_count($response_html, 'https://www.clarity.ms/tag/');
  if ($tracking_count !== ($expect_tracking ? 1 : 0)
    || ($expect_tracking && (!str_contains($head_match[1] ?? '', 'https://www.clarity.ms/tag/')
      || !str_contains($head_match[1] ?? '', '"' . $project_id . '"')))) {
    throw new RuntimeException("Incorrect Clarity script placement or count for $request_path.");
  }
  echo "$request_path: " . ($expect_tracking ? 'one Clarity snippet in head' : 'no Clarity snippet') . "\n";
}
