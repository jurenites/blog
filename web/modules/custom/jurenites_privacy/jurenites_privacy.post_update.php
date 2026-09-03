<?php

/**
 * @file
 * Post-update functions for Jurenites Privacy.
 */

use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Replaces the fixed route with a Basic Page and Drupal footer blocks.
 */
function jurenites_privacy_post_update_move_policy_to_content(array &$update_sandbox): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_privacy', 'install');
  $created_content = jurenites_privacy_ensure_site_content();

  return t('Created Privacy Policy Basic Page @node_id, footer menu link @menu_link_id, and Drupal footer block placements.', [
    '@node_id' => $created_content['node_id'],
    '@menu_link_id' => $created_content['menu_link_id'],
  ]);
}

/**
 * Moves the cookie notice copy into an editable Drupal Content Block.
 */
function jurenites_privacy_post_update_make_notice_editable(array &$update_sandbox): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_privacy', 'install');
  $updated_content = jurenites_privacy_ensure_site_content();

  return t('Created editable Cookie Policy Notice Content Block @block_id and updated its Footer-region placement.', [
    '@block_id' => $updated_content['content_block_id'],
  ]);
}

/**
 * Corrects existing placements that retained the retired code plugin ID.
 */
function jurenites_privacy_post_update_repair_notice_placement(array &$update_sandbox): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_privacy', 'install');
  $updated_content = jurenites_privacy_ensure_site_content();

  return t('Connected Footer placement to editable Cookie Policy Notice Content Block @block_id.', [
    '@block_id' => $updated_content['content_block_id'],
  ]);
}

/**
 * Discloses the local browser storage used for notice dismissal.
 */
function jurenites_privacy_post_update_disclose_notice_storage(array &$update_sandbox): TranslatableMarkup {
  \Drupal::moduleHandler()->loadInclude('jurenites_privacy', 'install');
  $updated_content = jurenites_privacy_ensure_site_content();

  return t('Updated Privacy Policy Basic Page @node_id with the notice-storage disclosure.', [
    '@node_id' => $updated_content['node_id'],
  ]);
}
