<?php

/**
 * @file
 * Editable complete photograph below the Contact form.
 */

use Drupal\block\Entity\Block;
use Drupal\block_content\Entity\BlockContent;
use Drupal\block_content\Entity\BlockContentType;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;

const JURENITES_CONTACT_PHOTO_UUID = '41ea9024-22d7-4a64-bcf5-276512985f14';

/**
 * Creates image authoring and an initial placement without resetting edits.
 */
function jurenites_contact_photo_setup(): void {
  if (!BlockContentType::load('contact_photo')) {
    BlockContentType::create(['id' => 'contact_photo', 'label' => 'Contact photograph', 'revision' => TRUE])->save();
  }
  if (!FieldStorageConfig::loadByName('block_content', 'field_contact_photo')) {
    FieldStorageConfig::create([
      'entity_type' => 'block_content', 'field_name' => 'field_contact_photo',
      'type' => 'image', 'cardinality' => 1,
      'settings' => ['target_type' => 'file', 'uri_scheme' => 'public'],
    ])->save();
  }
  if (!FieldConfig::loadByName('block_content', 'contact_photo', 'field_contact_photo')) {
    FieldConfig::create([
      'entity_type' => 'block_content', 'bundle' => 'contact_photo',
      'field_name' => 'field_contact_photo', 'label' => 'Photograph', 'required' => TRUE,
      'description' => 'Upload a complete landscape photograph; no separate foreground is needed.',
      'settings' => [
        'handler' => 'default:file', 'file_directory' => 'contact-photo',
        'file_extensions' => 'png jpg jpeg webp', 'max_filesize' => '10 MB',
        'alt_field' => TRUE, 'alt_field_required' => TRUE,
        'title_field' => FALSE, 'title_field_required' => FALSE,
      ],
    ])->save();
    $form_display = EntityFormDisplay::load('block_content.contact_photo.default')
      ?? EntityFormDisplay::create(['targetEntityType' => 'block_content', 'bundle' => 'contact_photo', 'mode' => 'default', 'status' => TRUE]);
    $form_display->setComponent('field_contact_photo', ['type' => 'image_image', 'weight' => 0])->save();
    $view_display = EntityViewDisplay::load('block_content.contact_photo.default')
      ?? EntityViewDisplay::create(['targetEntityType' => 'block_content', 'bundle' => 'contact_photo', 'mode' => 'default', 'status' => TRUE]);
    $view_display->removeComponent('field_contact_photo')->save();
  }
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  $block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  if (!$block_storage->loadByProperties(['uuid' => JURENITES_CONTACT_PHOTO_UUID])) {
    $image_path = DRUPAL_ROOT . '/themes/custom/jurenites_theme/assets/images/contact-desk-cold-v1.jpg';
    if (!is_file($image_path)) {
      throw new RuntimeException('Build the theme before installing the Contact photograph.');
    }
    $image_directory = 'public://contact-photo';
    \Drupal::service('file_system')->prepareDirectory($image_directory, FileSystemInterface::CREATE_DIRECTORY);
    $image_file = \Drupal::service('file.repository')->writeData(file_get_contents($image_path), $image_directory . '/contact-desk-cold-v1.jpg', FileExists::Rename);
    BlockContent::create([
      'uuid' => JURENITES_CONTACT_PHOTO_UUID, 'type' => 'contact_photo',
      'langcode' => 'en', 'info' => 'Contact desk photograph', 'reusable' => TRUE,
      'field_contact_photo' => ['target_id' => $image_file->id(), 'alt' => 'Working at a desk with two monitors and a laptop, seen from behind in cool evening light.'],
    ])->save();
  }
  if (!Block::load('jurenites_theme_contact_photo')) {
    $plugin_identifier = 'block_content:' . JURENITES_CONTACT_PHOTO_UUID;
    Block::create([
      'id' => 'jurenites_theme_contact_photo', 'theme' => 'jurenites_theme',
      'region' => 'content', 'weight' => 100, 'status' => TRUE, 'plugin' => $plugin_identifier,
      'settings' => ['id' => $plugin_identifier, 'label' => 'Contact desk photograph', 'label_display' => '0', 'provider' => 'block_content', 'view_mode' => 'full'],
      'visibility' => ['request_path' => ['id' => 'request_path', 'negate' => FALSE, 'pages' => '/contact']],
    ])->save();
  }
}
