<?php

/**
 * @file
 * DEV check: VIDEO_SPLIT_PHASE=before drush php:script tests/video-content-type.php
 * Then apply updatedb and run again without the environment variable.
 */

use Drupal\node\Entity\Node;
use Drupal\views\Views;

function video_split_expect(bool $expected_condition, string $failure_message): void {
  if (!$expected_condition) {
    throw new RuntimeException($failure_message);
  }
}

$database_connection = \Drupal::database();
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$snapshot_path = sys_get_temp_dir() . '/article-video-split-snapshot.json';
$before_migration = getenv('VIDEO_SPLIT_PHASE') === 'before';
if ($before_migration) {
  $video_node_ids = $database_connection->select('node__field_youtube_video', 'video_field')
    ->fields('video_field', ['entity_id'])->condition('bundle', 'article')->condition('deleted', 0)
    ->condition('field_youtube_video_input', '', '<>')->distinct()->execute()->fetchCol();
  $snapshot_data = ['video_node_ids' => $video_node_ids, 'table_hashes' => []];
}
else {
  video_split_expect(is_file($snapshot_path), 'Capture the before-migration snapshot first.');
  $snapshot_data = json_decode(file_get_contents($snapshot_path), TRUE, flags: JSON_THROW_ON_ERROR);
  $video_node_ids = $snapshot_data['video_node_ids'];
}

$table_names = $before_migration ? array_merge($node_storage->getTableMapping()->getTableNames(), [
  'path_alias', 'path_alias_revision', 'comment', 'comment_field_data', 'comment__comment_body',
  'file_usage', 'taxonomy_index', 'paragraphs_item', 'paragraphs_item_field_data', 'paragraphs_item_revision',
]) : array_keys($snapshot_data['table_hashes']);
foreach ($table_names as $table_name) {
  if (!$database_connection->schema()->tableExists($table_name)) {
    continue;
  }
  $table_rows = [];
  foreach ($database_connection->select($table_name, 'stored_rows')->fields('stored_rows')->execute()->fetchAll(PDO::FETCH_ASSOC) as $table_row) {
    // The only permitted stored-content difference is the migrated node bundle.
    $node_identifier = $table_row['nid'] ?? $table_row['entity_id'] ?? NULL;
    if (in_array($node_identifier, $video_node_ids) && in_array($table_name, $node_storage->getTableMapping()->getTableNames(), TRUE)) {
      foreach (['bundle', 'type'] as $bundle_column) {
        if (($table_row[$bundle_column] ?? '') === 'article') {
          $table_row[$bundle_column] = 'video';
        }
      }
    }
    ksort($table_row);
    $table_rows[] = json_encode($table_row);
  }
  sort($table_rows);
  $table_hash = hash('sha256', json_encode($table_rows));
  if ($before_migration) {
    $snapshot_data['table_hashes'][$table_name] = $table_hash;
  }
  else {
    video_split_expect($table_hash === $snapshot_data['table_hashes'][$table_name], 'Unexpected content change in ' . $table_name);
  }
}
if ($before_migration) {
  file_put_contents($snapshot_path, json_encode($snapshot_data));
  print 'Captured content fingerprints for ' . count($table_names) . ' tables and ' . count($video_node_ids) . " Video candidates.\n";
  return;
}
print "Stored node values, translations, revisions, aliases, comments, file usage, tags and paragraph identities preserved.\n";

$article_node = Node::create(['type' => 'article', 'title' => 'Article form verification']);
$video_node = Node::create(['type' => 'video', 'title' => 'Video form verification']);
video_split_expect(!$article_node->hasField('field_youtube_video'), 'Article must no longer expose a primary YouTube field on this DEV database.');
video_split_expect($video_node->getFieldDefinition('field_youtube_video')->isRequired(), 'Video requires a YouTube link.');
video_split_expect($article_node->hasField('field_supporting_videos'), 'Written Articles keep supporting films.');
$video_violations = $video_node->validate();
video_split_expect(count($video_violations->getByField('field_youtube_video')) > 0, 'A Video without its required YouTube URL must fail validation.');
foreach ($video_node_ids as $node_identifier) {
  video_split_expect(Node::load($node_identifier)->bundle() === 'video', 'A YouTube entry was not migrated.');
  $migrated_video = Node::load($node_identifier);
  if (\Drupal::entityTypeManager()->getStorage('path_alias')->loadByProperties(['path' => '/node/' . $node_identifier])) {
    video_split_expect((int) $migrated_video->get('path')->pathauto === \Drupal\pathauto\PathautoState::SKIP, 'Migrated Video aliases must remain stable on edit.');
  }
}
foreach (['page_2' => 'article', 'page_3' => 'video', 'block_1' => 'article'] as $display_identifier => $bundle_name) {
  $listing_view = Views::getView('frontpage');
  $listing_view->setDisplay($display_identifier);
  $listing_view->execute();
  foreach ($listing_view->result as $result_row) {
    video_split_expect($result_row->_entity->bundle() === $bundle_name, 'Wrong content type in ' . $display_identifier);
  }
  print $display_identifier . ': ' . count($listing_view->result) . ' ' . $bundle_name . " rows.\n";
  $listing_view->destroy();
}
foreach (\Drupal\user\Entity\Role::loadMultiple() as $user_role) {
  foreach (['create', 'edit own', 'edit any', 'delete own', 'delete any'] as $operation_name) {
    video_split_expect($user_role->hasPermission($operation_name . ' article content') === $user_role->hasPermission($operation_name . ' video content'), 'Editorial access changed for ' . $user_role->id());
  }
}
require_once DRUPAL_ROOT . '/modules/custom/jurenites_blog/includes/video-content-type.inc';
video_split_expect(jurenites_blog_split_video_content_type() === 0, 'A completed migration must not run twice.');
print "Separate types, URL requirement, listing membership, equivalent editorial permissions and migration idempotence verified.\n";

// Verify Video discussions with temporary records, then restore the database.
$comment_transaction = $database_connection->startTransaction();
$comment_storage = \Drupal::entityTypeManager()->getStorage('comment');
try {
  $translated_video = NULL;
  foreach ($node_storage->loadMultiple($video_node_ids) as $candidate_video) {
    if ($candidate_video->hasTranslation('en') && $candidate_video->hasTranslation('ru')) {
      $translated_video = $candidate_video;
      break;
    }
  }
  video_split_expect($translated_video !== NULL, 'A bilingual Video is required for the comment check.');
  $comment_fixtures = [];
  foreach (['en', 'ru'] as $language_code) {
    $comment_entity = $comment_storage->create([
      'comment_type' => 'comment', 'entity_type' => 'node',
      'entity_id' => $translated_video->id(), 'field_name' => 'comment',
      'uid' => 1, 'status' => 1, 'subject' => 'Video comment verification',
      'comment_body' => ['value' => 'Temporary ' . $language_code . ' comment.', 'format' => 'plain_text'],
    ]);
    jurenites_admin_set_article_comment_language($comment_entity, $language_code);
    video_split_expect($comment_entity->language()->getId() === $language_code, 'Video comments must inherit their content language.');
    $comment_entity->save();
    $comment_fixtures[$language_code] = $comment_entity;
  }
  foreach ($comment_fixtures as $language_code => $comment_entity) {
    $comment_thread = $comment_storage->loadThread($translated_video->getTranslation($language_code), 'comment', \Drupal\comment\CommentManagerInterface::COMMENT_MODE_THREADED);
    $comment_identifiers = array_map(static fn($thread_comment) => $thread_comment->id(), $comment_thread);
    video_split_expect(in_array($comment_entity->id(), $comment_identifiers), 'The matching Video discussion is missing its comment.');
    foreach ($comment_thread as $thread_comment) {
      video_split_expect($thread_comment->language()->getId() === $language_code, 'Video discussions must not mix languages.');
    }
  }
  print "Video comments inherit the selected language and remain in separate English/Russian discussions.\n";
}
finally {
  $comment_transaction->rollBack();
  $comment_storage->resetCache();
  $node_storage->resetCache();
}
