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
