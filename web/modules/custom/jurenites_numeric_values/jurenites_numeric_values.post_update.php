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

/**
 * Adds optional tile links and points the commercial-project tile to Timeline.
 */
function jurenites_numeric_values_post_update_add_tile_links(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_numeric_values', 'install');
  jurenites_numeric_values_update_tile_links();
  jurenites_numeric_values_configure_displays();

  $content_block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  $numeric_block_ids = $content_block_storage->getQuery()
    ->accessCheck(FALSE)
    ->condition('uuid', JURENITES_NUMERIC_VALUES_HOMEPAGE_BLOCK_UUID)
    ->execute();
  $updated_tile_count = 0;
  foreach ($content_block_storage->loadMultiple($numeric_block_ids) as $homepage_numeric_block) {
    foreach ($homepage_numeric_block->get('field_numeric_items')->referencedEntities() as $item_delta => $numeric_item) {
      $numeric_description = (string) $numeric_item->get('field_numeric_description')->value;
      if ($numeric_description !== 'Projects commercial have worked with') {
        continue;
      }

      $numeric_item->set('field_numeric_link', [
        'uri' => 'internal:/timeline',
        'title' => 'see Timeline',
      ]);
      $numeric_item->save();
      $homepage_numeric_block->get('field_numeric_items')->set($item_delta, [
        'target_id' => $numeric_item->id(),
        'target_revision_id' => $numeric_item->getRevisionId(),
      ]);
      $updated_tile_count++;
    }
    if ($updated_tile_count > 0) {
      $homepage_numeric_block->save();
    }
  }

  return t('Added optional Numeric value tile links and linked @tile_count commercial-project tile to Timeline.', [
    '@tile_count' => $updated_tile_count,
  ]);
}

/**
 * Gives Numeric value destinations their own authored call-to-action labels.
 */
function jurenites_numeric_values_post_update_add_link_labels(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_numeric_values', 'install');
  jurenites_numeric_values_update_tile_links();
  jurenites_numeric_values_configure_displays();

  $content_block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  $numeric_block_ids = $content_block_storage->getQuery()
    ->accessCheck(FALSE)
    ->condition('uuid', JURENITES_NUMERIC_VALUES_HOMEPAGE_BLOCK_UUID)
    ->execute();
  $updated_tile_count = 0;
  foreach ($content_block_storage->loadMultiple($numeric_block_ids) as $homepage_numeric_block) {
    foreach ($homepage_numeric_block->get('field_numeric_items')->referencedEntities() as $item_delta => $numeric_item) {
      if ((string) $numeric_item->get('field_numeric_description')->value !== 'Projects commercial have worked with') {
        continue;
      }

      $numeric_item->set('field_numeric_link', [
        'uri' => 'internal:/timeline',
        'title' => 'see Timeline',
      ]);
      $numeric_item->save();
      $homepage_numeric_block->get('field_numeric_items')->set($item_delta, [
        'target_id' => $numeric_item->id(),
        'target_revision_id' => $numeric_item->getRevisionId(),
      ]);
      $updated_tile_count++;
    }
    if ($updated_tile_count > 0) {
      $homepage_numeric_block->save();
    }
  }

  return t('Added authored labels to Numeric value links and updated @tile_count Timeline call to action.', [
    '@tile_count' => $updated_tile_count,
  ]);
}

/**
 * Adds separate caption and caption-link fields to numeric tiles.
 */
function jurenites_numeric_values_post_update_add_tile_captions(): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_numeric_values', 'install');
  jurenites_numeric_values_update_tile_captions();
  return t('Added optional caption text and caption links to numeric tiles.');
}
