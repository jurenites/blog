<?php

/**
 * @file
 * Layered photographic scenes reuse the Hero module's field and access helpers.
 */

use Drupal\block\Entity\Block;
use Drupal\block_content\Entity\BlockContent;
use Drupal\block_content\Entity\BlockContentType;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Entity\EntityInterface;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;

const JURENITES_LAYERED_SCENE_UUID = '21953f29-448b-458a-abde-8cf6a707bd73';

/**
 * Builds the fixed background and separately animated foreground.
 */
function jurenites_hero_layered_scene_build(EntityInterface $block_entity): array {
  $cache_metadata = CacheableMetadata::createFromObject($block_entity);
  $cache_metadata->addCacheContexts(['languages:language_content']);
  $scene_build = ['#theme' => 'jurenites_layered_scene', '#scene_actions' => []];
  foreach (['heading' => 'section_heading', 'eyebrow' => 'eyebrow_heading', 'description' => 'section_description', 'arrival' => 'arrival_enabled'] as $field_suffix => $variable_name) {
    $scene_build['#' . $variable_name] = jurenites_hero_read_field($block_entity, 'field_scene_' . $field_suffix, $cache_metadata)?->value ?? '';
  }
  foreach (['background', 'foreground'] as $layer_name) {
    $image_items = jurenites_hero_read_field($block_entity, 'field_scene_' . $layer_name, $cache_metadata);
    $image_file = $image_items?->entity;
    if ($image_file === NULL) {
      continue;
    }
    $file_access = $image_file->access('view', NULL, TRUE);
    $cache_metadata->addCacheableDependency($image_file)->addCacheableDependency($file_access);
    if ($file_access->isAllowed()) {
      $scene_build['#' . $layer_name . '_image_url'] = \Drupal::service('file_url_generator')->generateString($image_file->getFileUri());
      $scene_build['#' . $layer_name . '_description'] = $image_items->alt ?? '';
    }
  }
  foreach (['primary', 'secondary'] as $action_name) {
    $link_item = jurenites_hero_read_field($block_entity, 'field_scene_' . $action_name, $cache_metadata)?->first();
    if ($link_item === NULL || $link_item->isEmpty()) {
      continue;
    }
    $link_url = $link_item->getUrl();
    $link_access = $link_url->access(NULL, TRUE);
    $cache_metadata->addCacheableDependency($link_access);
    if ($link_access->isAllowed()) {
      $scene_build['#scene_actions'][] = [
        '#type' => 'link', '#title' => $link_item->title, '#url' => $link_url,
        '#attributes' => ['class' => ['button', 'button--' . $action_name, 'layered-scene__action']],
      ];
    }
  }
  $cache_metadata->applyTo($scene_build);
  return $scene_build;
}

/**
 * Adds the authoring model and one movable example without resetting edits.
 */
function jurenites_hero_layered_scene_setup(): void {
  if (BlockContentType::load('layered_scene') === NULL) {
    BlockContentType::create([
      'id' => 'layered_scene', 'label' => 'Layered scene', 'revision' => TRUE,
      'description' => 'A fixed background, optional transparent foreground, message and links.',
    ])->save();
  }
  foreach (['background' => 0, 'foreground' => 1] as $layer_name => $field_weight) {
    jurenites_hero_add_field('block_content', 'layered_scene', 'field_scene_' . $layer_name, [
      'type' => 'image', 'label' => ucfirst($layer_name) . ' image', 'required' => $layer_name === 'background',
      'description' => $layer_name === 'background'
        ? 'A fixed 16:9 image. Both layers must have the same canvas and already align.'
        : 'Optional transparent PNG or WebP, already positioned on the same 16:9 canvas. Empty areas must be truly transparent.',
      'storage_settings' => ['target_type' => 'file', 'uri_scheme' => 'public'],
      'settings' => [
        'handler' => 'default:file', 'file_directory' => 'layered-scene',
        'file_extensions' => $layer_name === 'foreground' ? 'png webp' : 'png jpg jpeg webp',
        'max_filesize' => '10 MB', 'alt_field' => TRUE, 'alt_field_required' => TRUE,
        'title_field' => FALSE, 'title_field_required' => FALSE,
        'max_resolution' => '3840x2160', 'min_resolution' => '',
      ],
    ], ['type' => 'image_image', 'weight' => $field_weight]);
  }
  foreach (['eyebrow' => ['Introductory line', 2], 'heading' => ['Headline', 3], 'description' => ['Supporting text', 4]] as $field_suffix => $field_details) {
    $is_description = $field_suffix === 'description';
    jurenites_hero_add_field('block_content', 'layered_scene', 'field_scene_' . $field_suffix, [
      'type' => $is_description ? 'string_long' : 'string', 'label' => $field_details[0], 'required' => $field_suffix === 'heading',
    ], ['type' => $is_description ? 'string_textarea' : 'string_textfield', 'weight' => $field_details[1]]);
  }
  jurenites_hero_add_field('block_content', 'layered_scene', 'field_scene_arrival', [
    'type' => 'boolean', 'label' => 'Animate foreground entrance',
    'description' => 'Fade the foreground in once when the scene enters view. Reduced-motion visitors always see the final still.',
    'default_value' => [['value' => 1]],
  ], ['type' => 'boolean_checkbox', 'weight' => 5, 'settings' => ['display_label' => TRUE]]);
  foreach (['primary' => 6, 'secondary' => 7] as $action_name => $field_weight) {
    jurenites_hero_add_field('block_content', 'layered_scene', 'field_scene_' . $action_name, [
      'type' => 'link', 'label' => ucfirst($action_name) . ' button', 'settings' => ['link_type' => 17, 'title' => 2],
    ], ['type' => 'link_default', 'weight' => $field_weight]);
  }
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  jurenites_hero_layered_scene_seed();
}

/**
 * Creates initial images/content and placement only if absent.
 */
function jurenites_hero_layered_scene_seed(): void {
  $block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  if (!$block_storage->loadByProperties(['uuid' => JURENITES_LAYERED_SCENE_UUID])) {
    $scene_block = BlockContent::create([
      'uuid' => JURENITES_LAYERED_SCENE_UUID, 'type' => 'layered_scene', 'langcode' => 'en',
      'info' => 'Desk arrival', 'reusable' => TRUE,
      'field_scene_eyebrow' => 'From the desk', 'field_scene_heading' => 'Let’s get to work.',
      'field_scene_description' => 'Explore the projects, experiments, and decisions behind the work.',
      'field_scene_arrival' => TRUE,
      'field_scene_primary' => ['title' => 'Explore projects', 'uri' => 'internal:/portfolio'],
      'field_scene_secondary' => ['title' => 'Start a conversation', 'uri' => 'internal:/contact'],
    ]);
    foreach ([
      'background' => ['desk-arrival-background.jpg', 'A clean desk with two monitors and an open laptop, lit in cool grayscale.'],
      'foreground' => ['desk-arrival-person.png', 'Alexander working at the desk, seen from behind.'],
    ] as $layer_name => $image_details) {
      $image_path = DRUPAL_ROOT . '/themes/custom/jurenites_theme/assets/images/' . $image_details[0];
      if (!is_file($image_path)) {
        throw new \RuntimeException('Build the theme assets before installing the layered scene: ' . $image_details[0]);
      }
      $image_directory = 'public://layered-scene';
      \Drupal::service('file_system')->prepareDirectory($image_directory, FileSystemInterface::CREATE_DIRECTORY);
      $image_file = \Drupal::service('file.repository')->writeData(file_get_contents($image_path), $image_directory . '/' . $image_details[0], FileExists::Rename);
      $scene_block->set('field_scene_' . $layer_name, ['target_id' => $image_file->id(), 'alt' => $image_details[1]]);
    }
    $scene_block->save();
  }
  if (Block::load('jurenites_theme_desk_arrival') === NULL) {
    $plugin_identifier = 'block_content:' . JURENITES_LAYERED_SCENE_UUID;
    Block::create([
      'id' => 'jurenites_theme_desk_arrival', 'theme' => 'jurenites_theme', 'region' => 'content',
      'weight' => -20, 'status' => TRUE, 'plugin' => $plugin_identifier,
      'settings' => ['id' => $plugin_identifier, 'label' => 'Desk arrival', 'label_display' => '0', 'provider' => 'block_content', 'view_mode' => 'full'],
      'visibility' => ['request_path' => ['id' => 'request_path', 'negate' => FALSE, 'pages' => '<front>']],
    ])->save();
  }
}
