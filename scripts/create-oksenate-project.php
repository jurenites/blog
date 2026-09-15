<?php

declare(strict_types=1);

/**
 * @file
 * Creates the editable Oksenate case study; reruns preserve existing content.
 * Run: drush php:script scripts/create-oksenate-project.php
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\field\Entity\FieldConfig;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\taxonomy\Entity\Term;

$project_uuid = '26681fb7-751e-40b6-a3d1-f9c33fe56ab3';
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_projects = $node_storage->loadByProperties(['uuid' => $project_uuid]);
if ($existing_projects) {
  $existing_project = reset($existing_projects);
  echo 'Oksenate already exists; editorial content preserved. Node ' . $existing_project->id() . PHP_EOL;
  return;
}
$existing_aliases = $entity_manager->getStorage('path_alias')->loadByProperties(['alias' => '/portfolio/oksenate']);
if ($existing_aliases || $node_storage->loadByProperties(['type' => 'project', 'title' => 'Oksenate'])) {
  throw new RuntimeException('An Oksenate page already exists. Review it before creating another.');
}
foreach (['jurenites_font_projects', 'jurenites_numeric_values', 'image_compare_media'] as $required_module) {
  if (!\Drupal::moduleHandler()->moduleExists($required_module)) {
    throw new RuntimeException('Apply the existing recipe for ' . $required_module . ' first.');
  }
}

$project_data = json_decode(file_get_contents(__DIR__ . '/content/oksenate.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$thumbnail_path = dirname(__DIR__) . '/src/public/assets/images/projects/oksenate/homepage-hero-2026-09-11.png';
if (!is_file($thumbnail_path)) {
  throw new RuntimeException('Missing Oksenate homepage capture.');
}

// Reuse the existing Numeric Values paragraph without replacing other choices.
$sections_field = FieldConfig::load('node.project.field_content_sections');
$handler_settings = $sections_field->getSetting('handler_settings');
$handler_settings['target_bundles']['numeric_values'] = 'numeric_values';
$handler_settings['target_bundles_drag_drop']['numeric_values'] = ['weight' => 3, 'enabled' => TRUE];
$sections_field->setSetting('handler_settings', $handler_settings)->save();

// The existing accessible comparison widget becomes an optional Project field.
if (!FieldConfig::load('node.project.field_comparison_images')) {
  $comparison_config = \Drupal::config('field.field.node.image_comparison.field_comparison_images')->getRawData();
  unset($comparison_config['uuid'], $comparison_config['_core']);
  $comparison_config['id'] = 'node.project.field_comparison_images';
  $comparison_config['bundle'] = 'project';
  $comparison_config['required'] = FALSE;
  $comparison_config['description'] = 'Optional before-and-after comparison. Select two aligned Image media items: Before first, After second. Both are required for the public slider to appear.';
  $comparison_config['dependencies']['config'] = ['field.storage.node.field_comparison_images', 'media.type.image', 'node.type.project'];
  FieldConfig::create($comparison_config)->save();
}
$display_repository = \Drupal::service('entity_display.repository');
$comparison_widget = $display_repository->getFormDisplay('node', 'image_comparison')->getComponent('field_comparison_images');
$comparison_widget['weight'] = 15;
$project_form = $display_repository->getFormDisplay('node', 'project');
if (!$project_form->getComponent('field_comparison_images')) {
  $project_form->setComponent('field_comparison_images', $comparison_widget)->save();
}
$comparison_formatter = $display_repository->getViewDisplay('node', 'image_comparison')->getComponent('field_comparison_images');
$comparison_formatter['weight'] = 15;
$project_display = $display_repository->getViewDisplay('node', 'project');
if (!$project_display->getComponent('field_comparison_images')) {
  $project_display->setComponent('field_comparison_images', $comparison_formatter)->save();
}
\Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();

$public_directory = 'public://projects/oksenate';
\Drupal::service('file_system')->prepareDirectory($public_directory, FileSystemInterface::CREATE_DIRECTORY);
$thumbnail_uri = $public_directory . '/homepage-hero-2026-09-11.png';
$existing_files = $entity_manager->getStorage('file')->loadByProperties(['uri' => $thumbnail_uri]);
$thumbnail_file = $existing_files ? reset($existing_files) : \Drupal::service('file.repository')->writeData(
  file_get_contents($thumbnail_path), $thumbnail_uri, FileExists::Rename,
);

$tag_references = [];
foreach ($project_data['project_tags'] as $tag_name) {
  $matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => $tag_name]);
  $project_term = $matching_terms ? reset($matching_terms) : Term::create(['vid' => 'tags', 'name' => $tag_name]);
  if ($project_term->isNew()) {
    $project_term->save();
  }
  $tag_references[] = ['target_id' => $project_term->id()];
}

$numeric_references = [];
foreach ($project_data['result_items'] as $result_item) {
  $numeric_paragraph = Paragraph::create([
    'type' => 'numeric_value',
    'field_numeric_number' => $result_item['numeric_number'],
    'field_numeric_description' => $result_item['numeric_description'],
    'field_numeric_caption' => $result_item['numeric_caption'],
  ]);
  $numeric_references[] = ['entity' => $numeric_paragraph];
}
$section_references = [['entity' => Paragraph::create([
  'type' => 'numeric_values',
  'field_numeric_items' => $numeric_references,
])]];
foreach ($project_data['story_sections'] as $story_section) {
  $section_references[] = ['entity' => Paragraph::create([
    'type' => 'project_story',
    'field_project_story_body' => ['value' => $story_section['story_html'], 'format' => 'full_html'],
  ])];
}

$project_values = [
  'type' => 'project',
  'uuid' => $project_uuid,
  'langcode' => 'en',
  'title' => $project_data['project_title'],
  'status' => TRUE,
  'body' => ['value' => $project_data['project_intro'], 'summary' => $project_data['project_summary'], 'format' => 'basic_html'],
  'path' => ['alias' => '/portfolio/oksenate', 'pathauto' => FALSE],
  'field_image' => ['target_id' => $thumbnail_file->id(), 'alt' => 'Oklahoma Senate homepage hero with the Capitol building, Senate seal and welcome heading. Captured 11 September 2026.'],
  'field_tags' => $tag_references,
  'field_content_sections' => $section_references,
];
// Follow the existing Portfolio authorship instead of assuming an account ID.
$portfolio_projects = $node_storage->loadByProperties(['type' => 'project']);
if ($portfolio_projects) {
  $reference_project = reset($portfolio_projects);
  $project_values['uid'] = $reference_project->getOwnerId();
}
$project_node = Node::create($project_values);
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo($project_node->getOwner());
try {
  $validation_errors = $project_node->validate();
  if ($validation_errors->count()) {
    throw new RuntimeException((string) $validation_errors);
  }
  $project_node->save();
}
finally {
  $account_switcher->switchBack();
}
echo 'Created /portfolio/oksenate; node ' . $project_node->id() . '. Comparison images remain empty for the editor.' . PHP_EOL;
