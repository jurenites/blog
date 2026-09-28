<?php

declare(strict_types=1);

/**
 * @file
 * Replace ScatchApp's two standalone recordings with one shared phone sequence.
 * Generates new revisions and preserves all surrounding authored content.
 */

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$project_nodes = $node_storage->loadByProperties(['uuid' => '837ef164-a7e0-482b-88b5-a9a720a0d777']);
$project_node = reset($project_nodes);
if (!$project_node) {
  throw new RuntimeException('ScatchApp Project was not found.');
}
$preview_markup = file_get_contents(__DIR__ . '/../generated/content/scatchapp-detail-preview.html');
if (!$preview_markup || !str_contains($preview_markup, 'card--native-screen') || !str_contains($preview_markup, 'card--transparent')) {
  throw new RuntimeException('Generate the native transparent detail preview first.');
}
$section_changes = [];
$recording_count = 0;
$existing_count = 0;
foreach ($project_node->field_content_sections as $section_index => $section_reference) {
  $section_entity = $section_reference->entity;
  if (!$section_entity->hasField('field_project_story_body')) {
    continue;
  }
  $body_value = $section_entity->field_project_story_body->value;
  $existing_count += substr_count($body_value, 'data-scatchapp-sequence');
  if (str_contains($body_value, 'data-scatchapp-sequence')) {
    continue;
  }
  $updated_body = preg_replace_callback('~(?:<p>\s*)?<video\b[^>]*\bsrc="/themes/custom/jurenites_theme/assets/videos/scatchapp/(list|filter)\.mp4"[^>]*>\s*</video>(?:\s*</p>)?~i',
    function (array $video_match) use (&$recording_count, $preview_markup): string {
      $recording_count++;
      return $video_match[1] === 'list' ? '<div data-scatchapp-sequence>' . $preview_markup . '</div>' : '';
    }, $body_value);
  if ($updated_body !== $body_value) {
    $section_changes[$section_index] = [$section_entity, $updated_body];
  }
}
if ($existing_count === 1 && $recording_count === 0) {
  echo "Existing ScatchApp sequence preserved.\n";
  return;
}
if ($existing_count !== 0 || $recording_count !== 2 || count($section_changes) !== 2) {
  throw new RuntimeException('Expected exactly two standalone recordings in two paragraphs; no changes saved.');
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $previous_revision = $project_node->getRevisionId();
  $project_node->setNewRevision(TRUE);
  $project_node->setRevisionLogMessage('Combine the existing ScatchApp recordings in one native transparent phone preview with cursor following.');
  foreach ($section_changes as $section_index => [$section_entity, $updated_body]) {
    $section_entity->setNewRevision(TRUE);
    $section_entity->isDefaultRevision(TRUE);
    $section_entity->field_project_story_body->value = $updated_body;
    $section_entity->save();
    $project_node->field_content_sections[$section_index] = [
      'target_id' => $section_entity->id(),
      'target_revision_id' => $section_entity->getRevisionId(),
    ];
  }
  $project_node->save();
  echo 'Updated Project ' . $project_node->id() . ': revision ' . $previous_revision . ' -> ' . $project_node->getRevisionId() . PHP_EOL;
}
catch (\Throwable $update_error) {
  $database_transaction->rollBack();
  throw $update_error;
}
unset($database_transaction);
