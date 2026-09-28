<?php

/**
 * @file
 * Migrates editorial rich text to the site's single authoring format.
 */

/**
 * Migrates live and historical content before removing obsolete formats.
 */
function jurenites_admin_configure_full_html(): int {
  $full_format = \Drupal\filter\Entity\FilterFormat::load('full_html');
  if ($full_format === NULL || \Drupal\editor\Entity\Editor::load('full_html') === NULL) {
    throw new \RuntimeException('Full HTML and its editor must exist before migrating content.');
  }
  $full_format->enable()->set('weight', -10)->save();
  $database_connection = \Drupal::database();
  $updated_row_count = 0;
  $obsolete_formats = ['basic_html', 'restricted_html'];

  // Use Drupal's storage mapping to include translations and all revisions,
  // without resaving entities, creating revisions, or changing authored copy.
  foreach (\Drupal::entityTypeManager()->getDefinitions() as $entity_type_id => $entity_definition) {
    if (!$entity_definition->entityClassImplements(\Drupal\Core\Entity\FieldableEntityInterface::class)) {
      continue;
    }
    $entity_storage = \Drupal::entityTypeManager()->getStorage($entity_type_id);
    if (!$entity_storage instanceof \Drupal\Core\Entity\Sql\SqlContentEntityStorage) {
      continue;
    }
    $table_mapping = $entity_storage->getTableMapping();
    foreach (\Drupal::service('entity_field.manager')->getFieldStorageDefinitions($entity_type_id) as $field_name => $field_definition) {
      if (!in_array($field_definition->getType(), ['text', 'text_long', 'text_with_summary'], TRUE)) {
        continue;
      }
      $format_column = $table_mapping->getColumnNames($field_name)['format'];
      foreach ($table_mapping->getTableNames() as $table_name) {
        if (!in_array($field_name, $table_mapping->getFieldNames($table_name), TRUE)
          || !$database_connection->schema()->tableExists($table_name)) {
          continue;
        }
        // Restricted HTML supplied paragraph breaks at render time. Store
        // those breaks explicitly because Full HTML has no auto-paragraph filter.
        $field_columns = $table_mapping->getColumnNames($field_name);
        foreach (['value', 'summary'] as $text_property) {
          if (!isset($field_columns[$text_property])) {
            continue;
          }
          $text_column = $field_columns[$text_property];
          $stored_values = $database_connection->select($table_name, 'content_rows')
            ->fields('content_rows', [$text_column])
            ->condition($format_column, 'restricted_html')
            ->distinct()->execute()->fetchCol();
          $paragraph_filter = \Drupal::service('plugin.manager.filter')->createInstance('filter_autop');
          foreach ($stored_values as $stored_value) {
            if ($stored_value === NULL || $stored_value === '') {
              continue;
            }
            $paragraph_markup = (string) $paragraph_filter->process($stored_value, 'und');
            if ($paragraph_markup !== $stored_value) {
              $database_connection->update($table_name)
                ->fields([$text_column => $paragraph_markup])
                ->condition($format_column, 'restricted_html')
                ->condition($text_column, $stored_value)->execute();
            }
          }
        }
        $updated_row_count += $database_connection->update($table_name)
          ->fields([$format_column => 'full_html'])
          ->condition($format_column, $obsolete_formats, 'IN')
          ->execute();
      }
    }
    $entity_storage->resetCache();
  }

  foreach (\Drupal\field\Entity\FieldConfig::loadMultiple() as $field_config) {
    if (!in_array($field_config->getType(), ['text', 'text_long', 'text_with_summary'], TRUE)) {
      continue;
    }
    $default_values = $field_config->getDefaultValueLiteral();
    foreach ($default_values as &$default_item) {
      $default_item['format'] = 'full_html';
    }
    unset($default_item);
    $field_config->setSetting('allowed_formats', ['full_html'])
      ->setDefaultValue($default_values)->save();
  }

  // Only trusted editorial roles inherit Full HTML. Public roles retain their
  // existing content permissions and Drupal's plain-text safety fallback.
  foreach (\Drupal\user\Entity\Role::loadMultiple() as $user_role) {
    $has_editor_format = $user_role->hasPermission('use text format basic_html')
      || $user_role->hasPermission('use text format restricted_html')
      || $user_role->id() === 'content_editor';
    if ($has_editor_format && !in_array($user_role->id(), ['anonymous', 'authenticated'], TRUE)) {
      $user_role->grantPermission('use text format full_html');
    }
    foreach ($obsolete_formats as $format_name) {
      $user_role->revokePermission('use text format ' . $format_name);
    }
    $user_role->save();
  }

  // Carry the existing custom authoring capabilities into Full HTML.
  if (\Drupal::moduleHandler()->moduleExists('jurenites_life')) {
    jurenites_life_configure_examples();
    jurenites_life_configure_example_tables();
  }
  foreach ($obsolete_formats as $format_name) {
    \Drupal\editor\Entity\Editor::load($format_name)?->delete();
    \Drupal\filter\Entity\FilterFormat::load($format_name)?->delete();
  }
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  \Drupal::service('cache_tags.invalidator')->invalidateTags(['rendered']);
  return $updated_row_count;
}
