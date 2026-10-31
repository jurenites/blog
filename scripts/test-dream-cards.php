<?php

/**
 * @file
 * Local-only integration check. Run with drush php:script; cleans its fixtures.
 */

use Drupal\Core\File\FileSystemInterface;
use Drupal\file\Entity\File;
use Drupal\node\Entity\Node;
use Drupal\jurenites_dream_cards\Controller\DreamCardsController;
use Symfony\Component\HttpFoundation\Request;

$test_nodes = [];
$test_file = NULL;
$test_uri = '';
$check_count = 0;
$assert_check = static function (bool $test_result, string $check_name) use (&$check_count): void {
  if (!$test_result) {
    throw new RuntimeException($check_name);
  }
  $check_count++;
  print "PASS: $check_name\n";
};
$feed_controller = new DreamCardsController();
$read_feed = static function () use ($feed_controller): array {
  return json_decode($feed_controller->contentFeed(Request::create('/api/dream-cards/v1'))->getContent(), TRUE, 512, JSON_THROW_ON_ERROR);
};
try {
  $file_system = \Drupal::service('file_system');
  $test_directory = 'public://dream-card-tests';
  $file_system->prepareDirectory($test_directory, FileSystemInterface::CREATE_DIRECTORY);
  $test_uri = $test_directory . '/' . uniqid('api-check-', TRUE) . '.png';
  file_put_contents($test_uri, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jFZkAAAAASUVORK5CYII='));
  $test_file = File::create(['uri' => $test_uri, 'filename' => basename($test_uri), 'filemime' => 'image/png', 'status' => 1]);
  $test_file->save();
  $card_values = ['type' => 'dream_card', 'title' => 'Temporary API integration check', 'langcode' => 'ru', 'field_dream_topic' => 'travel', 'field_dream_text' => 'Откройте новое место.', 'field_dream_image' => ['target_id' => $test_file->id(), 'alt' => 'Тестовая картинка'], 'field_dream_weight' => -10000];
  $draft_node = Node::create($card_values + ['status' => 0]);$draft_node->save();$test_nodes[] = $draft_node;
  $live_node = Node::create($card_values + ['status' => 1]);$live_node->save();$test_nodes[] = $live_node;
  $feed_data = $read_feed();$card_ids = array_column($feed_data['cards'], 'id');
  $assert_check($feed_data['schema_version'] === 1, 'Versioned envelope');
  $assert_check(in_array($live_node->uuid(), $card_ids, TRUE), 'Published card is visible anonymously');
  $assert_check(!in_array($draft_node->uuid(), $card_ids, TRUE), 'Draft card is excluded');
  $card_item = array_values(array_filter($feed_data['cards'], static fn(array $card_row): bool => $card_row['id'] === $live_node->uuid()))[0];
  $assert_check($card_item['topic'] === 'travel' && $card_item['text'] === 'Откройте новое место.', 'Topic and Russian text are mapped');
  $assert_check(str_contains($card_item['image_url'], '/dream-card-tests/') && $card_item['image_revision'] !== '', 'Public image URL and revision are present');
  $assert_check(!isset($card_item['uid']) && !isset($card_item['title']), 'Only the mobile allowlist is exported');
  $first_revision = $feed_data['revision'];
  $live_node->set('field_dream_text', 'Сделайте следующий шаг.')->save();
  $updated_feed = $read_feed();
  $assert_check($updated_feed['revision'] !== $first_revision, 'Editing text changes feed revision');
  $not_modified = $feed_controller->contentFeed(Request::create('/api/dream-cards/v1', 'GET', [], [], [], ['HTTP_IF_NONE_MATCH' => '"' . $updated_feed['revision'] . '"']));
  $assert_check($not_modified->getStatusCode() === 304, 'Matching ETag receives 304');
  $live_node->setUnpublished()->save();
  $assert_check(!in_array($live_node->uuid(), array_column($read_feed()['cards'], 'id'), TRUE), 'Unpublishing removes the card');
  $invalid_node = Node::create($card_values);$invalid_node->set('field_dream_text', str_repeat('я', 321));
  $assert_check($invalid_node->validate()->count() > 0, 'Overlong reminder fails entity validation');
  $new_node = Node::create(['type' => 'dream_card']);
  $assert_check(!$new_node->isPublished() && !$new_node->isPromoted(), 'New cards default to draft and are not promoted');
  foreach (\Drupal\jurenites_dream_cards\TopicCatalog::TOPIC_LABELS as $topic_key => $topic_label) {
    $live_node->set('field_dream_topic', $topic_key)->setPublished()->save();
    $assert_check(count($live_node->get('field_dream_topic')->validate()) === 0, "Category accepts $topic_key");
    $topic_cards = array_values(array_filter($read_feed()['cards'], static fn(array $card_row): bool => $card_row['id'] === $live_node->uuid()));
    $assert_check(count($topic_cards) === 1 && $topic_cards[0]['topic'] === $topic_key, "API exports $topic_key");
  }
  print "PASS: $check_count Drupal dream-card checks.\n";
}
finally {
  foreach ($test_nodes as $test_node) {$test_node->delete();}
  if ($test_file) {$test_file->delete();}
  if ($test_uri !== '' && file_exists($test_uri)) {unlink($test_uri);}
}
