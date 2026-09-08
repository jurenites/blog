<?php

/**
 * @file
 * Post-update functions for Jurenites Admin.
 */

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
