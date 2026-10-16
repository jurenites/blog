<?php

declare(strict_types=1);

/** Apply the reviewed hand-drawn Presentation thumbnail locally to both languages. */
use Drupal\Core\File\FileExists;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;

if (getenv('DRUPAL_DATABASE_HOST') !== 'db') {
  throw new RuntimeException('This artwork update is local-only.');
}
$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties(['uuid' => '57ae61ab-4c93-40ad-975a-21365074e437']);
$project_node = reset($project_nodes);
if (!$project_node) throw new RuntimeException('Presentation UX not found.');
$source_markup = file_get_contents(__DIR__ . '/../src/public/assets/images/dynamic-thumbnails/presentation-ux.svg');
if (ThumbnailSvg::prepare($source_markup, 'presentation-elevation') === NULL) {
  throw new RuntimeException('Invalid Presentation artwork.');
}
$existing_file = $project_node->field_dynamic_thumbnail->entity;
if ($existing_file && file_get_contents($existing_file->getFileUri()) === $source_markup) {
  echo "Presentation artwork is already current.\n";
  return;
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $thumbnail_file = \Drupal::service('file.repository')->writeData($source_markup, 'public://dynamic-thumbnails/presentation-ux-elevation.svg', FileExists::Rename);
  $thumbnail_file->setPermanent();
  $thumbnail_file->save();
  foreach ($project_node->getTranslationLanguages() as $language_code => $language_object) {
    $project_node->getTranslation($language_code)->set('field_dynamic_thumbnail', ['target_id' => $thumbnail_file->id()]);
  }
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Use the hand-drawn Presentation artwork with sequential table and dialog elevation.');
  $project_node->save();
  echo 'Updated local Presentation artwork: ' . $thumbnail_file->getFileUri() . PHP_EOL;
}
catch (Throwable $update_error) {
  $database_transaction->rollBack();
  throw $update_error;
}
