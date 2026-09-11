<?php

declare(strict_types=1);

/**
 * @file
 * Creates the first SMEP Project article without replacing editorial changes.
 * Run: drush php:script scripts/create-smep-project.php
 */

use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\taxonomy\Entity\Term;

// Restricted HTML supplies paragraphs from blank lines after filtering tags.
function smep_story_markup(string $story_html): string {
  return trim(str_replace(['<p>', '</p>'], ['', "\n\n"], $story_html));
}

$project_uuid = '9dcf5017-82ef-477c-8d99-dcaa26896516';
$project_alias = '/portfolio/smep';
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_projects = $node_storage->loadByProperties(['uuid' => $project_uuid]);
if ($existing_projects) {
  $existing_project = reset($existing_projects);
  echo 'SMEP already exists; editorial content preserved. Node ' . $existing_project->id() . PHP_EOL;
  return;
}

$project_data = json_decode(file_get_contents(__DIR__ . '/content/smep.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$existing_aliases = $entity_manager->getStorage('path_alias')->loadByProperties(['alias' => $project_alias]);
if ($existing_aliases || $node_storage->loadByProperties(['type' => 'project', 'title' => $project_data['project_title']])) {
  throw new RuntimeException('An SMEP page already exists. Review it before creating another.');
}
if (!\Drupal::moduleHandler()->moduleExists('jurenites_font_projects')) {
  throw new RuntimeException('Apply the existing font-project recipe to install Project and Project story first.');
}
$author_accounts = $entity_manager->getStorage('user')->loadByProperties(['name' => 'alexander']);
if (!$author_accounts) {
  throw new RuntimeException('The alexander author account is required for this personal project.');
}
$author_account = reset($author_accounts);
$database_transaction = \Drupal::database()->startTransaction();
try {
  $tag_references = [];
  foreach ($project_data['project_tags'] as $tag_name) {
    $matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => $tag_name]);
    $project_term = $matching_terms ? reset($matching_terms) : Term::create(['vid' => 'tags', 'name' => $tag_name]);
    if ($project_term->isNew()) {
      $project_term->save();
    }
    $tag_references[] = ['target_id' => $project_term->id()];
  }

  $section_references = [];
  foreach ($project_data['story_sections'] as $story_section) {
    $section_references[] = ['entity' => Paragraph::create([
      'type' => 'project_story',
      'field_project_story_body' => ['value' => smep_story_markup($story_section['story_html']), 'format' => 'restricted_html'],
    ])];
  }
  $project_node = Node::create([
    'type' => 'project',
    'uuid' => $project_uuid,
    'uid' => $author_account->id(),
    'langcode' => 'en',
    'title' => $project_data['project_title'],
    'status' => TRUE,
    'body' => ['value' => smep_story_markup($project_data['project_intro']), 'summary' => $project_data['project_summary'], 'format' => 'restricted_html'],
    'path' => ['alias' => $project_alias, 'pathauto' => FALSE],
    'field_tags' => $tag_references,
    'field_content_sections' => $section_references,
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
catch (\Throwable $creation_error) {
  $database_transaction->rollBack();
  throw $creation_error;
}
unset($database_transaction);
echo 'Created ' . $project_alias . '; node ' . $project_node->id() . ', with six editable story sections.' . PHP_EOL;
