<?php

/**
 * @file
 * Local Drupal integration check: vendor/bin/drush php:script tests/lego-branding.php.
 */

use Drupal\node\Entity\Node;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Route;

require_once DRUPAL_ROOT . '/themes/custom/jurenites_theme/jurenites_theme.theme';
\Drupal::moduleHandler()->loadInclude('jurenites_blog', 'install');
$lego_term = jurenites_blog_ensure_lego_tag();
if (jurenites_blog_ensure_lego_tag()->id() !== $lego_term->id()) {
  throw new \RuntimeException('LEGO tag creation must be idempotent.');
}

// Unsaved fixtures exercise article and video routing without modifying content.
$build_node = Node::create(['type' => 'article', 'field_tags' => [$lego_term->id()]]);
$video_node = Node::create([
  'type' => 'article',
  'field_tags' => [$lego_term->id()],
  'field_youtube_video' => ['video_id' => 'lego-fixture'],
]);
$plain_node = Node::create(['type' => 'article']);
$branding_cases = [
  ['/?tag=lego', 'view.frontpage.page_1', [], TRUE],
  ['/about?tag=lego', 'entity.node.canonical', ['node' => $plain_node], TRUE],
  ['/about?tag=font', 'entity.node.canonical', ['node' => $plain_node], FALSE],
  ['/about?tag[]=lego', 'entity.node.canonical', ['node' => $plain_node], FALSE],
  ['/node/fixture', 'entity.node.canonical', ['node' => $build_node], TRUE],
  ['/node/fixture', 'entity.node.canonical', ['node' => $video_node], TRUE],
  ['/node/fixture', 'entity.node.canonical', ['node' => $plain_node], FALSE],
  ['/taxonomy/term/' . $lego_term->id(), 'entity.taxonomy_term.canonical', ['taxonomy_term' => $lego_term], TRUE],
];
$request_stack = \Drupal::service('request_stack');
foreach ($branding_cases as [$page_path, $route_name, $route_parameters, $expected_lego]) {
  $page_request = Request::create($page_path);
  $page_request->attributes->add($route_parameters + [
    '_route' => $route_name,
    '_route_object' => new Route($page_path, $route_parameters),
  ]);
  $request_stack->push($page_request);
  \Drupal::routeMatch()->resetRouteMatch();
  try {
    $block_variables = ['base_plugin_id' => 'system_branding_block', 'site_logo' => '/logo.svg'];
    jurenites_theme_preprocess_block($block_variables);
    if (str_contains($block_variables['site_logo'], 'jurenites-lego-logo') !== $expected_lego) {
      throw new \RuntimeException('Unexpected branding for ' . $page_path);
    }
    $block_build = [];
    jurenites_blog_block_build_system_branding_block_alter($block_build);
    foreach (['route', 'url.query_args:tag', 'user.permissions'] as $cache_context) {
      if (!in_array($cache_context, $block_build['#cache']['contexts'], TRUE)) {
        throw new \RuntimeException('Missing cache context ' . $cache_context);
      }
    }
  }
  finally {
    $request_stack->pop();
    \Drupal::routeMatch()->resetRouteMatch();
  }
}

// Repeated anonymous requests verify render/page cache separation in both directions.
$http_cases = [
  ['/blog', FALSE],
  ['/blog?tag=lego', TRUE],
  ['/videos?tag=lego', TRUE],
  ['/videos', FALSE],
  ['/about?tag=lego', TRUE],
  ['/about', FALSE],
  ['/portfolio?tag=font', FALSE],
  ['/taxonomy/term/' . $lego_term->id(), TRUE],
  ['/blog?tag=lego', TRUE],
  ['/blog', FALSE],
  ['/videos?tag=lego', TRUE],
];
foreach ($http_cases as [$page_path, $expected_lego]) {
  $page_response = \Drupal::httpClient()->get('http://localhost' . $page_path, [
    'headers' => ['Host' => 'jurenites.local'],
    'http_errors' => FALSE,
  ]);
  $page_html = (string) $page_response->getBody();
  if ($page_response->getStatusCode() !== 200
    || str_contains($page_html, 'site-header__logo--lego') !== $expected_lego) {
    throw new \RuntimeException('Unexpected HTTP branding for ' . $page_path);
  }
  print $page_path . ': ' . ($expected_lego ? 'LEGO' : 'standard') . PHP_EOL;
}
print 'Passed: idempotent term, 8 route cases, 11 anonymous HTTP/cache cases.' . PHP_EOL;
