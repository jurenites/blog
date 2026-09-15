<?php

declare(strict_types=1);

/**
 * @file
 * Checks seeded content and renders an unsaved comparison without changing data.
 * Run with drush php:script tests/oksenate-project.php.
 */

use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;

function require_oksenate_condition(bool $check_result, string $check_message): void {
  if (!$check_result) {
    throw new RuntimeException($check_message);
  }
}

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$matching_nodes = $node_storage->loadByProperties(['uuid' => '26681fb7-751e-40b6-a3d1-f9c33fe56ab3']);
require_oksenate_condition(count($matching_nodes) === 1, 'Exactly one case study must exist.');
$project_node = reset($matching_nodes);
require_oksenate_condition($project_node->isPublished(), 'The case study must appear in Portfolio.');
require_oksenate_condition($project_node->field_comparison_images->isEmpty(), 'Editorial comparison images should remain empty.');
require_oksenate_condition(count($project_node->field_content_sections) === 7, 'Expected numeric outcomes and six stories.');
require_oksenate_condition($project_node->field_image->entity->getFileUri() === 'public://projects/oksenate/homepage-hero-2026-09-11.png', 'Expected the supplied homepage hero capture.');
require_oksenate_condition(\Drupal::service('path_alias.manager')->getAliasByPath('/node/' . $project_node->id()) === '/portfolio/oksenate', 'Expected the canonical Portfolio alias.');
$numeric_section = $project_node->field_content_sections->first()->entity;
require_oksenate_condition(count($numeric_section->field_numeric_items) === 3, 'Expected three editable outcome tiles.');

// Unsaved fixtures exercise the real media formatter without attaching test
// screenshots to the authored page or creating media records in the database.
$comparison_media = [];
foreach (['Before', 'After'] as $comparison_label) {
  $comparison_media[] = ['entity' => Media::create([
    'bundle' => 'image',
    'name' => $comparison_label . ' test image',
    'status' => TRUE,
    'field_media_image' => [
      'target_id' => $project_node->field_image->target_id,
      'alt' => $comparison_label . ' test image',
    ],
  ])];
}
$comparison_node = Node::create([
  'type' => 'project',
  'title' => 'Unsaved comparison check',
  'field_comparison_images' => $comparison_media,
]);
$field_build = $comparison_node->field_comparison_images->view('default');
$comparison_markup = (string) \Drupal::service('renderer')->renderInIsolation($field_build);
require_oksenate_condition(str_contains($comparison_markup, '<image-compare '), 'Expected the accessible comparison widget.');
require_oksenate_condition(str_contains($comparison_markup, 'slot="image-1"') && str_contains($comparison_markup, 'slot="image-2"'), 'Both comparison images must render.');
require_oksenate_condition(str_contains($comparison_markup, 'Before test image') && str_contains($comparison_markup, 'After test image'), 'Image descriptions must survive rendering.');
echo 'PASS: authored content, alias, thumbnail, outcome tiles and two-image formatter; no test content saved.' . PHP_EOL;
