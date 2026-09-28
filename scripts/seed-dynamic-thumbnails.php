<?php

/**
 * @file
 * Explicit, one-time local artwork assignment. Never run during normal updates.
 * Run: drush php:script scripts/seed-dynamic-thumbnails.php
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;

$project_artwork = [
  '/portfolio/my-second-font' => 'roundabout',
  '/portfolio/my-first-font' => '4pixel',
  '/portfolio/oksenate' => 'oksenate',
  '/portfolio/smep' => 'smep',
];
$target_directory = 'public://dynamic-thumbnails';
\Drupal::service('file_system')->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY);
foreach ($project_artwork as $project_alias => $artwork_name) {
  $internal_path = \Drupal::service('path_alias.manager')->getPathByAlias($project_alias);
  if (!preg_match('~^/node/(\d+)$~', $internal_path, $path_matches)) throw new \RuntimeException('Project alias missing: ' . $project_alias);
  $project_node = \Drupal\node\Entity\Node::load($path_matches[1]);
  if ($project_node->bundle() !== 'project') throw new \RuntimeException('Expected Project: ' . $project_alias);
  if (!$project_node->get('field_dynamic_thumbnail')->isEmpty()) {
    echo 'Preserved existing thumbnail: ' . $project_alias . PHP_EOL;
    continue;
  }
  $source_path = DRUPAL_ROOT . '/../src/public/assets/images/dynamic-thumbnails/' . $artwork_name . '.svg';
  $svg_source = file_get_contents($source_path);
  if (\Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg::prepare($svg_source, 'verify') === NULL) throw new \RuntimeException('Invalid artwork: ' . $artwork_name);
  $file_entity = \Drupal::service('file.repository')->writeData($svg_source, $target_directory . '/' . $artwork_name . '.svg', FileExists::Rename);
  $file_entity->setPermanent();
  $file_entity->save();
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Assign layered SVG preview artwork. Preserve the ordinary Image field.');
  $project_node->set('field_dynamic_thumbnail', ['target_id' => $file_entity->id()]);
  $project_node->save();
  echo 'Assigned ' . $artwork_name . ': ' . $project_alias . PHP_EOL;
}
