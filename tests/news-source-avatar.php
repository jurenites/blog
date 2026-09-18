<?php

/**
 * @file
 * Run with drush php:script tests/news-source-avatar.php (HTTP mocked).
 */

use Drupal\Core\Url;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;

function news_avatar_expect(bool $expected_condition, string $failure_message): void {
  if (!$expected_condition) {
    throw new RuntimeException($failure_message);
  }
}

$expected_avatar = 'https://yt3.ggpht.com/news-owner-avatar';
$owner_data = ['contents' => ['twoColumnWatchNextResults' => ['results' => ['results' => ['contents' => [
  ['videoSecondaryInfoRenderer' => ['owner' => ['videoOwnerRenderer' => [
    'thumbnail' => ['thumbnails' => [['url' => $expected_avatar]]],
  ]]]],
]]]]]];
$fixture_page = '<script>var ytInitialData = ' . json_encode($owner_data) . ';</script>'
  . '<script>var ytInitialPlayerResponse = {"publishDate":"2026-09-01"};</script>';
$service_container = \Drupal::getContainer();
$original_client = $service_container->get('http_client');
$original_resolver = $service_container->get('media.oembed.url_resolver');
$original_fetcher = $service_container->get('media.oembed.resource_fetcher');
$fixture_fetcher = new class {
  public string $author_url = 'https://www.youtube.com/@fixture-channel';
  public int $request_count = 0;
  public function fetchResource(string $resource_url): object {
    $this->request_count++;
    return $this;
  }
  public function getAuthorName(): string {
    return 'Changed metadata name';
  }
  public function getThumbnailUrl(): ?Url {
    return NULL;
  }
  public function getAuthorUrl(): ?Url {
    return $this->author_url !== '' ? Url::fromUri($this->author_url) : NULL;
  }
};
$service_container->set('media.oembed.url_resolver', new class {
  public function getResourceUrl(string $video_url): string {
    return 'https://www.youtube.com/oembed';
  }
});
$service_container->set('media.oembed.resource_fetcher', $fixture_fetcher);
$request_history = [];
$mock_handler = new MockHandler();
$handler_stack = HandlerStack::create($mock_handler);
$handler_stack->push(Middleware::history($request_history));
$service_container->set('http_client', new Client(['handler' => $handler_stack]));
$database_transaction = \Drupal::database()->startTransaction();
try {
  $fixture_file = File::create(['uri' => 'public://news-avatar-fixture.png', 'status' => 1]);
  $fixture_file->save();
  $news_node = Node::create([
    'type' => 'news',
    'title' => 'News avatar fixture',
    'status' => 0,
    'field_news_source_url' => ['uri' => 'https://www.youtube.com/watch?v=abcdefghijk'],
    'field_news_source_name' => 'Fixture Channel',
    'field_news_source_published' => '2026-08-01T00:00:00',
    'field_image' => ['target_id' => $fixture_file->id(), 'alt' => 'Fixture'],
  ]);
  $mock_handler->append(new Response(200, [], $fixture_page));
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_channel_avatar')->value === $expected_avatar, 'Saving complete News metadata must still collect a missing avatar.');
  news_avatar_expect($news_node->get('field_news_source_published')->value === '2026-08-01T00:00:00', 'Avatar collection must preserve the editor publication date.');
  news_avatar_expect($news_node->get('field_youtube_creator_url')->uri === $fixture_fetcher->author_url, 'Collect a missing profile URL even when the source name exists.');
  news_avatar_expect($news_node->get('field_news_source_name')->value === 'Fixture Channel', 'Collecting the profile must preserve the source name.');
  $news_node->set('field_youtube_creator_url', ['uri' => 'https://www.youtube.com/@editor-correction']);
  $news_node->set('field_youtube_channel_avatar', 'https://yt3.ggpht.com/editor-correction');
  $news_node->save();
  news_avatar_expect(count($request_history) === 1, 'An existing avatar must not trigger a request.');
  news_avatar_expect($news_node->get('field_youtube_channel_avatar')->value === 'https://yt3.ggpht.com/editor-correction', 'Preserve manual avatar corrections.');
  news_avatar_expect($news_node->get('field_youtube_creator_url')->uri === 'https://www.youtube.com/@editor-correction' && $fixture_fetcher->request_count === 1, 'Preserve existing URLs without fetching metadata again.');
  $news_node->set('field_youtube_creator_url', NULL);
  $fixture_fetcher->author_url = '';
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_creator_url')->isEmpty(), 'Missing profile metadata must allow saving.');
  $fixture_fetcher->author_url = 'https://www.youtube.com/@fixture-channel';
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_creator_url')->uri === $fixture_fetcher->author_url, 'A later save must retry a missing profile URL.');
  $news_node->set('field_youtube_channel_avatar', NULL);
  $mock_handler->append(new Response(503));
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_channel_avatar')->isEmpty(), 'Lookup failure must allow saving with initials.');
  $mock_handler->append(new Response(200, [], $fixture_page));
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_channel_avatar')->value === $expected_avatar, 'A later save must retry the avatar.');

  \Drupal::service('theme.initialization')->initTheme('jurenites_theme');
  $node_variables = ['node' => $news_node, 'elements' => []];
  jurenites_theme_add_news_metadata($node_variables);
  $identity_build = [
    '#type' => 'inline_template',
    '#template' => "{% include '@jurenites_theme/components/author-identity.html.twig' with {author_name_text: news_source_name, author_url: news_author_url, author_avatar_image: news_source_avatar, author_avatar_initials: news_source_initials, avatar_size: 'small'} only %}",
    '#context' => $node_variables,
  ];
  $identity_markup = (string) \Drupal::service('renderer')->renderInIsolation($identity_build);
  news_avatar_expect(str_contains($identity_markup, 'avatar--small') && str_contains($identity_markup, $expected_avatar) && str_contains($identity_markup, 'Fixture Channel'), 'Render the shared small avatar with its source name.');
  news_avatar_expect(str_contains($identity_markup, 'href="https://www.youtube.com/@fixture-channel" rel="external noopener"'), 'Render the author name as the shared external profile link.');
  news_avatar_expect(count($request_history) === 3, 'Rendering must not request external metadata.');
  $identity_build['#context']['news_author_url'] = '';
  $fallback_markup = (string) \Drupal::service('renderer')->renderInIsolation($identity_build);
  news_avatar_expect(!str_contains($fallback_markup, '<a '), 'Missing profile URLs must leave plain-text names.');
  $fixture_fetcher->author_url = '';

  $news_node->set('field_news_source_url', ['uri' => 'https://www.youtube.com/watch?v=zyxwvutsrqp']);
  $mock_handler->append(new Response(503), new Response(503), new Response(503));
  $news_node->save();
  news_avatar_expect($news_node->get('field_youtube_channel_avatar')->isEmpty(), 'A failed source refresh must not retain the old avatar.');
  news_avatar_expect($news_node->get('field_youtube_creator_url')->isEmpty(), 'Source changes must clear the previous profile URL.');
  print "PASS: News author URL and avatar save, preservation, retry, source change, and shared rendering.\n";
}
finally {
  $database_transaction->rollBack();
  $service_container->set('http_client', $original_client);
  $service_container->set('media.oembed.url_resolver', $original_resolver);
  $service_container->set('media.oembed.resource_fetcher', $original_fetcher);
  \Drupal::entityTypeManager()->getStorage('node')->resetCache();
  \Drupal::entityTypeManager()->getStorage('file')->resetCache();
}
