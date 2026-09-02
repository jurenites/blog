<?php

/**
 * @file
 * Post-update functions for Jurenites Blog.
 */

use Drupal\Core\Field\Entity\BaseFieldOverride;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\views\Entity\View;

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

/**
 * Adds and backfills editable YouTube creator and source-date metadata.
 */
function jurenites_blog_post_update_youtube_credit_fields(array &$update_sandbox): TranslatableMarkup {
  if (!isset($update_sandbox['article_ids'])) {
    $field_definitions = [
      'field_youtube_creator_name' => [
        'storage' => [
          'type' => 'string',
          'settings' => [
            'max_length' => 255,
            'is_ascii' => FALSE,
            'case_sensitive' => FALSE,
          ],
        ],
        'field' => [
          'label' => 'YouTube creator name',
          'description' => 'Filled from the YouTube source when empty. Edit this value to correct or customize the public credit.',
        ],
      ],
      'field_youtube_creator_url' => [
        'storage' => [
          'type' => 'link',
          'settings' => [],
        ],
        'field' => [
          'label' => 'YouTube creator URL',
          'description' => 'Filled from the YouTube source when empty. Keep the creator or channel URL used by the public credit.',
          'settings' => [
            'title' => 0,
            'link_type' => 16,
          ],
        ],
      ],
      'field_youtube_published_date' => [
        'storage' => [
          'type' => 'datetime',
          'settings' => [
            'datetime_type' => 'date',
          ],
        ],
        'field' => [
          'label' => 'YouTube publication date',
          'description' => 'Original source date, filled from YouTube when empty. It remains editable for older or corrected references.',
        ],
      ],
    ];

    foreach ($field_definitions as $field_name => $field_definition) {
      $field_storage = FieldStorageConfig::loadByName('node', $field_name);
      if ($field_storage === NULL) {
        $field_storage = FieldStorageConfig::create([
          'field_name' => $field_name,
          'entity_type' => 'node',
          'type' => $field_definition['storage']['type'],
          'settings' => $field_definition['storage']['settings'],
          'cardinality' => 1,
          'translatable' => TRUE,
        ]);
        $field_storage->save();
      }

      if (FieldConfig::loadByName('node', 'article', $field_name) === NULL) {
        FieldConfig::create([
          'field_storage' => $field_storage,
          'bundle' => 'article',
          'label' => $field_definition['field']['label'],
          'description' => $field_definition['field']['description'],
          'settings' => $field_definition['field']['settings'] ?? [],
          'required' => FALSE,
          'translatable' => TRUE,
        ])->save();
      }
    }

    \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
    $form_display = \Drupal::entityTypeManager()
      ->getStorage('entity_form_display')
      ->load('node.article.default');
    if ($form_display !== NULL) {
      $form_display->setComponent('field_youtube_creator_name', [
        'type' => 'string_textfield',
        'weight' => 3,
        'region' => 'content',
        'settings' => [
          'size' => 60,
          'placeholder' => 'YouTube creator or channel name',
        ],
      ]);
      $form_display->setComponent('field_youtube_creator_url', [
        'type' => 'link_default',
        'weight' => 4,
        'region' => 'content',
        'settings' => [
          'placeholder_url' => 'https://www.youtube.com/@channel',
          'placeholder_title' => '',
        ],
      ]);
      $form_display->setComponent('field_youtube_published_date', [
        'type' => 'datetime_default',
        'weight' => 5,
        'region' => 'content',
        'settings' => [],
      ]);
      $form_display->setComponent('field_youtube_channel_avatar', [
        'type' => 'string_textfield',
        'weight' => 6,
        'region' => 'content',
        'settings' => [
          'size' => 60,
          'placeholder' => 'https://yt3.googleusercontent.com/...',
        ],
      ]);
      $form_display->setComponent('body', [
        'type' => 'text_textarea_with_summary',
        'weight' => 7,
        'region' => 'content',
        'settings' => [
          'rows' => 9,
          'summary_rows' => 3,
          'placeholder' => '',
          'show_summary' => FALSE,
        ],
      ]);
      $form_display->save();
    }

    $update_sandbox['article_ids'] = array_values(\Drupal::entityQuery('node')
      ->accessCheck(FALSE)
      ->condition('type', 'article')
      ->exists('field_youtube_video')
      ->execute());
    $update_sandbox['total_count'] = count($update_sandbox['article_ids']);
    $update_sandbox['processed_count'] = 0;
  }

  $article_ids = array_splice($update_sandbox['article_ids'], 0, 10);
  $article_storage = \Drupal::entityTypeManager()->getStorage('node');
  foreach ($article_storage->loadMultiple($article_ids) as $article_node) {
    $article_node->save();
  }

  $update_sandbox['processed_count'] += count($article_ids);
  $update_sandbox['#finished'] = $update_sandbox['total_count'] > 0
    ? $update_sandbox['processed_count'] / $update_sandbox['total_count']
    : 1;

  return t('Stored YouTube creator and source-publication credits for @article_count Articles.', [
    '@article_count' => $update_sandbox['processed_count'],
  ]);
}

/**
 * Adds and backfills the editable Article consumption-time field.
 */
function jurenites_blog_post_update_article_consumption_time(array &$update_sandbox): TranslatableMarkup {
  if (!isset($update_sandbox['article_ids'])) {
    $field_name = 'field_consumption_time_minutes';
    $field_storage = FieldStorageConfig::loadByName('node', $field_name);
    if ($field_storage === NULL) {
      $field_storage = FieldStorageConfig::create([
        'field_name' => $field_name,
        'entity_type' => 'node',
        'type' => 'integer',
        'settings' => [
          'unsigned' => TRUE,
          'size' => 'normal',
        ],
        'cardinality' => 1,
        'translatable' => TRUE,
      ]);
      $field_storage->save();
    }

    if (FieldConfig::loadByName('node', 'article', $field_name) === NULL) {
      FieldConfig::create([
        'field_storage' => $field_storage,
        'bundle' => 'article',
        'label' => 'Content time (minutes)',
        'description' => 'Text Articles default to 5 minutes and remain editable. YouTube Articles fill this value from the video duration when the video URL changes.',
        'settings' => [
          'min' => 1,
          'max' => NULL,
          'prefix' => '',
          'suffix' => ' min',
        ],
        'default_value' => [
          ['value' => 5],
        ],
        'required' => FALSE,
        'translatable' => TRUE,
      ])->save();
    }

    \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
    $form_display = \Drupal::entityTypeManager()
      ->getStorage('entity_form_display')
      ->load('node.article.default');
    if ($form_display !== NULL) {
      $form_display->setComponent($field_name, [
        'type' => 'number',
        'weight' => 7,
        'region' => 'content',
        'settings' => [
          'placeholder' => '5',
        ],
      ]);
      if ($form_display->getComponent('body') !== NULL) {
        $body_component = $form_display->getComponent('body');
        $body_component['weight'] = 8;
        $form_display->setComponent('body', $body_component);
      }
      $form_display->save();
    }

    $update_sandbox['article_ids'] = array_values(\Drupal::entityQuery('node')
      ->accessCheck(FALSE)
      ->condition('type', 'article')
      ->execute());
    $update_sandbox['total_count'] = count($update_sandbox['article_ids']);
    $update_sandbox['processed_count'] = 0;
  }

  $article_ids = array_splice($update_sandbox['article_ids'], 0, 10);
  $article_storage = \Drupal::entityTypeManager()->getStorage('node');
  foreach ($article_storage->loadMultiple($article_ids) as $article_node) {
    $article_node->save();
  }

  $update_sandbox['processed_count'] += count($article_ids);
  $update_sandbox['#finished'] = $update_sandbox['total_count'] > 0
    ? $update_sandbox['processed_count'] / $update_sandbox['total_count']
    : 1;

  return t('Stored read or watch time for @article_count Articles.', [
    '@article_count' => $update_sandbox['processed_count'],
  ]);
}

/**
 * Shows every published Article on the Blog, regardless of promotion state.
 */
function jurenites_blog_post_update_blog_ignores_promoted_state(array &$update_sandbox): TranslatableMarkup {
  $frontpage_view = View::load('frontpage');
  if ($frontpage_view === NULL) {
    return t('The Frontpage View was not available; the Blog filters were unchanged.');
  }

  $display_settings = $frontpage_view->get('display');
  if (!isset($display_settings['default'], $display_settings['page_2'])) {
    return t('The Blog display was not available; its filters were unchanged.');
  }

  $blog_filters = $display_settings['default']['display_options']['filters'] ?? [];
  unset($blog_filters['promote']);
  $blog_filters['type'] = [
    'id' => 'type',
    'table' => 'node_field_data',
    'field' => 'type',
    'entity_type' => 'node',
    'entity_field' => 'type',
    'plugin_id' => 'bundle',
    'value' => [
      'article' => 'article',
    ],
    'group' => 1,
  ];

  $display_settings['page_2']['display_options']['defaults']['filters'] = FALSE;
  $display_settings['page_2']['display_options']['filters'] = $blog_filters;
  $frontpage_view->set('display', $display_settings);
  $frontpage_view->save();

  return t('Updated the Blog to show published Articles regardless of their promoted state.');
}

/**
 * Defaults new Articles to not promoted without changing existing Articles.
 */
function jurenites_blog_post_update_disable_article_promotion_default(): TranslatableMarkup {
  $promote_field = BaseFieldOverride::load('node.article.promote');
  if ($promote_field === NULL) {
    return t('The Article promoted field override was unavailable; its default was unchanged.');
  }

  $promote_field->setDefaultValue([
    ['value' => FALSE],
  ])->save();

  return t('Disabled promotion to the front page by default for new Articles.');
}

/**
 * Re-saves YouTube Articles to synchronize their authored calendar date.
 */
function jurenites_blog_post_update_sync_youtube_authored_dates(
  array &$update_sandbox,
): TranslatableMarkup {
  if (!isset($update_sandbox['article_ids'])) {
    $update_sandbox['article_ids'] = array_values(\Drupal::entityQuery('node')
      ->accessCheck(FALSE)
      ->condition('type', 'article')
      ->exists('field_youtube_video')
      ->execute());
    $update_sandbox['total_count'] = count($update_sandbox['article_ids']);
    $update_sandbox['processed_count'] = 0;
  }

  $article_ids = array_splice($update_sandbox['article_ids'], 0, 10);
  $article_storage = \Drupal::entityTypeManager()->getStorage('node');
  foreach ($article_storage->loadMultiple($article_ids) as $article_node) {
    $article_node->save();
  }

  $update_sandbox['processed_count'] += count($article_ids);
  $update_sandbox['#finished'] = $update_sandbox['total_count'] > 0
    ? $update_sandbox['processed_count'] / $update_sandbox['total_count']
    : 1;

  return t('Synchronized authored dates for @article_count YouTube Articles.', [
    '@article_count' => $update_sandbox['processed_count'],
  ]);
}
