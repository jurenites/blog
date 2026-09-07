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
