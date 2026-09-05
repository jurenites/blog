<?php

/**
 * @file
 * Post-update functions for Jurenites Numeric Values.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Adds the structured reusable Numeric values block to the homepage.
 */
function jurenites_numeric_values_post_update_add_homepage_block(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_numeric_values', 'install');
  $numeric_block = jurenites_numeric_values_ensure_homepage_block();

  return t('Created Numeric values Content Block @block_id and homepage placement @placement_id.', [
    '@block_id' => $numeric_block['content_block_id'],
    '@placement_id' => $numeric_block['placement_id'],
  ]);
}

/**
 * Replaces calculated start years and icon names with authored values and SVGs.
 */
function jurenites_numeric_values_post_update_use_authored_numbers_and_svg_icons(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_numeric_values', 'install');
  jurenites_numeric_values_update_tile_fields();
  jurenites_numeric_values_configure_displays();

  return t('Migrated start years to authored numbers and replaced icon names with SVG file attachments.');
}
