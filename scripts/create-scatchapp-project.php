<?php

declare(strict_types=1);

/**
 * @file
 * Seed ScatchApp and its Home preview once; preserve later edits and clears.
 * Run build-scatchapp-preview.mjs and build:theme, then drush php:script this file.
 */

use Drupal\block\Entity\Block;
use Drupal\block_content\Entity\BlockContent;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\node\Entity\Node;
use Drupal\paragraphs\Entity\Paragraph;

$project_uuid = '837ef164-a7e0-482b-88b5-a9a720a0d777';
$preview_uuid = 'd70557b9-7e26-436a-9201-459375bd81f2';
$project_alias = '/portfolio/scatchapp';
$entity_manager = \Drupal::entityTypeManager();
$node_storage = $entity_manager->getStorage('node');
$existing_projects = $node_storage->loadByProperties(['uuid' => $project_uuid]);
$project_data = json_decode(file_get_contents(__DIR__ . '/content/scatchapp.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$preview_markup = file_get_contents(__DIR__ . '/../generated/content/scatchapp-preview.html');
if (!$preview_markup) {
  throw new RuntimeException('Generate the shared phone preview first.');
}
$author_accounts = $entity_manager->getStorage('user')->loadByProperties(['name' => 'alexander']);
$matching_terms = $entity_manager->getStorage('taxonomy_term')->loadByProperties(['vid' => 'tags', 'name' => '#UI/UX Design']);
if (!$author_accounts || !$matching_terms) {
  throw new RuntimeException('The existing author and UI/UX Design tag are required.');
}
$author_account = reset($author_accounts);
$project_term = reset($matching_terms);
$database_transaction = \Drupal::database()->startTransaction();
try {
  if (!$existing_projects) {
    if ($entity_manager->getStorage('path_alias')->loadByProperties(['alias' => $project_alias])) {
      throw new RuntimeException('The ScatchApp alias already exists; review before creating another page.');
    }
    $asset_directory = DRUPAL_ROOT . '/../src/public/assets/images/projects/scatchapp/';
    $svg_source = file_get_contents($asset_directory . 'thumbnail.svg');
    if (\Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg::prepare($svg_source, 'scatchapp-verify') === NULL) {
      throw new RuntimeException('The supplied SVG did not pass thumbnail validation.');
    }
    $public_directory = 'public://projects/scatchapp';
    \Drupal::service('file_system')->prepareDirectory($public_directory, FileSystemInterface::CREATE_DIRECTORY);
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
      'field_tags' => [['target_id' => $project_term->id()]],
      'field_content_sections' => $section_references,
      'field_image' => ['target_id' => $project_files['hero.png'], 'alt' => 'ScatchApp event map displayed on a phone against a textured background'],
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
    echo 'Created Project ' . $project_node->id() . ': ' . $project_alias . PHP_EOL;
  }
  else {
    echo 'Existing ScatchApp Project preserved.' . PHP_EOL;
  }

  $existing_previews = $entity_manager->getStorage('block_content')->loadByProperties(['uuid' => $preview_uuid]);
  if (!$existing_previews) {
    $preview_block = BlockContent::create([
      'type' => 'basic', 'uuid' => $preview_uuid, 'langcode' => 'en',
      'info' => 'ScatchApp interactive case preview',
      'body' => ['format' => 'full_html', 'value' => '<section class="project-case-preview"><div class="project-case-preview__copy"><h2>ScatchApp</h2><p>' . $project_data['project_summary'] . '</p><p><a href="/portfolio/scatchapp">Read the project note</a></p></div>' . $preview_markup . '</section>'],
    ]);
    $preview_block->save();
    Block::create([
      'id' => 'jurenites_theme_scatchapp_preview', 'theme' => 'jurenites_theme',
      'region' => 'content', 'weight' => 3, 'status' => TRUE,
      'plugin' => 'block_content:' . $preview_uuid,
      'settings' => ['id' => 'block_content:' . $preview_uuid, 'label' => 'ScatchApp', 'label_display' => FALSE, 'provider' => 'block_content', 'view_mode' => 'full'],
      'visibility' => ['request_path' => ['id' => 'request_path', 'negate' => FALSE, 'pages' => '<front>']],
    ])->save();
    echo 'Created editable Home preview (list, then filter).' . PHP_EOL;
  }
  else {
    echo 'Existing Home preview and placement preserved.' . PHP_EOL;
  }
}
catch (\Throwable $creation_error) {
  $database_transaction->rollBack();
  throw $creation_error;
}
unset($database_transaction);
