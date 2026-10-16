<?php

declare(strict_types=1);

/** Explicit follow-up artwork assignment; preserve all authored project copy. */

use Drupal\Core\File\FileExists;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;

$project_node = Node::load(123);
if (!$project_node || $project_node->uuid() !== 'aa27a82a-b260-4d5b-9562-6cde46f7584c' || (int) $project_node->getRevisionId() !== 728) {
  throw new RuntimeException('The reviewed revision changed; preserve current editorial content.');
}
$source_markup = file_get_contents(__DIR__ . '/../src/public/assets/images/dynamic-thumbnails/ai-setup.svg');
if (ThumbnailSvg::prepare($source_markup, 'ai-setup-verify') === NULL) {
  throw new RuntimeException('Invalid AI setup SVG.');
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $thumbnail_file = \Drupal::service('file.repository')->writeData($source_markup, 'public://dynamic-thumbnails/ai-setup-washington-routes.svg', FileExists::Rename);
  $thumbnail_file->setPermanent();
  $thumbnail_file->save();
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Add Washington DC and use one raised arc per connection: Washington to Germany to UAE.');
  $project_node->set('field_dynamic_thumbnail', ['target_id' => $thumbnail_file->id()]);
  $project_node->save();
}
catch (Throwable $update_error) {
  $database_transaction->rollBack();
  throw $update_error;
}
echo 'Updated AI setup thumbnail, revision ' . $project_node->getRevisionId() . PHP_EOL;
