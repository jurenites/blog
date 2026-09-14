<?php

/**
 * @file
 * Finishes the Video split after assembling a fresh site's Article recipes.
 */

require_once DRUPAL_ROOT . '/modules/custom/jurenites_blog/jurenites_blog.post_update.php';
print jurenites_blog_post_update_youtube_video_content_type() . PHP_EOL;
\Drupal::service('update.post_update_registry')->registerInvokedUpdates([
  'jurenites_blog_post_update_youtube_video_content_type',
]);
