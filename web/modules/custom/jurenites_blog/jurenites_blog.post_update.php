<?php

/**
 * @file
 * Post-update functions for Jurenites Blog.
 */

use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\Entity\EntityViewMode;
use Drupal\Core\Field\Entity\BaseFieldOverride;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\block\Entity\Block;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\menu_link_content\Entity\MenuLinkContent;
use Drupal\node\Entity\NodeType;
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

/**
 * Splits personal Articles and YouTube references into Blog and Videos pages.
 */
function jurenites_blog_post_update_split_blog_and_videos(): TranslatableMarkup {
  $frontpage_view = View::load('frontpage');
  if ($frontpage_view === NULL) {
    return t('The Frontpage View was not available; Blog and Videos were unchanged.');
  }

  $display_settings = $frontpage_view->get('display');
  if (!isset($display_settings['page_2'])) {
    return t('The Blog display was not available; Blog and Videos were unchanged.');
  }

  $blog_display = $display_settings['page_2'];
  $blog_filters = $blog_display['display_options']['filters'] ?? [];
  $blog_filters['field_youtube_video_video_id'] =
    jurenites_blog_youtube_video_filter('empty');
  $blog_display['display_options']['defaults']['filters'] = FALSE;
  $blog_display['display_options']['filters'] = $blog_filters;
  $display_settings['page_2'] = $blog_display;

  $videos_display = $blog_display;
  $videos_display['id'] = 'page_3';
  $videos_display['display_title'] = 'Videos';
  $videos_display['position'] = 4;
  $videos_display['display_options']['title'] = 'Videos';
  $videos_display['display_options']['path'] = 'videos';
  $videos_display['display_options']['filters']['field_youtube_video_video_id'] =
    jurenites_blog_youtube_video_filter('not empty');
  $display_settings['page_3'] = $videos_display;

  $frontpage_view->set('display', $display_settings);
  $frontpage_view->save();

  $menu_link_storage = \Drupal::entityTypeManager()
    ->getStorage('menu_link_content');
  $videos_link_ids = $menu_link_storage->getQuery()
    ->accessCheck(FALSE)
    ->condition('menu_name', 'main')
    ->condition('link.uri', 'internal:/videos')
    ->execute();
  $videos_links = $menu_link_storage->loadMultiple($videos_link_ids);
  $videos_link = reset($videos_links);
  if (!$videos_link instanceof MenuLinkContent) {
    $videos_link = MenuLinkContent::create([
      'title' => 'Videos',
      'link' => ['uri' => 'internal:/videos'],
      'menu_name' => 'main',
      'enabled' => TRUE,
      'expanded' => FALSE,
      'weight' => 4,
    ]);
  }
  else {
    $videos_link->set('title', 'Videos');
    $videos_link->set('enabled', TRUE);
    $videos_link->set('weight', 4);
  }
  $videos_link->save();

  $contact_link_ids = $menu_link_storage->getQuery()
    ->accessCheck(FALSE)
    ->condition('menu_name', 'main')
    ->condition('link.uri', 'internal:/contact')
    ->execute();
  $contact_links = $menu_link_storage->loadMultiple($contact_link_ids);
  foreach ($contact_links as $contact_link) {
    $contact_link->set('weight', 5);
    $contact_link->save();
  }

  return t('Separated personal Articles at /blog from YouTube references at /videos and added Videos to the Main navigation.');
}

/**
 * Gives editorial Article listings their own render and cache variant.
 */
function jurenites_blog_post_update_article_blog_list_view_mode(): TranslatableMarkup {
  $blog_list_view_mode = EntityViewMode::load('node.blog_list');
  if ($blog_list_view_mode === NULL) {
    $blog_list_view_mode = EntityViewMode::create([
      'id' => 'node.blog_list',
      'label' => 'Blog list',
      'targetEntityType' => 'node',
      'cache' => TRUE,
    ]);
    $blog_list_view_mode->save();
  }

  $blog_list_display = EntityViewDisplay::load('node.article.blog_list');
  if ($blog_list_display === NULL) {
    $teaser_display = EntityViewDisplay::load('node.article.teaser');
    $blog_list_display = EntityViewDisplay::create([
      'targetEntityType' => 'node',
      'bundle' => 'article',
      'mode' => 'blog_list',
      'status' => TRUE,
      'content' => $teaser_display?->get('content') ?? [],
      'hidden' => $teaser_display?->get('hidden') ?? [],
    ]);
    $blog_list_display->save();
  }

  $frontpage_view = View::load('frontpage');
  if ($frontpage_view === NULL) {
    return t('Created the Blog list view mode, but the Frontpage View was unavailable.');
  }

  $display_settings = $frontpage_view->get('display');
  $updated_display_count = 0;
  foreach (['page_2', 'page_3'] as $display_identifier) {
    if (!isset($display_settings[$display_identifier])) {
      continue;
    }

    $display_settings[$display_identifier]['display_options']['defaults']['row'] = FALSE;
    $display_settings[$display_identifier]['display_options']['row'] = [
      'type' => 'entity:node',
      'options' => [
        'view_mode' => 'blog_list',
      ],
    ];
    $updated_display_count++;
  }

  $frontpage_view->set('display', $display_settings);
  $frontpage_view->save();

  return t('Created the Blog list Article view mode and assigned it to @display_count editorial listing displays.', [
    '@display_count' => $updated_display_count,
  ]);
}

/**
 * Defines a Views string filter for the Article YouTube identifier.
 */
function jurenites_blog_youtube_video_filter(string $filter_operator): array {
  return [
    'id' => 'field_youtube_video_video_id',
    'table' => 'node__field_youtube_video',
    'field' => 'field_youtube_video_video_id',
    'relationship' => 'none',
    'group_type' => 'group',
    'admin_label' => '',
    'plugin_id' => 'string',
    'operator' => $filter_operator,
    'value' => '',
    'group' => 1,
    'exposed' => FALSE,
  ];
}

/**
 * Makes News source metadata optional because it is populated on save.
 */
function jurenites_blog_post_update_news_automatic_metadata(): TranslatableMarkup {
  $managed_descriptions = [
    'field_news_source_name' => 'Filled automatically from the source URL. Administrators can correct this value.',
    'field_news_source_published' => 'Filled automatically from the source URL. Administrators can correct this value.',
    'field_image' => 'Filled automatically from the source URL. Administrators can replace this image.',
  ];
  foreach ($managed_descriptions as $field_name => $field_description) {
    $field_config = FieldConfig::loadByName('node', 'news', $field_name);
    if ($field_config !== NULL) {
      $field_config->setRequired(FALSE);
      $field_config->setDescription($field_description);
      $field_config->save();
    }
  }

  $source_url_field = FieldConfig::loadByName(
    'node',
    'news',
    'field_news_source_url',
  );
  if ($source_url_field !== NULL) {
    $source_url_field->setDescription(
      'The original video or article URL. Source, publication time, and thumbnail are filled automatically when saved.',
    );
    $source_url_field->save();
  }

  return t('Made News source metadata optional and automatically managed.');
}

/**
 * Updates the News create-form guidance for automatic metadata.
 */
function jurenites_blog_post_update_news_create_form_help(): TranslatableMarkup {
  $news_type = NodeType::load('news');
  if ($news_type !== NULL) {
    $news_type->set(
      'help',
      'Add a catchy title and the original source URL. Source details and the thumbnail are filled automatically.',
    );
    $news_type->save();
  }

  return t('Updated the News create-form guidance for automatic metadata.');
}

/**
 * Adds the three newest published Blog Articles to the homepage.
 */
function jurenites_blog_post_update_homepage_article_tiles(): TranslatableMarkup {
  $frontpage_view = View::load('frontpage');
  if ($frontpage_view === NULL) {
    return t('The Frontpage View was unavailable; the homepage Article tiles were not added.');
  }

  $display_settings = $frontpage_view->get('display');
  if (!isset($display_settings['default'], $display_settings['page_2'])) {
    return t('The Blog display was unavailable; the homepage Article tiles were not added.');
  }

  $blog_display = $display_settings['page_2'];
  $homepage_display = $blog_display;
  $homepage_display['id'] = 'block_1';
  $homepage_display['display_title'] = 'Homepage Articles';
  $homepage_display['display_plugin'] = 'block';
  $homepage_display['position'] = 5;
  $homepage_display['display_options']['title'] = 'Latest articles';
  $homepage_display['display_options']['display_description'] = 'The three newest published Blog Articles shown only on the homepage.';
  $homepage_display['display_options']['block_description'] = 'Homepage Articles';
  $homepage_display['display_options']['pager'] = [
    'type' => 'some',
    'options' => [
      'offset' => 0,
      'items_per_page' => 3,
    ],
  ];
  $homepage_display['display_options']['arguments'] = [];
  $homepage_display['display_options']['sorts'] = [
    'created' => $display_settings['default']['display_options']['sorts']['created'],
  ];
  $homepage_display['display_options']['row'] = [
    'type' => 'entity:node',
    'options' => [
      'view_mode' => 'teaser',
    ],
  ];
  $homepage_display['display_options']['defaults']['title'] = FALSE;
  $homepage_display['display_options']['defaults']['pager'] = FALSE;
  $homepage_display['display_options']['defaults']['arguments'] = FALSE;
  $homepage_display['display_options']['defaults']['filters'] = FALSE;
  $homepage_display['display_options']['defaults']['sorts'] = FALSE;
  $homepage_display['display_options']['defaults']['row'] = FALSE;
  unset($homepage_display['display_options']['path']);

  $display_settings['block_1'] = $homepage_display;
  $frontpage_view->set('display', $display_settings);
  $frontpage_view->save();

  $article_block = Block::load('jurenites_theme_latest_articles');
  if ($article_block === NULL) {
    $article_block = Block::create([
      'id' => 'jurenites_theme_latest_articles',
      'theme' => 'jurenites_theme',
      'region' => 'content',
      'weight' => 5,
      'provider' => NULL,
      'plugin' => 'views_block:frontpage-block_1',
      'settings' => [
        'id' => 'views_block:frontpage-block_1',
        'label' => 'Latest articles',
        'label_display' => 'visible',
        'provider' => 'views',
        'views_label' => '',
        'items_per_page' => NULL,
      ],
      'visibility' => [
        'request_path' => [
          'id' => 'request_path',
          'negate' => FALSE,
          'pages' => '<front>',
        ],
      ],
    ]);
  }
  else {
    $article_block->setRegion('content');
    $article_block->setWeight(5);
    $article_block->set('settings', [
      'id' => 'views_block:frontpage-block_1',
      'label' => 'Latest articles',
      'label_display' => 'visible',
      'provider' => 'views',
      'views_label' => '',
      'items_per_page' => NULL,
    ]);
    $article_block->setVisibilityConfig('request_path', [
      'id' => 'request_path',
      'negate' => FALSE,
      'pages' => '<front>',
    ]);
  }
  $article_block->enable()->save();

  return t('Added the three newest published Blog Articles to the homepage.');
}

/**
 * Makes alt text optional for every image field.
 */
function jurenites_blog_post_update_optional_image_alt_text(): TranslatableMarkup {
  $field_storage = \Drupal::entityTypeManager()->getStorage('field_config');
  $updated_count = 0;

  foreach ($field_storage->loadMultiple() as $field_config) {
    if ($field_config->getType() !== 'image'
      || !$field_config->getSetting('alt_field_required')) {
      continue;
    }

    $field_config->setSetting('alt_field_required', FALSE)->save();
    $updated_count++;
  }

  return t('Made alt text optional for @field_count image fields.', [
    '@field_count' => $updated_count,
  ]);
}

/**
 * Adds an editable Interests content block to the homepage.
 */
function jurenites_blog_post_update_homepage_interest_tiles(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_blog', 'install');
  $interests_block = jurenites_blog_ensure_interests_content_block();

  return t('Added editable Interests Content Block @block_id to the homepage.', [
    '@block_id' => $interests_block['content_block_id'],
  ]);
}

/**
 * Replaces taxonomy-owned image tiles with one reusable Tags content block.
 */
function jurenites_blog_post_update_replace_interest_tiles_with_content_block(): TranslatableMarkup {
  $interest_image_ids = \Drupal::entityQuery('file')
    ->accessCheck(FALSE)
    ->condition('uri', 'public://interest-images/%', 'LIKE')
    ->execute();
  $interest_images = \Drupal::entityTypeManager()
    ->getStorage('file')
    ->loadMultiple($interest_image_ids);
  foreach ($interest_images as $interest_image) {
    $interest_image->delete();
  }

  foreach (['field_interest_image', 'field_featured_interest'] as $obsolete_field_name) {
    FieldConfig::loadByName(
      'taxonomy_term',
      'tags',
      $obsolete_field_name,
    )?->delete();
    FieldStorageConfig::loadByName(
      'taxonomy_term',
      $obsolete_field_name,
    )?->delete();
  }

  $term_form_display = \Drupal::entityTypeManager()
    ->getStorage('entity_form_display')
    ->load('taxonomy_term.tags.default');
  if ($term_form_display !== NULL) {
    $term_form_display->removeComponent('field_interest_image');
    $term_form_display->removeComponent('field_featured_interest');
    $term_form_display->save();
  }

  $interest_image_directory = 'public://interest-images';
  if (\Drupal::service('file_system')->prepareDirectory($interest_image_directory)) {
    \Drupal::service('file_system')->deleteRecursive($interest_image_directory);
  }

  \Drupal::moduleHandler()->loadInclude('jurenites_blog', 'install');
  $interests_block = jurenites_blog_ensure_interests_content_block();

  return t('Created Interests Content Block @block_id and removed @image_count generated interest images.', [
    '@block_id' => $interests_block['content_block_id'],
    '@image_count' => count($interest_images),
  ]);
}

/**
 * Prefixes every Tags term for display while preserving clean filter slugs.
 */
function jurenites_blog_post_update_prefix_tag_labels(): TranslatableMarkup {
  $term_storage = \Drupal::entityTypeManager()->getStorage('taxonomy_term');
  $term_ids = $term_storage->getQuery()
    ->accessCheck(FALSE)
    ->condition('vid', 'tags')
    ->execute();
  $updated_count = 0;

  foreach ($term_storage->loadMultiple($term_ids) as $tag_term) {
    $tag_name = trim($tag_term->label());
    $prefix_free_name = preg_replace('/^#+\s*/u', '', $tag_name) ?? '';
    if (in_array($prefix_free_name, ['Game', 'Game Dev'], TRUE)) {
      $prefix_free_name = 'Game Dev';
    }

    $prefixed_tag_name = '#' . $prefix_free_name;
    if ($tag_name === $prefixed_tag_name) {
      continue;
    }

    $tag_term->setName($prefixed_tag_name);
    $tag_term->save();
    $updated_count++;
  }

  return t('Prefixed @tag_count Tags terms and standardized Game as #Game Dev.', [
    '@tag_count' => $updated_count,
  ]);
}

/**
 * Restores the page-title block after an invalid response-code restriction.
 */
function jurenites_blog_post_update_restore_page_title_block(): TranslatableMarkup {
  $page_title_block = Block::load('jurenites_theme_page_title');
  if ($page_title_block === NULL) {
    return t('The Jurenites page-title block was not present.');
  }

  $visibility_conditions = $page_title_block->getVisibilityConditions();
  if ($visibility_conditions->has('response_code')) {
    $visibility_conditions->removeInstanceId('response_code');
    $page_title_block->save();
  }

  return t('Restored the Jurenites page-title block on normal routes.');
}
