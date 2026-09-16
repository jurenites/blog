<?php

declare(strict_types=1);

namespace Drupal\jurenites_blog\Plugin\media\Source;

use Drupal\media\MediaInterface;
use Drupal\media\Plugin\media\Source\OEmbed;

/**
 * Supplies YouTube's template provider name without a remote metadata lookup.
 */
class LocalYoutubeOEmbed extends OEmbed {

  /**
   * {@inheritdoc}
   */
  public function getMetadata(MediaInterface $media_entity, $metadata_name) {
    if ($metadata_name === 'provider_name'
      && jurenites_blog_youtube_identifier((string) $this->getSourceFieldValue($media_entity)) !== '') {
      return 'YouTube';
    }
    return parent::getMetadata($media_entity, $metadata_name);
  }

}
