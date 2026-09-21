<?php

/**
 * @file
 * Complete, progressively refined photographs for About and Contact.
 */

use Drupal\Core\Cache\CacheableMetadata;
use Drupal\file\FileInterface;
use Drupal\image\Entity\ImageStyle;

/**
 * Installs missing photograph sizes without changing existing style settings.
 */
function jurenites_progressive_images_photo_styles(): void {
  foreach ([24, 96, 320, 640, 1280, 1920] as $image_width) {
    $style_name = 'portrait_progressive_' . $image_width;
    if (!ImageStyle::load($style_name)) {
      $image_style = ImageStyle::create(['name' => $style_name, 'label' => 'Portrait progressive ' . $image_width]);
      $image_style->addImageEffect([
        'id' => 'image_scale', 'weight' => 0,
        'data' => ['width' => $image_width, 'height' => NULL, 'upscale' => FALSE],
      ]);
      $image_style->save();
    }
  }
}

/**
 * Builds a tiny embedded preview and width-capped, uncropped candidates.
 */
function jurenites_progressive_images_photo_build(FileInterface $image_file, string $image_description, string $image_class, bool $lazy_loading = FALSE): array {
  $image_uri = $image_file->getFileUri();
  $original_url = \Drupal::service('file_url_generator')->generateString($image_uri);
  $photo_build = [
    '#theme' => 'jurenites_progressive_photo',
    '#image_description' => $image_description, '#image_class' => $image_class,
    '#original_url' => $original_url, '#preview_url' => '', '#image_candidates' => [],
    '#lazy_loading' => $lazy_loading,
  ];
  $cache_metadata = CacheableMetadata::createFromObject($image_file);
  $source_image = \Drupal::service('image.factory')->get($image_uri);
  $preview_style = ImageStyle::load('portrait_progressive_24');
  // A missing update or unsupported upload retains the ordinary image fallback.
  if ($source_image->isValid() && $preview_style && $preview_style->supportsUri($image_uri)) {
    $cache_metadata->addCacheableDependency($preview_style);
    $preview_uri = $preview_style->buildUri($image_uri);
    $cache_identifier = 'portrait_preview:' . $image_file->id();
    $cached_preview = \Drupal::cache()->get($cache_identifier);
    if ($cached_preview) {
      $photo_build['#preview_url'] = $cached_preview->data;
    }
    elseif (file_exists($preview_uri) || $preview_style->createDerivative($image_uri, $preview_uri)) {
      $preview_bytes = file_get_contents($preview_uri);
      if ($preview_bytes !== FALSE) {
        $preview_image = \Drupal::service('image.factory')->get($preview_uri);
        $photo_build['#preview_url'] = 'data:' . $preview_image->getMimeType() . ';base64,' . base64_encode($preview_bytes);
        \Drupal::cache()->set($cache_identifier, $photo_build['#preview_url'], -1, $cache_metadata->getCacheTags());
      }
    }
    foreach ([96, 320, 640, 1280, 1920] as $image_width) {
      $image_style = ImageStyle::load('portrait_progressive_' . $image_width);
      if (!$image_style) {
        continue;
      }
      $cache_metadata->addCacheableDependency($image_style);
      $photo_build['#image_candidates'][] = [
        'image_width' => min($image_width, $source_image->getWidth()),
        'image_url' => $image_style->buildUrl($image_uri),
      ];
      if ($image_width >= $source_image->getWidth()) {
        break;
      }
    }
  }
  $cache_metadata->applyTo($photo_build);
  return $photo_build;
}
