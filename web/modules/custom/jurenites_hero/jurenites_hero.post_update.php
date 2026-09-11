<?php

/**
 * @file
 * Content authoring updates for installed Hero sites.
 */

/**
 * Add the layered scene block and an initial secondary homepage placement.
 */
function jurenites_hero_post_update_add_layered_scene(&$sandbox = NULL): void {
  \Drupal::moduleHandler()->loadInclude('jurenites_hero', 'install');
  jurenites_hero_layered_scene_setup();
}

/**
 * Withhold the initial desk scene from the website pending photo rework.
 */
function jurenites_hero_post_update_withhold_desk_scene(&$sandbox = NULL): void {
  $scene_placement = \Drupal\block\Entity\Block::load('jurenites_theme_desk_arrival');
  if ($scene_placement && $scene_placement->getPluginId() === 'block_content:' . JURENITES_LAYERED_SCENE_UUID) {
    $scene_placement->disable()->save();
  }
}

/**
 * Move the translated Hero from the language homepages to the About pages.
 */
function jurenites_hero_post_update_move_hero_to_about(&$sandbox = NULL): string {
  \Drupal::moduleHandler()->loadInclude('jurenites_hero', 'install');
  $hero_placement = \Drupal\block\Entity\Block::load('jurenites_theme_homepage_hero');
  if (!$hero_placement || $hero_placement->getPluginId() !== 'block_content:' . JURENITES_HERO_BLOCK_UUID) {
    return 'The initial Hero placement was not found; no placement was changed.';
  }

  $placement_settings = $hero_placement->get('settings');
  $placement_settings['label'] = 'About hero';
  $hero_placement->set('settings', $placement_settings);
  $hero_placement->set('visibility', [
    'request_path' => [
      'id' => 'request_path',
      'negate' => FALSE,
      'pages' => "/about\n/obo",
    ],
  ]);
  $hero_placement->save();

  return 'Moved the translated Hero block from the homepages to the English and Russian About pages.';
}

/**
 * Rename the reusable Hero for its new editorial location.
 */
function jurenites_hero_post_update_rename_about_hero(&$sandbox = NULL): string {
  \Drupal::moduleHandler()->loadInclude('jurenites_hero', 'install');
  $block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  $hero_blocks = $block_storage->loadByProperties(['uuid' => JURENITES_HERO_BLOCK_UUID]);
  $hero_block = reset($hero_blocks);
  if (!$hero_block) {
    return 'The initial Hero content block was not found; no editorial label was changed.';
  }

  $hero_block->set('info', 'About hero');
  if ($hero_block->hasTranslation('ru')) {
    $hero_block->getTranslation('ru')->set('info', 'Обо мне: вводный блок');
  }
  $hero_block->save();

  return 'Renamed the English and Russian Hero labels for the About page.';
}
