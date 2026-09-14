<?php

/**
 * @file
 * Local check: drush php:script tests/article-youtube-avatar-save.php.
 * HTTP is mocked and all fixture database changes are rolled back.
 */

use Drupal\Core\Url;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\ConnectException;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Psr7\Response;

function youtube_avatar_expect(bool $expected_condition, string $failure_message): void {
  if (!$expected_condition) {
    throw new RuntimeException($failure_message);
  }
}

function youtube_avatar_page(string $avatar_url, string $data_assignment = 'var ytInitialData', ?array $owner_data = NULL): string {
  $owner_data ??= ['thumbnail' => ['thumbnails' => [['url' => $avatar_url, 'width' => 48]]]];
  $initial_data = [
    'contents' => [
      'twoColumnWatchNextResults' => [
        'results' => ['results' => ['contents' => [
          ['videoSecondaryInfoRenderer' => ['owner' => ['videoOwnerRenderer' => $owner_data]]],
        ]]],
        'secondaryResults' => ['videoOwnerRenderer' => [
          'thumbnail' => ['thumbnails' => [['url' => 'https://yt3.ggpht.com/recommendation']]],
        ]],
      ],
    ],
  ];
  return '<script>' . $data_assignment . ' = ' . json_encode($initial_data) . ';</script>'
    . '<script>var ytInitialPlayerResponse = {"publishDate":"2026-09-01","lengthSeconds":"180"};</script>';
}

$expected_avatar = 'https://yt3.googleusercontent.com/channel-avatar=s48-c-k-c0x00ffffff-no-rj';
$fixture_page = youtube_avatar_page($expected_avatar);
$collaborator_items = [];
foreach (['Avatar fixture channel', 'Second fixture channel'] as $channel_index => $channel_name) {
  $collaborator_items[] = ['listItemViewModel' => [
    'title' => [
      'content' => $channel_name,
      'commandRuns' => [['onTap' => ['innertubeCommand' => ['browseEndpoint' => [
        'browseId' => 'UC' . str_repeat($channel_index === 0 ? 'a' : 'b', 22),
      ]]]]],
    ],
    'leadingAccessory' => ['avatarViewModel' => ['image' => ['sources' => [[
      'url' => $channel_index === 0 ? $expected_avatar : 'https://yt3.ggpht.com/second-avatar',
    ]]]]],
  ]];
}
$collaboration_owner = ['navigationEndpoint' => ['showDialogCommand' => ['panelLoadingStrategy' => [
  'inlineContent' => ['dialogViewModel' => ['customContent' => ['listViewModel' => ['listItems' => $collaborator_items]]]],
]]]];
$collaboration_page = youtube_avatar_page('', 'var ytInitialData', $collaboration_owner);
$collaboration_credits = jurenites_blog_youtube_channel_credits($collaboration_page);
youtube_avatar_expect(count($collaboration_credits) === 2, 'The embedded collaborator list must expose both channel identities.');
youtube_avatar_expect($collaboration_credits[1]['avatar_url'] === 'https://yt3.ggpht.com/second-avatar', 'The second avatar must belong to the second channel.');
foreach (['var ytInitialData', 'window["ytInitialData"]'] as $data_assignment) {
  youtube_avatar_expect(
    jurenites_blog_youtube_channel_avatar_url(youtube_avatar_page($expected_avatar, $data_assignment)) === $expected_avatar,
    'The owner avatar must be decoded from the initial page data.',
  );
}
foreach ([
  '',
  'http://yt3.googleusercontent.com/insecure',
  'https://yt3.googleusercontent.com.example.com/unapproved',
  'https://example.com/image',
  'https://yt3.ggpht.com/' . str_repeat('a', 256),
] as $invalid_avatar) {
  youtube_avatar_expect(
    jurenites_blog_youtube_channel_avatar_url(youtube_avatar_page($invalid_avatar)) === '',
    'Invalid owner images must not fall back to recommendation avatars.',
  );
}
youtube_avatar_expect(jurenites_blog_youtube_channel_avatar_url('<script>var ytInitialData = {broken};</script>') === '', 'Malformed page data must be ignored.');
youtube_avatar_expect(jurenites_blog_youtube_channel_avatar_url(youtube_avatar_page('https://yt3.ggpht.com/avatar')) === 'https://yt3.ggpht.com/avatar', 'The legacy YouTube avatar host must be accepted.');
youtube_avatar_expect(jurenites_blog_youtube_channel_avatar_url('<script>var largePayload = "' . str_repeat('x', 1100000) . '";</script>' . $fixture_page) === $expected_avatar, 'Large video pages must not hit regular-expression backtracking limits.');

$service_container = \Drupal::getContainer();
$original_services = [];
foreach (['http_client', 'media.oembed.url_resolver', 'media.oembed.resource_fetcher'] as $service_name) {
  $original_services[$service_name] = $service_container->get($service_name);
}
$request_history = [];
$mock_handler = new MockHandler();
$handler_stack = HandlerStack::create($mock_handler);
$handler_stack->push(Middleware::history($request_history));
$service_container->set('http_client', new Client(['handler' => $handler_stack]));
$service_container->set('media.oembed.url_resolver', new class {
  public function getResourceUrl(string $video_url): string {
    return 'https://www.youtube.com/oembed';
  }
});
$service_container->set('media.oembed.resource_fetcher', new class {
  public function fetchResource(string $resource_url): object {
    return new class {
      public function getTitle(): string {
        return 'Video fixture';
      }

      public function getAuthorName(): string {
        return 'Avatar fixture channel';
      }

      public function getAuthorUrl(): Url {
        return Url::fromUri('https://www.youtube.com/@avatar-fixture');
      }
    };
  }
});
$database_transaction = \Drupal::database()->startTransaction();
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
try {
  // A stored file reference prevents unrelated thumbnail downloads; no file is written.
  $fixture_file = File::create(['uri' => 'public://youtube-avatar-save-fixture.png', 'status' => 1]);
  $fixture_file->save();
  $article_node = Node::create([
    'type' => 'video',
    'title' => 'YouTube avatar save fixture',
    'status' => 0,
    'field_youtube_video' => ['input' => 'https://www.youtube.com/watch?v=abcdefghijk', 'video_id' => 'abcdefghijk'],
    'field_image' => ['target_id' => $fixture_file->id(), 'alt' => 'Fixture image'],
  ]);
  $mock_handler->append(new Response(200, [], $fixture_page));
  $article_node->save();
  $node_storage->resetCache([$article_node->id()]);
  $article_node = Node::load($article_node->id());
  youtube_avatar_expect($article_node->get('field_youtube_channel_avatar')->value === $expected_avatar, 'A new Video must persist its avatar.');
  youtube_avatar_expect(str_starts_with($article_node->toUrl()->toString(), '/videos/'), 'New Videos must receive a /videos/ detail alias.');
  youtube_avatar_expect(count($request_history) === 1, 'Avatar, date, and duration must share one page request.');
  youtube_avatar_expect($article_node->get('field_youtube_published_date')->value === '2026-09-01', 'Publication date collection must remain intact.');
  youtube_avatar_expect((int) $article_node->get('field_consumption_time_minutes')->value === 3, 'Duration collection must remain intact.');

  $article_node->save();
  youtube_avatar_expect(count($request_history) === 1, 'A populated avatar and complete metadata must skip the lookup.');
  $article_node->set('field_youtube_channel_avatar', 'https://yt3.ggpht.com/editor-avatar');
  $article_node->set('field_consumption_time_minutes', NULL);
  $mock_handler->append(new Response(200, [], $fixture_page));
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_channel_avatar')->value === 'https://yt3.ggpht.com/editor-avatar', 'Metadata refresh must preserve an existing avatar.');

  $article_node->set('field_youtube_channel_avatar', NULL);
  $mock_handler->append(new ConnectException('Simulated timeout', new Request('GET', 'https://www.youtube.com/watch?v=abcdefghijk')));
  $article_node->save();
  $node_storage->resetCache([$article_node->id()]);
  $article_node = Node::load($article_node->id());
  youtube_avatar_expect($article_node->get('field_youtube_channel_avatar')->isEmpty(), 'A failed lookup must allow saving with an empty avatar.');
  youtube_avatar_expect(count($request_history) === 3, 'An empty avatar must trigger a lookup even with complete metadata.');

  $mock_handler->append(new Response(200, [], '<html>Consent or unavailable page</html>'));
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_channel_avatar')->isEmpty(), 'Missing owner data must leave the avatar empty.');
  $mock_handler->append(new Response(200, [], $fixture_page));
  $article_node->save();
  $node_storage->resetCache([$article_node->id()]);
  $article_node = Node::load($article_node->id());
  youtube_avatar_expect($article_node->get('field_youtube_channel_avatar')->value === $expected_avatar, 'A later save must retry and persist the recovered avatar.');
  youtube_avatar_expect(count($request_history) === 5, 'Every save with a missing avatar must retry once.');

  $article_node->set('field_youtube_video', NULL);
  $article_node->set('field_youtube_channel_avatar', NULL);
  $article_node->save();
  youtube_avatar_expect(count($request_history) === 5, 'Articles without YouTube must not request an avatar.');

  $article_node->set('field_youtube_video', ['input' => 'https://www.youtube.com/watch?v=lmnopqrstuv', 'video_id' => 'lmnopqrstuv']);
  $mock_handler->append(new Response(200, [], $collaboration_page));
  $article_node->save();
  $node_storage->resetCache([$article_node->id()]);
  $article_node = Node::load($article_node->id());
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_name')->value === 'Second fixture channel', 'The second channel name must persist on save.');
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_url')->uri === 'https://www.youtube.com/channel/UC' . str_repeat('b', 22), 'The second channel link must persist.');
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_avatar')->value === 'https://yt3.ggpht.com/second-avatar', 'The second avatar must persist.');
  $article_node->save();
  youtube_avatar_expect(count($request_history) === 6, 'Complete collaboration credits must skip repeated lookups.');

  // Render the actual shared Drupal Twig, with the same stored-data preprocess.
  require_once DRUPAL_ROOT . '/themes/custom/jurenites_theme/jurenites_theme.theme';
  $node_variables = ['node' => $article_node, 'elements' => []];
  jurenites_theme_add_youtube_metadata($node_variables);
  $byline_build = [
    '#type' => 'inline_template',
    '#template' => "{% include '@jurenites_theme/components/author-byline.html.twig' with byline_values only %}",
    '#context' => ['byline_values' => [
      'author_name_text' => $node_variables['youtube_author_name'],
      'author_url' => $node_variables['youtube_author_url'],
      'author_avatar_image' => $node_variables['youtube_author_avatar'],
      'author_avatar_initials' => $node_variables['youtube_author_initials'],
      'coauthor_name_text' => $node_variables['youtube_coauthor_name'],
      'coauthor_url' => $node_variables['youtube_coauthor_url'],
      'coauthor_avatar_image' => $node_variables['youtube_coauthor_avatar'],
      'coauthor_avatar_initials' => $node_variables['youtube_coauthor_initials'],
      'avatar_size' => 'small',
    ]],
  ];
  $rendered_byline = (string) \Drupal::service('renderer')->renderRoot($byline_build);
  $byline_document = new DOMDocument();
  @$byline_document->loadHTML($rendered_byline);
  $byline_query = new DOMXPath($byline_document);
  youtube_avatar_expect($byline_query->query('//div[@data-jurenites-avatar]')->length === 2, 'Drupal must render both shared avatars.');
  youtube_avatar_expect($byline_query->query('//span[@class="author-identity__coauthor-separator" and text()="&"]')->length === 1, 'Drupal must separate the two names with an ampersand.');
  youtube_avatar_expect($byline_query->query('//a')->length === 2, 'Both channel names must link independently.');
  youtube_avatar_expect($byline_query->query('//img[@width or @height or @style]')->length === 0, 'Avatar dimensions must remain in SCSS.');
  file_put_contents(sys_get_temp_dir() . '/youtube-coauthor-drupal.html', $rendered_byline);

  $article_node->set('field_youtube_coauthor_avatar', 'https://yt3.ggpht.com/editor-second-avatar');
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_avatar')->value === 'https://yt3.ggpht.com/editor-second-avatar', 'Manual second-avatar corrections must be preserved.');
  $article_node->set('field_youtube_coauthor_avatar', NULL);
  \Drupal::cache('data')->delete('jurenites_blog:youtube_channels:' . hash('sha256', 'https://www.youtube.com/watch?v=lmnopqrstuv'));
  $mock_handler->append(new Response(503));
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_avatar')->isEmpty(), 'A failed second-avatar lookup must still allow saving.');
  $mock_handler->append(new Response(200, [], $collaboration_page));
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_avatar')->value === 'https://yt3.ggpht.com/second-avatar', 'The next save must retry the missing second avatar.');
  $article_node->set('field_youtube_video', ['input' => 'https://www.youtube.com/watch?v=zyxwvutsrqp', 'video_id' => 'zyxwvutsrqp']);
  $mock_handler->append(new Response(200, [], $fixture_page));
  $article_node->save();
  youtube_avatar_expect($article_node->get('field_youtube_coauthor_name')->isEmpty(), 'Changing to a single-channel video must clear the previous collaborator.');
  echo "PASS: single and dual channel save/retry, existing values, failures, source changes, and shared Drupal byline rendering.\n";
}
finally {
  $database_transaction->rollBack();
  foreach ($original_services as $service_name => $original_service) {
    $service_container->set($service_name, $original_service);
  }
  $node_storage->resetCache();
  \Drupal::entityTypeManager()->getStorage('file')->resetCache();
}
