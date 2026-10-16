<?php

declare(strict_types=1);

/**
 * @file
 * Explicit local editorial update; the revision guard preserves later edits.
 * Run: drush php:script scripts/update-ai-setup-project.php
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\jurenites_dynamic_thumbnail\ThumbnailSvg;
use Drupal\node\Entity\Node;
use Drupal\Component\Utility\Html;

$project_node = Node::load(123);
if (!$project_node || $project_node->uuid() !== 'aa27a82a-b260-4d5b-9562-6cde46f7584c' || (int) $project_node->getRevisionId() !== 722) {
  throw new RuntimeException('The reviewed project revision changed. Preserve current editorial content and review before applying.');
}
$project_data = json_decode(file_get_contents(__DIR__ . '/content/ai-setup.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$source_markup = file_get_contents(__DIR__ . '/../src/public/assets/images/dynamic-thumbnails/ai-setup.svg');
if (ThumbnailSvg::prepare($source_markup, 'ai-setup-verify') === NULL) {
  throw new RuntimeException('Invalid AI setup SVG.');
}
$body_document = Html::load($project_node->body->value);
$project_link = $body_document->getElementsByTagName('a')->item(0)?->getAttribute('href');
if (!$project_link || !str_starts_with($project_link, 'https://ai-mcp-rag-calls-jurenites.just-brook-2743.chatgpt.site/')) {
  throw new RuntimeException('Expected project demo link is missing.');
}
$backup_directory = __DIR__ . '/../backups/ai-setup';
if (!is_dir($backup_directory)) mkdir($backup_directory, 0775, TRUE);
$backup_path = $backup_directory . '/revision-722.json';
if (!file_exists($backup_path)) {
  file_put_contents($backup_path, json_encode($project_node->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR));
}
$target_directory = 'public://dynamic-thumbnails';
\Drupal::service('file_system')->prepareDirectory($target_directory, FileSystemInterface::CREATE_DIRECTORY);
$database_transaction = \Drupal::database()->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo($project_node->getOwner());
try {
  $thumbnail_file = \Drupal::service('file.repository')->writeData($source_markup, $target_directory . '/ai-setup.svg', FileExists::Rename);
  $thumbnail_file->setPermanent();
  $thumbnail_file->save();
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Expand AI setup description and add layered globe routes with animated packets.');
  $project_node->set('body', [
    'value' => $project_data['project_body'] . '<p><a href="' . Html::escape($project_link) . '">' . Html::escape($project_data['project_link_label']) . '</a></p>',
    'summary' => $project_data['project_summary'],
    'format' => $project_node->body->format,
  ]);
  $project_node->set('field_dynamic_thumbnail', ['target_id' => $thumbnail_file->id()]);
  $validation_errors = $project_node->validate();
  if ($validation_errors->count()) throw new RuntimeException((string) $validation_errors);
  $project_node->save();
}
catch (Throwable $update_error) {
  $database_transaction->rollBack();
  throw $update_error;
}
finally {
  $account_switcher->switchBack();
}
echo 'Updated AI setup project, revision ' . $project_node->getRevisionId() . PHP_EOL;
