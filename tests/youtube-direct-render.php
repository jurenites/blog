<?php

declare(strict_types=1);

/**
 * @file
 * DEV: drush php:script tests/youtube-direct-render.php.
 * Proves uncached rendering works without outbound HTTP or YouTube oEmbed.
 */

use Drupal\Core\Cache\MemoryBackend;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\media\Entity\Media;
use Drupal\media\OEmbed\Resource;
use Drupal\media\OEmbed\ResourceFetcherInterface;
use Drupal\media\OEmbed\UrlResolverInterface;
use Drupal\node\Entity\Node;
use GuzzleHttp\Client;

function direct_video_expect(bool $test_condition, string $failure_message): void {
  if (!$test_condition) {
    throw new RuntimeException($failure_message);
  }
}

$service_container = \Drupal::getContainer();
$original_services = [];
foreach (['http_client', 'media.oembed.url_resolver', 'media.oembed.resource_fetcher', 'cache.render'] as $service_name) {
  $original_services[$service_name] = $service_container->get($service_name);
}
$request_count = 0;
$service_container->set('http_client', new Client(['handler' => static function () use (&$request_count) {
  $request_count++;
  throw new RuntimeException('Rendering attempted outbound HTTP.');
}]));
$service_container->set('cache.render', new MemoryBackend(\Drupal::time()));
$resource_resolver = new class implements UrlResolverInterface {
  public array $resolved_urls = [];

  public function getProviderByUrl($video_url) {
    throw new RuntimeException('Rendering attempted provider discovery.');
  }

  public function getResourceUrl($video_url, $max_width = NULL, $max_height = NULL) {
    $this->resolved_urls[] = $video_url;
    if ($video_url !== 'https://vimeo.com/123456789') {
      throw new RuntimeException('YouTube rendering attempted oEmbed resolution.');
    }
    return 'https://vimeo.com/api/oembed.json';
  }
};
$resource_fetcher = new class implements ResourceFetcherInterface {
  public array $fetched_urls = [];

  public function fetchResource($resource_url) {
    $this->fetched_urls[] = $resource_url;
    if ($resource_url !== 'https://vimeo.com/api/oembed.json') {
      throw new RuntimeException('YouTube rendering attempted oEmbed fetching.');
    }
    return Resource::rich('<iframe src="https://player.vimeo.com/video/123456789"></iframe>', 640, 360, title: 'Vimeo fixture');
  }
};
$service_container->set('media.oembed.url_resolver', $resource_resolver);
$service_container->set('media.oembed.resource_fetcher', $resource_fetcher);
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(new AnonymousUserSession());

try {
  $media_fixture = Media::create(['bundle' => 'remote_video', 'name' => 'Saved video title', 'status' => 1]);
  $formatter_plugin = \Drupal::service('plugin.manager.field.formatter')->getInstance([
    'field_definition' => $media_fixture->getFieldDefinition('field_media_oembed_video'),
    'view_mode' => 'default',
    'configuration' => ['type' => 'oembed', 'label' => 'hidden', 'settings' => ['loading' => ['attribute' => 'lazy']]],
  ]);
  direct_video_expect($formatter_plugin instanceof \Drupal\jurenites_blog\Plugin\Field\FieldFormatter\DirectYoutubeOEmbedFormatter, 'Existing oEmbed displays must use the direct formatter.');
  foreach ([
    'https://www.youtube.com/watch?v=r2b_M4a8SoQ' => '',
    'https://youtu.be/r2b_M4a8SoQ?si=shared&t=1m2s' => '?start=62',
    'https://m.youtube.com/watch?v=r2b_M4a8SoQ&t=15' => '?start=15',
    'https://www.youtube.com/shorts/r2b_M4a8SoQ' => '',
    'https://www.youtube.com/live/r2b_M4a8SoQ' => '',
    'https://www.youtube.com/embed/r2b_M4a8SoQ?start=10' => '?start=10',
    'https://www.youtube-nocookie.com/embed/r2b_M4a8SoQ' => '',
    'https://www.youtube.com/watch?v=r2b_M4a8SoQ&t[]=15' => '',
  ] as $video_url => $expected_query) {
    $media_fixture->set('field_media_oembed_video', $video_url);
    $render_elements = $formatter_plugin->viewElements($media_fixture->get('field_media_oembed_video'), 'en');
    $iframe_attributes = $render_elements[0]['#attributes'];
    direct_video_expect($iframe_attributes['src'] === 'https://www.youtube.com/embed/r2b_M4a8SoQ' . $expected_query, 'Wrong direct player URL for ' . $video_url);
    direct_video_expect($iframe_attributes['title'] === 'Saved video title' && $iframe_attributes['loading'] === 'lazy', 'Stored title and lazy loading must survive.');
    direct_video_expect(!isset($iframe_attributes['width']) && !isset($iframe_attributes['height']) && !isset($iframe_attributes['style']), 'Player presentation belongs in SCSS.');
    direct_video_expect($iframe_attributes['allowfullscreen'] === TRUE, 'Direct players must support fullscreen.');
  }
  foreach (['https://www.youtube.com/watch?v=bad', 'https://www.youtube.com/watch?v[]=r2b_M4a8SoQ', 'ftp://www.youtube.com/watch?v=r2b_M4a8SoQ'] as $invalid_url) {
    $media_fixture->set('field_media_oembed_video', $invalid_url);
    direct_video_expect($formatter_plugin->viewElements($media_fixture->get('field_media_oembed_video'), 'en') === [], 'Malformed YouTube values must not produce embeds or requests.');
  }

  // Exercise real Twig and Media references from the affected Article.
  $article_path = \Drupal::service('path_alias.manager')->getPathByAlias('/blog/citizen-sleeper-interface-review', 'en');
  $article_node = Node::load((int) basename($article_path));
  direct_video_expect($article_node !== NULL, 'Citizen Sleeper DEV fixture must exist.');
  $node_builder = \Drupal::entityTypeManager()->getViewBuilder('node');
  $article_build = $node_builder->view($article_node, 'full');
  $article_markup = (string) \Drupal::service('renderer')->renderRoot($article_build);
  direct_video_expect(str_contains($article_markup, 'https://www.youtube.com/embed/r2b_M4a8SoQ'), 'Citizen Sleeper must render its supporting player offline.');
  direct_video_expect(str_contains($article_markup, 'data-jurenites-youtube-video-loader'), 'The shared loading component must remain.');
  direct_video_expect(!str_contains($article_markup, '/media/oembed'), 'YouTube must not use the server oEmbed iframe route.');
  direct_video_expect(!preg_match('/<iframe[^>]+\s(?:width|height|style)=/', $article_markup), 'Rendered player dimensions must remain in SCSS.');

  $video_identifiers = \Drupal::entityQuery('node')->condition('type', 'video')->condition('status', 1)->accessCheck(FALSE)->range(0, 2)->execute();
  direct_video_expect(count($video_identifiers) > 0, 'Published Video fixtures must exist.');
  foreach (Node::loadMultiple($video_identifiers) as $video_node) {
    foreach (['full', 'teaser', 'blog_list'] as $view_mode) {
      $video_build = $node_builder->view($video_node, $view_mode);
      $video_markup = (string) \Drupal::service('renderer')->renderRoot($video_build);
      if ($view_mode === 'full') {
        direct_video_expect(str_contains($video_markup, '/embed/' . $video_node->get('field_youtube_video')->video_id), 'Primary Video player must render offline.');
      }
    }
  }
  $empty_credit_node = Node::create(['type' => 'video', 'title' => 'Stored title', 'field_youtube_video' => ['input' => 'https://youtu.be/r2b_M4a8SoQ', 'video_id' => 'r2b_M4a8SoQ']]);
  $node_variables = ['node' => $empty_credit_node, 'elements' => []];
  jurenites_theme_add_youtube_metadata($node_variables);
  direct_video_expect($node_variables['youtube_author_name'] === '' && $node_variables['youtube_video_title'] === 'Stored title', 'Missing credits must use local fallbacks without lookups.');
  direct_video_expect($request_count === 0 && $resource_resolver->resolved_urls === [] && $resource_fetcher->fetched_urls === [], 'YouTube renders must make zero HTTP or oEmbed requests.');

  // Other providers retain Drupal's isolated oEmbed iframe and source values.
  $media_fixture->set('field_media_oembed_video', 'https://vimeo.com/123456789');
  $provider_elements = $formatter_plugin->viewElements($media_fixture->get('field_media_oembed_video'), 'en');
  direct_video_expect(str_contains($provider_elements[0]['#attributes']['src'], '/media/oembed'), 'Vimeo must retain the core oEmbed renderer.');
  direct_video_expect($resource_resolver->resolved_urls === ['https://vimeo.com/123456789'] && count($resource_fetcher->fetched_urls) === 1, 'Only the other provider must resolve and fetch.');
  direct_video_expect($media_fixture->get('field_media_oembed_video')->value === 'https://vimeo.com/123456789', 'Rendering must not mutate the stored field.');
  print "PASS: direct URL formats, timestamps, invalid values, uncached Article/Video rendering, missing credits, zero YouTube requests, and other-provider fallback.\n";
}
finally {
  $account_switcher->switchBack();
  foreach ($original_services as $service_name => $original_service) {
    $service_container->set($service_name, $original_service);
  }
}
