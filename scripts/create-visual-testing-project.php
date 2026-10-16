<?php

declare(strict_types=1);

/**
 * @file
 * Seed the Visual testing Project once; preserve subsequent CMS edits and clears.
 * Run: drush php:script scripts/create-visual-testing-project.php
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;

$project_uuid = '13950cdc-5c39-479c-813d-18762e7b5a27';
$project_alias = '/portfolio/visual-testing';
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_projects = $node_storage->loadByProperties(['uuid' => $project_uuid]);
if ($existing_projects) {
  $existing_project = reset($existing_projects);
  echo 'Visual testing already exists; editorial content preserved. Node ' . $existing_project->id() . PHP_EOL;
  return;
}
$project_data = json_decode(file_get_contents(__DIR__ . '/content/visual-testing.json'), TRUE, 512, JSON_THROW_ON_ERROR);
if ($entity_manager->getStorage('path_alias')->loadByProperties(['alias' => $project_alias]) || $node_storage->loadByProperties(['type' => 'project', 'title' => $project_data['project_title']])) {
  throw new RuntimeException('A matching project or alias exists; review before creating another.');
}
$author_accounts = $entity_manager->getStorage('user')->loadByProperties(['name' => 'alexander']);
if (!$author_accounts) {
  throw new RuntimeException('The existing alexander author is required.');
}
$author_account = reset($author_accounts);
$tag_references = [];
foreach (['#UI/UX Design', '#Programming'] as $tag_name) {
  $matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => $tag_name]);
  if (!$matching_terms) {
    throw new RuntimeException('Missing existing portfolio tag: ' . $tag_name);
  }
  $project_term = reset($matching_terms);
  $tag_references[] = ['target_id' => $project_term->id()];
}
$asset_directory = __DIR__ . '/../src/public/assets/images/projects/visual-testing/';
$svg_source = file_get_contents($asset_directory . 'thumbnail.svg');
if (ThumbnailSvg::prepare($svg_source, 'visual-testing-verify') === NULL) {
  throw new RuntimeException('The three-layer SVG did not pass thumbnail validation.');
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $public_directory = 'public://projects/visual-testing';
  if (!\Drupal::service('file_system')->prepareDirectory($public_directory, FileSystemInterface::CREATE_DIRECTORY)) {
    throw new RuntimeException('Cannot prepare the project asset directory.');
  }
  $project_files = [];
  foreach (['hero.png', 'thumbnail.svg'] as $asset_name) {
    $asset_file = \Drupal::service('file.repository')->writeData(file_get_contents($asset_directory . $asset_name), $public_directory . '/' . $asset_name, FileExists::Rename);
    $asset_file->setPermanent();
    $asset_file->save();
    $project_files[$asset_name] = $asset_file->id();
  }
  $section_references = [];
  foreach ($project_data['story_sections'] as $story_section) {
    $section_references[] = ['entity' => Paragraph::create([
      'type' => 'project_story',
      'field_project_story_body' => ['value' => $story_section['story_html'], 'format' => 'full_html'],
    ])];
  }
  $project_node = Node::create([
    'type' => 'project', 'uuid' => $project_uuid, 'uid' => $author_account->id(),
    'langcode' => 'en', 'title' => $project_data['project_title'], 'status' => TRUE,
    'body' => ['value' => $project_data['project_intro'], 'summary' => $project_data['project_summary'], 'format' => 'full_html'],
    'path' => ['alias' => $project_alias, 'pathauto' => FALSE],
    'field_tags' => $tag_references,
    'field_content_sections' => $section_references,
    'field_image' => ['target_id' => $project_files['hero.png'], 'alt' => 'Three layered comparison panels: Figma design, Storybook component and the website'],
    'field_dynamic_thumbnail' => ['target_id' => $project_files['thumbnail.svg']],
  ]);
  $account_switcher = \Drupal::service('account_switcher');
  $account_switcher->switchTo($author_account);
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
}
catch (Throwable $creation_error) {
  $database_transaction->rollBack();
  throw $creation_error;
}
unset($database_transaction);
echo 'Created Project ' . $project_node->id() . ': ' . $project_alias . ' with seven editable story sections.' . PHP_EOL;
