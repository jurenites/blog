<?php

/**
 * @file
 * Post-update functions for Jurenites Blog.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Backfills Image fields for existing Articles with YouTube videos.
 */
function jurenites_blog_post_update_youtube_thumbnails(array &$update_sandbox): TranslatableMarkup {
  if (!isset($update_sandbox['article_ids'])) {
    $update_sandbox['article_ids'] = array_values(\Drupal::entityQuery('node')
      ->accessCheck(FALSE)
      ->condition('type', 'article')
      ->exists('field_youtube_video')
      ->notExists('field_image')
      ->execute());
    $update_sandbox['total_count'] = count($update_sandbox['article_ids']);
    $update_sandbox['processed_count'] = 0;
  }

  $article_ids = array_splice($update_sandbox['article_ids'], 0, 25);
  $article_storage = \Drupal::entityTypeManager()->getStorage('node');
  foreach ($article_storage->loadMultiple($article_ids) as $article_node) {
    $article_node->save();
  }

  $update_sandbox['processed_count'] += count($article_ids);
  $update_sandbox['#finished'] = $update_sandbox['total_count'] > 0
    ? $update_sandbox['processed_count'] / $update_sandbox['total_count']
    : 1;

  return t('Backfilled locally editable YouTube thumbnails for @article_count Articles.', [
    '@article_count' => $update_sandbox['processed_count'],
  ]);
}

/**
 * Replaces generated thumbnails with the best available YouTube resolution.
 */
function jurenites_blog_post_update_youtube_thumbnail_quality(array &$update_sandbox): TranslatableMarkup {
  if (!isset($update_sandbox['article_ids'])) {
    $update_sandbox['article_ids'] = array_values(\Drupal::entityQuery('node')
      ->accessCheck(FALSE)
      ->condition('type', 'article')
      ->exists('field_youtube_video')
      ->exists('field_image')
      ->execute());
    $update_sandbox['total_count'] = count($update_sandbox['article_ids']);
    $update_sandbox['processed_count'] = 0;
    $update_sandbox['updated_count'] = 0;
  }

  $article_ids = array_splice($update_sandbox['article_ids'], 0, 25);
  $article_storage = \Drupal::entityTypeManager()->getStorage('node');
  foreach ($article_storage->loadMultiple($article_ids) as $article_node) {
    $image_file = $article_node->get('field_image')->entity;
    $image_uri = $image_file?->getFileUri() ?? '';
    if (!str_starts_with($image_uri, 'public://youtube-thumbnails/')) {
      continue;
    }

    $youtube_item = $article_node->get('field_youtube_video')->first();
    $video_url = trim((string) $youtube_item?->get('input')->getValue());
    $video_identifier = trim((string) $youtube_item?->get('video_id')->getValue());
    if ($video_url !== ''
      && $video_identifier !== ''
      && jurenites_blog_set_youtube_thumbnail($article_node, $video_url, $video_identifier)) {
      $article_node->save();
      $update_sandbox['updated_count']++;
    }
  }

  $update_sandbox['processed_count'] += count($article_ids);
  $update_sandbox['#finished'] = $update_sandbox['total_count'] > 0
    ? $update_sandbox['processed_count'] / $update_sandbox['total_count']
    : 1;

  return t('Upgraded @article_count generated YouTube thumbnails to the best available resolution.', [
    '@article_count' => $update_sandbox['updated_count'],
  ]);
}
