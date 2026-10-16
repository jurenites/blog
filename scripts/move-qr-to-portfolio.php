<?php

declare(strict_types=1);

/**
 * Convert the reviewed local QR article in place after taking a database backup.
 * Run: drush php:script scripts/move-qr-to-portfolio.php
 * Reruns preserve subsequent CMS edits. This is an explicit editorial migration.
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$article_node = Node::load(64);
if (!$article_node || $article_node->uuid() !== '7f04441b-50dd-469e-bd0b-e37991a530d9') {
  throw new RuntimeException('The reviewed QR article is missing.');
}
if ($article_node->bundle() === 'project') {
  echo 'QR is already a Portfolio Project; existing editorial content preserved.' . PHP_EOL;
  return;
}
if ($article_node->bundle() !== 'article' || (int) $article_node->getRevisionId() !== 720) {
  throw new RuntimeException('The reviewed article changed; inspect it before migration.');
}
$source_markup = file_get_contents(__DIR__ . '/../src/public/assets/images/dynamic-thumbnails/qr-pixel-studio.svg');
if (ThumbnailSvg::prepare($source_markup, 'qr-portfolio-verify') === NULL) {
  throw new RuntimeException('The supplied thumbnail is not a supported passive SVG.');
}
$project_fields = \Drupal::service('entity_field.manager')->getFieldDefinitions('node', 'project');
$preserved_fields = ['title', 'body', 'field_image', 'field_tags', 'field_supporting_videos', 'field_content_sections', 'uid', 'created', 'status'];
$translation_values = [];
$project_aliases = [];
foreach ($article_node->getTranslationLanguages() as $language_code => $language_entity) {
  $article_translation = $article_node->getTranslation($language_code);
  foreach ($preserved_fields as $field_name) {
    $translation_values[$language_code][$field_name] = $article_translation->get($field_name)->getValue();
  }
  if (!$article_translation->get('field_content_sections')->isEmpty()) {
    throw new RuntimeException('Review paragraph compatibility before migration.');
  }
  $original_alias = $article_translation->get('path')->alias;
  if (!str_starts_with($original_alias, '/blog/')) {
    throw new RuntimeException('Unexpected source alias.');
  }
  $project_aliases[$language_code] = '/portfolio/' . substr($original_alias, strlen('/blog/'));
  if (\Drupal::entityTypeManager()->getStorage('path_alias')->loadByProperties(['alias' => $project_aliases[$language_code]])) {
    throw new RuntimeException('The destination alias is already occupied.');
  }
}
if (\Drupal::entityQuery('comment')->accessCheck(FALSE)->condition('entity_type', 'node')->condition('entity_id', 64)->count()->execute()) {
  throw new RuntimeException('Review existing comments before converting this article.');
}
if (!\Drupal::moduleHandler()->moduleExists('redirect') || !\Drupal::config('redirect.settings')->get('auto_redirect')) {
  throw new RuntimeException('Automatic alias redirects must be enabled.');
}

$database_connection = \Drupal::database();
$database_transaction = $database_connection->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo($article_node->getOwner());
try {
  // Bundle changes need a storage update followed by a fresh entity load so
  // Drupal uses Project field definitions. Keep the node ID and revision IDs.
  $database_connection->update('node')->fields(['type' => 'project'])->condition('nid', 64)->execute();
  $database_connection->update('node_field_data')->fields(['type' => 'project'])->condition('nid', 64)->execute();
  foreach ($article_node->getFieldDefinitions() as $field_name => $field_definition) {
    if ($field_definition->getFieldStorageDefinition()->isBaseField()) {
      continue;
    }
    foreach (['node__', 'node_revision__'] as $table_prefix) {
      $table_name = $table_prefix . $field_name;
      if (!$database_connection->schema()->tableExists($table_name)) {
        continue;
      }
      if (isset($project_fields[$field_name])) {
        $database_connection->update($table_name)->fields(['bundle' => 'project'])->condition('entity_id', 64)->execute();
      }
      elseif (in_array($field_name, ['comment', 'field_consumption_time_minutes'], TRUE)) {
        // Article-only reading time and empty comment settings remain in backup.
        $database_connection->delete($table_name)->condition('entity_id', 64)->execute();
      }
      else {
        throw new RuntimeException('Unexpected article-only field: ' . $field_name);
      }
    }
  }
  $node_storage->resetCache([64]);
  $project_node = Node::load(64);
  $target_directory = 'public://dynamic-thumbnails';
  \Drupal::service('file_system')->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY);
  $thumbnail_file = \Drupal::service('file.repository')->writeData($source_markup, $target_directory . '/qr-pixel-studio.svg', FileExists::Rename);
  $thumbnail_file->setPermanent();
  $thumbnail_file->save();
  foreach ($project_aliases as $language_code => $project_alias) {
    $project_translation = $project_node->getTranslation($language_code);
    foreach ($translation_values[$language_code] as $field_name => $field_values) {
      if ($project_translation->get($field_name)->getValue() !== $field_values) {
        throw new RuntimeException('Content changed during conversion: ' . $language_code . '/' . $field_name);
      }
    }
    $path_values = $project_translation->get('path')->first()->getValue();
    $path_values['alias'] = $project_alias;
    $path_values['pathauto'] = FALSE;
    $project_translation->set('path', $path_values);
    $project_translation->set('field_dynamic_thumbnail', ['target_id' => $thumbnail_file->id()]);
    $validation_errors = $project_translation->validate();
    if ($validation_errors->count()) {
      throw new RuntimeException((string) $validation_errors);
    }
  }
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Move Human readable QR from Blog to Portfolio with the supplied QR Pixel Studio dynamic thumbnail; preserve both translations.');
  $project_node->save();
  echo 'Converted node 64 to Project, revision ' . $project_node->getRevisionId() . PHP_EOL;
  echo implode(PHP_EOL, $project_aliases) . PHP_EOL;
}
catch (Throwable $migration_error) {
  $database_transaction->rollBack();
  $node_storage->resetCache([64]);
  throw $migration_error;
}
finally {
  $account_switcher->switchBack();
}
