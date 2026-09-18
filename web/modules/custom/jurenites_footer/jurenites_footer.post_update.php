<?php

/**
 * @file
 * Preserves editable footer content while extending its presentation fields.
 */

use Drupal\jurenites_footer\HoverPaint;
use Drupal\jurenites_footer\LegacyHoverPaint;

/**
 * Replaces the preset selector with a shared, validated color/gradient string.
 */
function jurenites_footer_post_update_hover_paint(array &$update_sandbox): string {
  \Drupal::moduleHandler()->loadInclude('jurenites_footer', 'install');
  jurenites_footer_install_hover_paint();
  \Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
  $menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
  $menu_storage->resetCache();
  $updated_count = 0;
  foreach ($menu_storage->loadByProperties(['menu_name' => 'footer']) as $menu_entity) {
    if (!$menu_entity->get('field_footer_hover_paint')->isEmpty() || !$menu_entity->hasField('field_footer_color')) {
      continue;
    }
    $paint_value = HoverPaint::legacyValue((string) $menu_entity->get('field_footer_color')->value);
    if ($paint_value !== '') {
      $menu_entity->set('field_footer_hover_paint', $paint_value)->save();
      $updated_count++;
    }
  }
  return "Migrated $updated_count footer hover settings to the editable color/gradient field. Legacy values remain hidden for rollback.";
}

/**
 * Enables nested footer sections and creates the separate legal menu.
 */
function jurenites_footer_post_update_sections(array &$update_sandbox): string {
  \Drupal::moduleHandler()->loadInclude('jurenites_footer', 'install');
  jurenites_footer_install_sections();
  return 'Added Section heading and the separate Footer legal menu. Existing links are preserved.';
}

/**
 * Stores removed footer token colors directly in existing menu content.
 */
function jurenites_footer_post_update_literal_hover_paint(array &$update_sandbox): string {
  $menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
  // Include historical revisions so reverting an item cannot revive dead tokens.
  $revision_ids = $menu_storage->getQuery()->accessCheck(FALSE)->allRevisions()
    ->condition('menu_name', ['footer', 'footer-legal'], 'IN')->execute();
  $updated_count = 0;
  foreach (array_keys($revision_ids) as $revision_id) {
    $menu_entity = $menu_storage->loadRevision($revision_id);
    if (!$menu_entity || !$menu_entity->hasField('field_footer_hover_paint')) {
      continue;
    }
    $paint_value = (string) $menu_entity->get('field_footer_hover_paint')->value;
    $resolved_paint = LegacyHoverPaint::resolveReferences($paint_value);
    if ($resolved_paint === $paint_value) {
      continue;
    }
    $menu_entity->setNewRevision(FALSE);
    $menu_entity->set('field_footer_hover_paint', $resolved_paint)->save();
    $updated_count++;
  }
  return "Resolved removed footer color tokens in $updated_count menu revisions. Custom paint and other content are preserved.";
}
