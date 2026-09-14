<?php

/**
 * @file
 * One-time Article/Video split, preserving node and revision identities.
 */

use Drupal\Core\Cache\Cache;
use Drupal\field\Entity\FieldConfig;
use Drupal\node\Entity\NodeType;
use Drupal\views\Entity\View;

/**
 * Splits the configured Article model and migrates YouTube entries in place.
 */
function jurenites_blog_split_video_content_type(): int {
  if (\Drupal::state()->get('jurenites_blog.video_content_type_split')) {
    return 0;
  }

  $entity_manager = \Drupal::entityTypeManager();
  $article_type = NodeType::load('article');
  $frontpage_view = View::load('frontpage');
  if (!$article_type || !$frontpage_view || !FieldConfig::loadByName('node', 'article', 'field_youtube_video')) {
    throw new \RuntimeException('The configured Article YouTube fields and Frontpage View are required before splitting Video content.');
  }
  $display_settings = $frontpage_view->get('display');
  foreach (['page_2', 'page_3', 'block_1'] as $display_identifier) {
    if (!isset($display_settings[$display_identifier]['display_options']['filters']['type'])) {
      throw new \RuntimeException('Missing explicit content type filter on Frontpage ' . $display_identifier . '.');
    }
  }
  if (NodeType::load('video')) {
    throw new \RuntimeException('A Video type already exists without the split completion marker; inspect it before migrating.');
  }

  $database_connection = \Drupal::database();
  $migration_transaction = $database_connection->startTransaction();
  try {
    $video_definition = $article_type->toArray();
    unset($video_definition['uuid'], $video_definition['_core']);
    $video_definition['type'] = 'video';
    $video_definition['name'] = 'Video';
    $video_definition['description'] = 'A recommended YouTube video with creator credits and optional commentary.';
    $video_definition['help'] = 'Paste a YouTube link. Creator credits, publication date, duration, and an empty thumbnail are filled automatically on save.';
    NodeType::create($video_definition)->save();

    // Reuse the same field storage, including paragraphs and comment references.
    $article_fields = $entity_manager->getStorage('field_config')->loadByProperties([
      'entity_type' => 'node', 'bundle' => 'article',
    ]);
    foreach ($article_fields as $article_field) {
      $field_definition = $article_field->toArray();
      unset($field_definition['uuid'], $field_definition['_core'], $field_definition['dependencies']);
      $field_definition['id'] = 'node.video.' . $article_field->getName();
      $field_definition['bundle'] = 'video';
      if ($article_field->getName() === 'field_youtube_video') {
        $field_definition['required'] = TRUE;
      }
      FieldConfig::create($field_definition)->save();
    }

    foreach (['entity_form_display', 'entity_view_display', 'base_field_override'] as $entity_type_id) {
      $config_storage = $entity_manager->getStorage($entity_type_id);
      $source_entities = $config_storage->loadByProperties([
        $entity_type_id === 'base_field_override' ? 'entity_type' : 'targetEntityType' => 'node',
        'bundle' => 'article',
      ]);
      foreach ($source_entities as $source_entity) {
        $config_values = $source_entity->toArray();
        unset($config_values['uuid'], $config_values['_core'], $config_values['dependencies']);
        $config_values['id'] = str_replace('node.article.', 'node.video.', $source_entity->id());
        $config_values['bundle'] = 'video';
        $config_storage->create($config_values)->save();
      }
    }

    $language_storage = $entity_manager->getStorage('language_content_settings');
    if ($article_language = $language_storage->load('node.article')) {
      $language_values = $article_language->toArray();
      unset($language_values['uuid'], $language_values['_core'], $language_values['dependencies']);
      $language_values['id'] = 'node.video';
      $language_values['target_bundle'] = 'video';
      $language_storage->create($language_values)->save();
    }

    // Copy translated field labels and display settings, not Article's type name.
    $config_storage = \Drupal::service('config.storage');
    foreach ($config_storage->getAllCollectionNames() as $collection_name) {
      if (!str_starts_with($collection_name, 'language.')) {
        continue;
      }
      $collection_storage = $config_storage->createCollection($collection_name);
      foreach (['field.field.node.article.', 'core.entity_form_display.node.article.', 'core.entity_view_display.node.article.', 'core.base_field_override.node.article.'] as $config_prefix) {
        foreach ($collection_storage->listAll($config_prefix) as $config_name) {
          $collection_storage->write(str_replace('node.article.', 'node.video.', $config_name), $collection_storage->read($config_name));
        }
      }
    }

    \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
    $node_storage = $entity_manager->getStorage('node');
    // Any current translation containing a primary URL makes the node a Video.
    $video_node_ids = $database_connection->select('node__field_youtube_video', 'video_field')
      ->fields('video_field', ['entity_id'])->condition('bundle', 'article')
      ->condition('deleted', 0)->condition('field_youtube_video_input', '', '<>')
      ->distinct()->execute()->fetchCol();
    jurenites_blog_migrate_video_nodes($video_node_ids);

    foreach (['page_2' => 'article', 'page_3' => 'video', 'block_1' => 'article'] as $display_identifier => $bundle_name) {
      $display_options = &$display_settings[$display_identifier]['display_options'];
      $display_options['filters']['type']['value'] = [$bundle_name => $bundle_name];
      unset($display_options['filters']['field_youtube_video_video_id']);
      unset($display_options);
    }
    $frontpage_view->set('display', $display_settings)->save();

    // Equivalent editorial rights; never grant a right absent on Article.
    foreach ($entity_manager->getStorage('user_role')->loadMultiple() as $user_role) {
      foreach ($user_role->getPermissions() as $permission_name) {
        if (preg_match('/^(create|edit own|edit any|delete own|delete any) article content$|^(view|revert|delete) article revisions$|^translate article node$/', $permission_name)) {
          $user_role->grantPermission(str_replace(' article ', ' video ', $permission_name));
        }
      }
      if ($user_role->hasPermission('delete own article comments')) {
        $user_role->grantPermission('delete own video comments');
      }
      $user_role->save();
    }

    if (\Drupal::moduleHandler()->moduleExists('pathauto')) {
      jurenites_blog_preserve_video_aliases($video_node_ids);
      $pattern_storage = $entity_manager->getStorage('pathauto_pattern');
      if (!$pattern_storage->load('video_detail')) {
        $pattern_storage->create([
          'id' => 'video_detail', 'label' => 'Video detail URLs',
          'type' => 'canonical_entities:node', 'pattern' => '/videos/[node:title]',
          'selection_criteria' => [\Drupal::service('uuid')->generate() => [
            'id' => 'entity_bundle:node', 'negate' => FALSE,
            'context_mapping' => ['node' => 'node'], 'bundles' => ['video' => 'video'],
          ]],
          'selection_logic' => 'and', 'weight' => 0,
        ])->save();
      }
    }

    // Remove unused Article YouTube fields. Keep historical-only values hidden
    // when another environment has old Article revisions that still need them.
    $table_mapping = $node_storage->getTableMapping();
    foreach ($article_fields as $article_field) {
      $field_name = $article_field->getName();
      if (!str_starts_with($field_name, 'field_youtube_')) {
        continue;
      }
      $field_storage = $article_field->getFieldStorageDefinition();
      $has_archived_values = FALSE;
      foreach ([$table_mapping->getDedicatedDataTableName($field_storage), $table_mapping->getDedicatedRevisionTableName($field_storage)] as $table_name) {
        $has_archived_values = $has_archived_values || (bool) $database_connection->select($table_name, 'field_rows')
          ->condition('bundle', 'article')->countQuery()->execute()->fetchField();
      }
      if ($has_archived_values) {
        foreach (['entity_form_display', 'entity_view_display'] as $display_type) {
          foreach ($entity_manager->getStorage($display_type)->loadByProperties(['targetEntityType' => 'node', 'bundle' => 'article']) as $article_display) {
            $article_display->removeComponent($field_name)->save();
          }
        }
      }
      else {
        $article_field->delete();
      }
    }
    $article_type->set('description', 'A written blog article with optional images and supporting videos.')
      ->set('help', 'Write a blog article. Use the Video content type for a primary YouTube link.')->save();
    if ($supporting_field = FieldConfig::loadByName('node', 'article', 'field_supporting_videos')) {
      $supporting_field->setDescription('Optional films below the article. These do not change its Article content type.')->save();
    }
    \Drupal::state()->set('jurenites_blog.video_content_type_split', TRUE);
  }
  catch (\Throwable $migration_error) {
    $migration_transaction->rollBack();
    \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
    $entity_manager->clearCachedDefinitions();
    throw $migration_error;
  }
  unset($migration_transaction);
  $node_storage->resetCache();
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  Cache::invalidateTags(['node_list', 'node_list:article', 'node_list:video', 'config:views.view.frontpage']);
  \Drupal::service('router.builder')->setRebuildNeeded();
  return count($video_node_ids);
}

/**
 * Changes only bundle columns, including every field row and past revision.
 *
 * Entity save cannot change a bundle and would rerun metadata/alias generation.
 * In-place updates preserve IDs, UUIDs, dates, translations and revision links.
 */
function jurenites_blog_migrate_video_nodes(array $video_node_ids): void {
  if (!$video_node_ids) {
    return;
  }
  $database_connection = \Drupal::database();
  $node_storage = \Drupal::entityTypeManager()->getStorage('node');
  $table_mapping = $node_storage->getTableMapping();
  foreach (array_chunk($video_node_ids, 100) as $node_batch) {
    foreach ($table_mapping->getTableNames() as $table_name) {
      if ($database_connection->schema()->fieldExists($table_name, 'bundle')) {
        $database_connection->update($table_name)->fields(['bundle' => 'video'])
          ->condition('bundle', 'article')->condition('entity_id', $node_batch, 'IN')->execute();
      }
      elseif ($database_connection->schema()->fieldExists($table_name, 'type')) {
        $database_connection->update($table_name)->fields(['type' => 'video'])
          ->condition('type', 'article')->condition('nid', $node_batch, 'IN')->execute();
      }
    }
  }
  $node_storage->resetCache($video_node_ids);
  Cache::invalidateTags(array_map(static fn($node_identifier) => 'node:' . $node_identifier, $video_node_ids));
}

/**
 * Keeps migrated aliases stable when a Video is edited after the split.
 */
function jurenites_blog_preserve_video_aliases(array $video_node_ids): void {
  $node_storage = \Drupal::entityTypeManager()->getStorage('node');
  $alias_storage = \Drupal::entityTypeManager()->getStorage('path_alias');
  foreach ($node_storage->loadMultiple($video_node_ids) as $video_node) {
    if (!$alias_storage->loadByProperties(['path' => '/node/' . $video_node->id()])) {
      continue;
    }
    $pathauto_state = $video_node->get('path')->first()->get('pathauto');
    $pathauto_state->setValue(\Drupal\pathauto\PathautoState::SKIP);
    $pathauto_state->persist();
  }
  $node_storage->resetCache($video_node_ids);
}
