<?php

/**
 * @file
 * Updates the editable skills profile on existing sites.
 */

use Drupal\Core\Field\FieldPurger;
use Drupal\field\Entity\FieldConfig;

/**
 * Removes the obsolete skills heading and introduction, including stored data.
 */
function jurenites_skills_post_update_remove_section_copy(array &$sandbox): string {
  $removed_fields = ['field_skills_heading', 'field_skills_intro'];
  foreach ($removed_fields as $field_name) {
    FieldConfig::loadByName('block_content', 'skills_profile', $field_name)?->delete();
  }

  $deleted_repository = \Drupal::service('entity_field.deleted_fields_repository');
  foreach ($deleted_repository->getFieldDefinitions() as $field_definition) {
    if ($field_definition->getTargetEntityTypeId() === 'block_content'
      && $field_definition->getTargetBundle() === 'skills_profile'
      && in_array($field_definition->getName(), $removed_fields, TRUE)) {
      \Drupal::service(FieldPurger::class)->purgeBatch(
        50, $field_definition->getFieldStorageDefinition()->getUniqueStorageIdentifier(),
      );
    }
  }

  $sandbox['#finished'] = 1;
  foreach ($deleted_repository->getFieldDefinitions() as $field_definition) {
    if ($field_definition->getTargetEntityTypeId() === 'block_content'
      && $field_definition->getTargetBundle() === 'skills_profile'
      && in_array($field_definition->getName(), $removed_fields, TRUE)) {
      $sandbox['#finished'] = 0;
      break;
    }
  }

  return t('Removed the Skills profile heading and introduction fields and their stored values.');
}
