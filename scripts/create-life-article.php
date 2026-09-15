<?php

declare(strict_types=1);

/**
 * @file
 * Run after enabling jurenites_life: drush php:script scripts/create-life-article.php
 * Creates the DEV-ready post once; subsequent runs preserve editorial changes.
 */

use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Drupal\user\Entity\User;

if (!\Drupal::moduleHandler()->moduleExists('jurenites_life')) {
  throw new RuntimeException('Enable jurenites_life first.');
}
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_nodes = $node_storage->loadByProperties(['uuid' => JURENITES_LIFE_ARTICLE_UUID]);
if ($existing_nodes) {
  $existing_node = reset($existing_nodes);
  echo 'Article already exists; editorial content preserved. Node ' . $existing_node->id() . PHP_EOL;
  return;
}
$article_alias = '/blog/conways-game-of-life';
$article_data = json_decode(file_get_contents(__DIR__ . '/content/conway-game-of-life.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$article_body = file_get_contents(__DIR__ . '/content/conway-game-of-life.html');
if ($entity_manager->getStorage('path_alias')->loadByProperties(['alias' => $article_alias]) || $node_storage->loadByProperties(['type' => 'article', 'title' => $article_data['article_title']])) {
  throw new RuntimeException('A matching Article or alias already exists. Review before creating a duplicate.');
}
$author_accounts = $entity_manager->getStorage('user')->loadByProperties(['name' => 'alexander']);
if (!$author_accounts) throw new RuntimeException('The alexander author account is required.');
$author_account = reset($author_accounts);
$database_transaction = \Drupal::database()->startTransaction();
try {
  $tag_references = [];
  foreach ($article_data['article_tags'] as $tag_name) {
    $matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => $tag_name]);
    $article_term = $matching_terms ? reset($matching_terms) : Term::create(['vid' => 'tags', 'name' => $tag_name]);
    if ($article_term->isNew()) $article_term->save();
    $tag_references[] = ['target_id' => $article_term->id()];
  }
  $video_references = [];
  foreach ($article_data['supporting_videos'] as $video_data) {
    $matching_media = $entity_manager->getStorage('media')->loadByProperties(['uuid' => $video_data['media_uuid']]);
    $video_media = $matching_media ? reset($matching_media) : Media::create([
      'bundle' => 'remote_video', 'uuid' => $video_data['media_uuid'], 'langcode' => 'en',
      'name' => $video_data['video_title'], 'uid' => $author_account->id(), 'status' => TRUE,
      'field_media_oembed_video' => ['value' => $video_data['video_url']],
    ]);
    if ($video_media->isNew()) {
      $media_errors = $video_media->validate();
      if ($media_errors->count()) throw new RuntimeException((string) $media_errors);
      $video_media->save();
    }
    $video_references[] = ['target_id' => $video_media->id()];
  }
  $article_node = Node::create([
    'type' => 'article', 'uuid' => JURENITES_LIFE_ARTICLE_UUID, 'uid' => $author_account->id(),
    'langcode' => 'en', 'title' => $article_data['article_title'], 'status' => TRUE, 'promote' => FALSE,
    'body' => ['value' => $article_body, 'summary' => $article_data['article_summary'], 'format' => 'basic_html'],
    'field_consumption_time_minutes' => (int) ceil(str_word_count(strip_tags($article_body)) / 200),
    'field_tags' => $tag_references, 'field_supporting_videos' => $video_references,
    'path' => ['alias' => $article_alias, 'pathauto' => FALSE],
  ]);
  $account_switcher = \Drupal::service('account_switcher');
  // Provision as the site administrator, while retaining Alexander's authorship.
  // The author's restricted comment role does not grant Basic HTML editing.
  $account_switcher->switchTo(User::load(1));
  try {
    $validation_errors = $article_node->validate();
    if ($validation_errors->count()) throw new RuntimeException((string) $validation_errors);
    $article_node->save();
  }
  finally {
    $account_switcher->switchBack();
  }
}
catch (\Throwable $creation_error) {
  $database_transaction->rollBack();
  throw $creation_error;
}
unset($database_transaction);
echo 'Created ' . $article_alias . '; node ' . $article_node->id() . ', with two supporting videos.' . PHP_EOL;
