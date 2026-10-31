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
  id: 'dream_device',
  label: new TranslatableMarkup('Dream device'),
  base_table: 'dream_device',
  entity_keys: ['id' => 'id', 'uuid' => 'uuid'],
  handlers: ['access' => PrivateEntityAccess::class],
  admin_permission: 'administer dream desires',
)]
final class DreamDevice extends ContentEntityBase {

  public static function baseFieldDefinitions(EntityTypeInterface $entity_type) {
    $base_fields = parent::baseFieldDefinitions($entity_type);
    $base_fields['token_hash'] = BaseFieldDefinition::create('string')->setLabel(t('Token hash'))->setSetting('max_length', 64);
    $base_fields['active'] = BaseFieldDefinition::create('boolean')->setLabel(t('Active'))->setDefaultValue(TRUE);
    $base_fields['created'] = BaseFieldDefinition::create('created')->setLabel(t('Created'));
    return $base_fields;
  }

}
