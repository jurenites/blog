<?php

/**
 * @file
 * Post-update functions for jurenites Progressive Images.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Adds uncropped stages for the About and Contact photographs.
 */
function jurenites_progressive_images_post_update_portrait_stages(): TranslatableMarkup {
  jurenites_progressive_images_photo_styles();
  return t('Added progressive portrait image sizes for About and Contact.');
}

/**
 * Enables responsive progressive loading for Article blog-list images.
 */
function jurenites_progressive_images_post_update_article_teaser(): TranslatableMarkup {
  $display_storage = \Drupal::entityTypeManager()->getStorage('entity_view_display');
  $article_display = $display_storage->load('node.article.teaser');
  if ($article_display !== NULL) {
    $article_display->setComponent('field_image', [
      'type' => 'responsive_image',
      'label' => 'hidden',
      'settings' => [
        'responsive_image_style' => 'narrow',
        'image_link' => 'content',
        'image_loading' => [
          'attribute' => 'lazy',
        ],
      ],
      'third_party_settings' => [
        'image_blurry_placeholder' => [
          'use_blurry_placeholder' => TRUE,
        ],
      ],
      'weight' => -1,
      'region' => 'content',
    ]);
    $article_display->save();
  }

  return t('Enabled responsive progressive loading for Article blog-list images.');
}

/**
 * Aligns responsive candidates with the Article blog-list layout breakpoints.
 */
function jurenites_progressive_images_post_update_blog_list_responsive_style(): TranslatableMarkup {
  $responsive_storage = \Drupal::entityTypeManager()->getStorage('responsive_image_style');
  $responsive_style = $responsive_storage->load('article_blog_list');
  $responsive_values = [
    'id' => 'article_blog_list',
    'label' => 'Article Blog list',
    'status' => TRUE,
    'breakpoint_group' => 'responsive_image',
    'fallback_image_style' => 'max_325x325',
    'image_style_mappings' => [
      [
        'image_mapping_type' => 'sizes',
        'image_mapping' => [
          'sizes' => '(min-width: 1280px) 280px, (min-width: 641px) 35vw, calc(100vw - 32px)',
          'sizes_image_styles' => [
            'max_1300x1300',
            'max_650x650',
            'max_325x325',
          ],
        ],
        'breakpoint_id' => 'responsive_image.viewport_sizing',
        'multiplier' => '1x',
      ],
    ],
  ];
  if ($responsive_style === NULL) {
    $responsive_style = $responsive_storage->create($responsive_values);
  }
  else {
    foreach ($responsive_values as $property_name => $property_value) {
      if ($property_name === 'id') {
        continue;
      }
      $responsive_style->set($property_name, $property_value);
    }
  }
  $responsive_style->save();

  $display_storage = \Drupal::entityTypeManager()->getStorage('entity_view_display');
  $article_display = $display_storage->load('node.article.teaser');
  if ($article_display !== NULL) {
    $image_component = $article_display->getComponent('field_image');
    $image_component['settings']['responsive_image_style'] = 'article_blog_list';
    $article_display->setComponent('field_image', $image_component);
    $article_display->save();
  }

  return t('Aligned Article blog-list image candidates with its responsive layout.');
}

/**
 * Adds responsive 1x/2x/3x progressive images to Project cards.
 */
function jurenites_progressive_images_post_update_project_thumbnails(): TranslatableMarkup {
  $image_style_storage = \Drupal::entityTypeManager()->getStorage('image_style');
  $image_style_widths = [
    'project_thumbnail_440' => 440,
    'project_thumbnail_880' => 880,
    'project_thumbnail_1320' => 1320,
  ];

  foreach ($image_style_widths as $image_style_name => $image_style_width) {
    $image_style = $image_style_storage->load($image_style_name);
    if ($image_style === NULL) {
      $image_style = $image_style_storage->create([
        'name' => $image_style_name,
        'label' => t('Project thumbnail @width', ['@width' => $image_style_width]),
      ]);
    }

    $scale_effect_uuid = \Drupal::service('uuid')->generate();
    $conversion_effect_uuid = \Drupal::service('uuid')->generate();
    $image_style->set('effects', [
      $scale_effect_uuid => [
        'uuid' => $scale_effect_uuid,
        'id' => 'image_scale',
        'weight' => 1,
        'data' => [
          'width' => $image_style_width,
          'height' => $image_style_width,
          'upscale' => FALSE,
        ],
      ],
      $conversion_effect_uuid => [
        'uuid' => $conversion_effect_uuid,
        'id' => 'image_convert_avif',
        'weight' => 2,
        'data' => [
          'extension' => 'webp',
        ],
      ],
    ]);
    $image_style->save();
  }

  $responsive_storage = \Drupal::entityTypeManager()->getStorage('responsive_image_style');
  $responsive_style = $responsive_storage->load('project_thumbnail');
  $responsive_values = [
    'id' => 'project_thumbnail',
    'label' => 'Project thumbnail',
    'status' => TRUE,
    'breakpoint_group' => 'responsive_image',
    'fallback_image_style' => 'project_thumbnail_440',
    'image_style_mappings' => [
      [
        'image_mapping_type' => 'sizes',
        'image_mapping' => [
          'sizes' => '(min-width: 1280px) 188px, (min-width: 641px) min(392px, calc((100vw - 64px) / 2)), calc(100vw - 32px)',
          'sizes_image_styles' => [
            'project_thumbnail_1320',
            'project_thumbnail_880',
            'project_thumbnail_440',
          ],
        ],
        'breakpoint_id' => 'responsive_image.viewport_sizing',
        'multiplier' => '1x',
      ],
    ],
  ];
  if ($responsive_style === NULL) {
    $responsive_style = $responsive_storage->create($responsive_values);
  }
  else {
    foreach ($responsive_values as $property_name => $property_value) {
      if ($property_name === 'id') {
        continue;
      }
      $responsive_style->set($property_name, $property_value);
    }
  }
  $responsive_style->save();

  $display_storage = \Drupal::entityTypeManager()->getStorage('entity_view_display');
  $project_display = $display_storage->load('node.project.teaser');
  if ($project_display !== NULL) {
    $project_display->setComponent('field_image', [
      'type' => 'responsive_image',
      'label' => 'hidden',
      'settings' => [
        'responsive_image_style' => 'project_thumbnail',
        'image_link' => 'content',
        'image_loading' => [
          'attribute' => 'lazy',
        ],
      ],
      'third_party_settings' => [
        'image_blurry_placeholder' => [
          'use_blurry_placeholder' => TRUE,
        ],
      ],
      'weight' => 0,
      'region' => 'content',
    ]);
    $project_display->save();
  }

  $project_image_field = \Drupal\field\Entity\FieldConfig::loadByName(
    'node',
    'project',
    'field_image'
  );
  if ($project_image_field !== NULL) {
    $project_image_field->setDescription(
      'For a sharp Portfolio card on a 440-point 3x mobile display, upload a source image at least 1320 pixels wide.'
    );
    $project_image_field->save();
  }

  return t('Enabled 440px, 880px, and 1320px progressive Project thumbnails.');
}

/**
 * Matches Project raster derivatives to the card's actual layout widths.
 */
function jurenites_progressive_images_post_update_project_card_sizing(): TranslatableMarkup {
  $image_style_storage = \Drupal::entityTypeManager()->getStorage('image_style');
  $image_style_widths = [392, 608, 784, 1176, 1216, 1824];

  foreach ($image_style_widths as $image_style_width) {
    $image_style_name = 'project_thumbnail_' . $image_style_width;
    $image_style = $image_style_storage->load($image_style_name);
    if ($image_style === NULL) {
      $image_style = $image_style_storage->create([
        'name' => $image_style_name,
        'label' => t('Project thumbnail @width', ['@width' => $image_style_width]),
      ]);
      $image_style->addImageEffect([
        'id' => 'image_scale',
        'weight' => 1,
        'data' => [
          'width' => $image_style_width,
          'height' => $image_style_width,
          'upscale' => FALSE,
        ],
      ]);
      $image_style->addImageEffect([
        'id' => 'image_convert_avif',
        'weight' => 2,
        'data' => ['extension' => 'webp'],
      ]);
      $image_style->save();
    }
  }

  $responsive_style = \Drupal::entityTypeManager()
    ->getStorage('responsive_image_style')
    ->load('project_thumbnail');
  if ($responsive_style !== NULL) {
    $responsive_style->set('fallback_image_style', 'project_thumbnail_392');
    $responsive_style->set('image_style_mappings', [[
      'image_mapping_type' => 'sizes',
      'image_mapping' => [
        'sizes' => '(min-width: 641px) min(392px, calc((100vw - 64px) / 2)), calc(100vw - 32px)',
        'sizes_image_styles' => array_map(
          static fn (int $image_style_width): string => 'project_thumbnail_' . $image_style_width,
          array_reverse($image_style_widths)
        ),
      ],
      'breakpoint_id' => 'responsive_image.viewport_sizing',
      'multiplier' => '1x',
    ]]);
    $responsive_style->save();
  }

  $project_image_field = \Drupal\field\Entity\FieldConfig::loadByName('node', 'project', 'field_image');
  if ($project_image_field !== NULL) {
    $project_image_field->setDescription(
      'For a sharp Portfolio card at its largest 608 CSS-pixel width, upload a source at least 608 pixels wide for 1x, 1216 for 2x, or 1824 for 3x. Smaller originals are never enlarged.'
    );
    $project_image_field->save();
  }

  return t('Aligned Project raster thumbnails with 392px desktop and 608px mobile card widths.');
}

/**
 * Adds Drupal derivatives for optional 10%, 20%, and 50% photo stages.
 */
function jurenites_progressive_images_post_update_photo_ratio_stages(): TranslatableMarkup {
  jurenites_progressive_images_photo_styles();
  return t('Added responsive progressive photo stages for About and Contact.');
}
