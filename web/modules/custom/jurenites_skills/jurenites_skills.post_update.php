<?php

/**
 * @file
 * Updates the editable skills profile on existing sites.
 */

use Drupal\Core\Field\FieldPurger;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;

/**
 * Removes the obsolete CV evidence field and purges all stored revisions.
 */
function jurenites_skills_post_update_remove_skill_evidence(array &$sandbox): string {
  FieldStorageConfig::loadByName('paragraph', 'field_skill_evidence')?->delete();

  $deleted_repository = \Drupal::service('entity_field.deleted_fields_repository');
  foreach ($deleted_repository->getFieldStorageDefinitions() as $field_storage) {
    if ($field_storage->getTargetEntityTypeId() === 'paragraph'
      && $field_storage->getName() === 'field_skill_evidence') {
      \Drupal::service(FieldPurger::class)->purgeBatch(
        50, $field_storage->getUniqueStorageIdentifier(),
      );
    }
  }

  $sandbox['#finished'] = 1;
  foreach ($deleted_repository->getFieldStorageDefinitions() as $field_storage) {
    if ($field_storage->getTargetEntityTypeId() === 'paragraph'
      && $field_storage->getName() === 'field_skill_evidence') {
      $sandbox['#finished'] = 0;
      break;
    }
  }

  return t('Removed the technology skill CV evidence field, its storage and all revision values.');
}

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
