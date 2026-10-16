<?php

declare(strict_types=1);

/**
 * @file
 * Create Presentation UX in local Portfolio once, preserving subsequent CMS edits.
 * Run: docker exec blog_jurenites_web ./vendor/bin/drush php:script scripts/create-presentation-project.php
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;

if (getenv('DRUPAL_DATABASE_HOST') !== 'db') {
  throw new RuntimeException('This editorial seed is only for the local Docker database. Deploy content through the normal database procedure.');
}
$project_uuid = '57ae61ab-4c93-40ad-975a-21365074e437';
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_projects = $node_storage->loadByProperties(['uuid' => $project_uuid]);
if ($existing_projects) {
  echo 'Presentation UX already exists; existing editorial content and artwork preserved.' . PHP_EOL;
  return;
}
$project_alias = '/portfolio/presentation-ux';
if ($entity_manager->getStorage('path_alias')->loadByProperties(['alias' => $project_alias])) {
  throw new RuntimeException('The Presentation UX alias is already in use. Review before creating another project.');
}
$project_data = json_decode(file_get_contents(__DIR__ . '/content/presentation-ux.json'), TRUE, 512, JSON_THROW_ON_ERROR);
if ($node_storage->loadByProperties(['type' => 'project', 'title' => $project_data['project_title']])) {
  throw new RuntimeException('A Presentation UX project already exists. Review it before creating another.');
}
$source_markup = file_get_contents(__DIR__ . '/../src/public/assets/images/dynamic-thumbnails/presentation-ux.svg');
if (ThumbnailSvg::prepare($source_markup, 'presentation-review') === NULL) {
  throw new RuntimeException('Presentation UX artwork failed SVG validation.');
}
$tag_references = [];
foreach ($project_data['project_tags'] as $tag_name) {
  $matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => $tag_name]);
  if (!$matching_terms) throw new RuntimeException('Missing existing Portfolio tag: ' . $tag_name);
  $project_term = reset($matching_terms);
  $tag_references[] = ['target_id' => $project_term->id()];
}
$reference_projects = $node_storage->loadByProperties(['type' => 'project']);
if (!$reference_projects) throw new RuntimeException('No existing Portfolio author reference.');
$reference_project = reset($reference_projects);
$target_directory = 'public://dynamic-thumbnails';
\Drupal::service('file_system')->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY);
$database_transaction = \Drupal::database()->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo($reference_project->getOwner());
try {
  $thumbnail_file = \Drupal::service('file.repository')->writeData($source_markup, $target_directory . '/presentation-ux.svg', FileExists::Rename);
  $thumbnail_file->setPermanent();
  $thumbnail_file->save();
  $section_references = [];
  foreach ($project_data['story_sections'] as $story_section) {
    $section_references[] = ['entity' => Paragraph::create([
      'type' => 'project_story',
      'field_project_story_body' => ['value' => $story_section['story_html'], 'format' => 'full_html'],
    ])];
  }
  $project_node = Node::create([
    'type' => 'project',
    'uuid' => $project_uuid,
    'langcode' => 'en',
    'title' => $project_data['project_title'],
    'uid' => $reference_project->getOwnerId(),
    'status' => TRUE,
    'body' => ['value' => $project_data['project_intro'], 'summary' => $project_data['project_summary'], 'format' => 'full_html'],
    'path' => ['alias' => $project_alias, 'pathauto' => FALSE],
    'field_dynamic_thumbnail' => ['target_id' => $thumbnail_file->id()],
    'field_tags' => $tag_references,
    'field_content_sections' => $section_references,
  ]);
  $validation_errors = $project_node->validate();
  if ($validation_errors->count()) throw new RuntimeException((string) $validation_errors);
  $project_node->setRevisionLogMessage('Create Presentation UX case study with three-level editable SVG thumbnail in local Portfolio.');
  $project_node->save();
  echo 'Created local Project ' . $project_node->id() . ' at ' . $project_alias . PHP_EOL;
  echo 'Managed SVG: ' . $thumbnail_file->getFileUri() . PHP_EOL;
}
catch (Throwable $creation_error) {
  $database_transaction->rollBack();
  throw $creation_error;
}
finally {
  $account_switcher->switchBack();
}
