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
