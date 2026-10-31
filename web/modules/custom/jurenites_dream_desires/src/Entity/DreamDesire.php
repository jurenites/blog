<?php

namespace Drupal\jurenites_dream_desires\Entity;

use Drupal\Core\Entity\Attribute\ContentEntityType;
use Drupal\Core\Entity\ContentEntityBase;
use Drupal\Core\Entity\EntityTypeInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Field\BaseFieldDefinition;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\jurenites_dream_desires\PrivateEntityAccess;

#[ContentEntityType(
  id: 'dream_desire',
  label: new TranslatableMarkup('Personal desire'),
  base_table: 'dream_desire',
  entity_keys: ['id' => 'id', 'uuid' => 'uuid'],
  handlers: ['access' => PrivateEntityAccess::class],
  admin_permission: 'administer dream desires',
)]
final class DreamDesire extends ContentEntityBase {

  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $base_fields = parent::baseFieldDefinitions($entity_type);
    $base_fields['device_id'] = BaseFieldDefinition::create('entity_reference')->setLabel(t('Device id'))->setSetting('target_type', 'dream_device');
    $base_fields['topic_key'] = BaseFieldDefinition::create('string')->setLabel(t('Topic key'))->setSetting('max_length', 32);
    $base_fields['desire_text'] = BaseFieldDefinition::create('string_long')->setLabel(t('Desire text'));
    $base_fields['payload_hash'] = BaseFieldDefinition::create('string')->setLabel(t('Payload hash'))->setSetting('max_length', 64);
    $base_fields['status'] = BaseFieldDefinition::create('string')->setLabel(t('Status'))->setSetting('max_length', 24)->setDefaultValue('queued');
    $base_fields['image_file'] = BaseFieldDefinition::create('entity_reference')->setLabel(t('Image file'))->setSetting('target_type', 'file');
    $base_fields['reference_file'] = BaseFieldDefinition::create('entity_reference')->setLabel(t('Temporary selfie'))->setSetting('target_type', 'file');
    $base_fields['error_code'] = BaseFieldDefinition::create('string')->setLabel(t('Error code'))->setSetting('max_length', 64);
    $base_fields['model_name'] = BaseFieldDefinition::create('string')->setLabel(t('Model name'))->setSetting('max_length', 100);
    $base_fields['created'] = BaseFieldDefinition::create('created')->setLabel(t('Created'));
    $base_fields['changed'] = BaseFieldDefinition::create('changed')->setLabel(t('Changed'));
    $base_fields['attempted'] = BaseFieldDefinition::create('timestamp')->setLabel(t('Attempted'));
    return $base_fields;
  }

  public static function postDelete(EntityStorageInterface $entity_storage, array $deleted_entities) {
    parent::postDelete($entity_storage, $deleted_entities);
    foreach ($deleted_entities as $deleted_entity) {
      foreach (['image_file', 'reference_file'] as $field_name) {
      if ($image_file = $deleted_entity->get($field_name)->entity) {
        \Drupal::service('file.usage')->delete($image_file, 'jurenites_dream_desires', 'dream_desire', $deleted_entity->id());
        $image_file->delete();
      }
      }
    }
  }

}
