<?php

/**
 * @file
 * Updates existing inline media configuration.
 */

use Drupal\field\Entity\FieldConfig;
use Drupal\media\Entity\MediaType;

/**
 * Allows MP4, WebM and MOV video uploads up to 500 MB.
 */
function jurenites_inline_media_post_update_expand_video_uploads(): string {
  $media_type = MediaType::load('video');
  if ($media_type !== NULL) {
    $source_field = $media_type->getSource()->getSourceFieldDefinition($media_type);
    $field_config = FieldConfig::loadByName('media', 'video', $source_field->getName());
    $field_config->setSetting('file_extensions', 'mp4 webm mov')
      ->setSetting('max_filesize', '500 MB')
      ->save();
  }

  return t('Video media now accepts MP4, WebM and MOV files up to 500 MB.');
}
