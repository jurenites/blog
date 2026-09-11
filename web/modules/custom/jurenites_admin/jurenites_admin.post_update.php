<?php

/**
 * @file
 * Post-update functions for Jurenites Admin.
 */

use Drupal\comment\CommentInterface;
use Drupal\comment\Plugin\Field\FieldType\CommentItemInterface;
use Drupal\field\Entity\FieldConfig;

/**
 * Closes every comment field and makes closed the default for new content.
 */
function jurenites_admin_post_update_disable_all_comments(): string {
  $entity_field_manager = \Drupal::service('entity_field.manager');
  $comment_field_map = $entity_field_manager->getFieldMapByFieldType('comment');

  foreach ($comment_field_map as $entity_type_id => $comment_fields) {
    $entity_storage = \Drupal::entityTypeManager()->getStorage($entity_type_id);

    foreach ($comment_fields as $field_name => $field_details) {
      foreach (array_keys($field_details['bundles']) as $bundle_name) {
        $field_config = FieldConfig::loadByName(
          $entity_type_id,
          $bundle_name,
          $field_name,
        );
        if ($field_config !== NULL) {
          $default_values = $field_config->getDefaultValueLiteral();
          $default_values[0]['status'] = CommentItemInterface::CLOSED;
          $field_config->setDefaultValue($default_values)->save();
        }

        $open_entity_ids = \Drupal::entityQuery($entity_type_id)
          ->accessCheck(FALSE)
          ->condition($entity_storage->getEntityType()->getKey('bundle'), $bundle_name)
          ->condition($field_name . '.status', CommentItemInterface::OPEN)
          ->execute();

        foreach ($entity_storage->loadMultiple($open_entity_ids) as $commented_entity) {
          $commented_entity->get($field_name)->status = CommentItemInterface::CLOSED;
          $commented_entity->save();
        }
      }
    }
  }

  return t('Closed all comment fields and disabled comments by default.');
}

/**
 * Reopens Article comments for the restricted personal author role.
 */
function jurenites_admin_post_update_enable_personal_article_comments(): string {
  $updated_article_count = jurenites_admin_configure_article_comments();

  return t(
    'Enabled personal Article comments and reopened @count existing Articles.',
    ['@count' => $updated_article_count],
  );
}

/**
 * Adds token-backed typography choices to CKEditor body text formats.
 */
function jurenites_admin_post_update_add_editor_typography(): string {
  $updated_editor_count = jurenites_admin_configure_editor_typography();

  return t(
    'Added the project typography list to @count CKEditor text formats.',
    ['@count' => $updated_editor_count],
  );
}

/**
 * Shortens the CKEditor typography labels to the role names.
 */
function jurenites_admin_post_update_shorten_editor_typography_labels(): string {
  $updated_editor_count = jurenites_admin_configure_editor_typography();

  return t(
    'Shortened typography labels in @count CKEditor text formats.',
    ['@count' => $updated_editor_count],
  );
}

/**
 * Replaces the retired Code typography role with Machine readable.
 */
function jurenites_admin_post_update_replace_code_typography(): string {
  $updated_editor_count = jurenites_admin_configure_editor_typography();
  $updated_content_count = 0;
  $database_connection = \Drupal::database();

  foreach (['node__body', 'node_revision__body'] as $body_table_name) {
    if (!$database_connection->schema()->tableExists($body_table_name)) {
      continue;
    }

    $updated_content_count += $database_connection->update($body_table_name)
      ->expression(
        'body_value',
        'REPLACE(body_value, :obsolete_class, :replacement_class)',
        [
          ':obsolete_class' => 'u-typography-code',
          ':replacement_class' => 'u-typography-machine-readable',
        ],
      )
      ->condition('body_value', '%u-typography-code%', 'LIKE')
      ->execute();
  }

  return t(
    'Replaced Code typography with Machine readable in @editor_count CKEditor text formats and @content_count content rows.',
    [
      '@editor_count' => $updated_editor_count,
      '@content_count' => $updated_content_count,
    ],
  );
}

/**
 * Assigns the existing Russian Article comment to the Russian thread.
 */
function jurenites_admin_post_update_separate_article_comments_by_language(): string {
  $comment_language_assignments = [
    '1c47d445-f500-4406-b9ac-12e828b095e2' => 'ru',
  ];
  $comment_storage = \Drupal::entityTypeManager()->getStorage('comment');
  $updated_comment_count = 0;

  foreach ($comment_language_assignments as $comment_uuid => $comment_language_id) {
    $matching_comments = $comment_storage->loadByProperties(['uuid' => $comment_uuid]);
    $comment_entity = reset($matching_comments);
    if (!$comment_entity instanceof CommentInterface
      || $comment_entity->getCommentedEntity()?->bundle() !== 'article'
      || $comment_entity->language()->getId() === $comment_language_id) {
      continue;
    }

    $comment_entity->set('langcode', $comment_language_id);
    $comment_entity->save();
    $updated_comment_count++;
  }

  return t(
    'Separated Article comments by language and reassigned @count existing comment.',
    ['@count' => $updated_comment_count],
  );
}

/**
 * Enables deletion of an editor's own Article comments.
 */
function jurenites_admin_post_update_allow_own_article_comment_deletion(): string {
  $content_editor_role = \Drupal\user\Entity\Role::load('content_editor');
  if ($content_editor_role !== NULL) {
    $content_editor_role->grantPermission('delete own article comments')->save();
  }

  return t('Content editors can delete their own Article comments through the contextual menu.');
}

