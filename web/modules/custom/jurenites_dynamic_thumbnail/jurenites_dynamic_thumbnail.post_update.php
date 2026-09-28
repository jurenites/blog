<?php

/**
 * Update authoring help for optional depth layers and raw Figma exports.
 */
function jurenites_dynamic_thumbnail_post_update_optional_svg_layers(&$sandbox = NULL): void {
  foreach (['project', 'article'] as $bundle_name) {
    $field_config = \Drupal\field\Entity\FieldConfig::loadByName('node', $bundle_name, 'field_dynamic_thumbnail');
    if ($field_config) {
      $field_config->setDescription(\Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg::UPLOAD_HELP)->save();
    }
  }
}

/** Update authoring help for arbitrary viewBox dimensions and depth counts. */
function jurenites_dynamic_thumbnail_post_update_flexible_svg_geometry(&$sandbox = NULL): void {
  jurenites_dynamic_thumbnail_post_update_optional_svg_layers($sandbox);
}
