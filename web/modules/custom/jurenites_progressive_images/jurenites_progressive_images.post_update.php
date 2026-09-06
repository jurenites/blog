<?php

/**
 * @file
 * Post-update functions for Jurenites Progressive Images.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

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
