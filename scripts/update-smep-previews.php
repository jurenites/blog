<?php

/** Insert four phone sequences once, retaining authored text and previous revisions. */
$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties([
  'uuid' => '9dcf5017-82ef-477c-8d99-dcaa26896516',
]);
$project_node = reset($project_nodes);
if (!$project_node) {
  throw new RuntimeException('SMEP project not found.');
}
$preview_groups = json_decode(file_get_contents(__DIR__ . '/../generated/content/smep/previews.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$story_sections = $project_node->field_content_sections->referencedEntities();
foreach ($story_sections as $story_section) {
  if ($story_section->hasField('field_project_story_body') && str_contains($story_section->field_project_story_body->value ?? '', 'data-smep-preview')) {
    echo "Existing SMEP previews preserved.\n";
    return;
  }
}
$section_changes = [];
foreach ($preview_groups as $preview_group) {
  foreach ($story_sections as $section_index => $story_section) {
    if ($story_section->uuid() === $preview_group['section_uuid'] && $story_section->hasField('field_project_story_body')) {
      $section_changes[$section_index] = $preview_group['preview_markup'];
    }
  }
}
if (count($section_changes) !== 4) {
  throw new RuntimeException('Expected four SMEP story sections; nothing changed.');
}
file_put_contents(__DIR__ . '/../generated/content/smep/content-before.json', json_encode([
  'node_revision' => $project_node->getRevisionId(),
  'sections' => array_map(fn($story_section) => $story_section->toArray(), $story_sections),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
$database_transaction = \Drupal::database()->startTransaction();
try {
  $project_node->setNewRevision(TRUE);
  foreach ($section_changes as $section_index => $preview_markup) {
    $story_section = $story_sections[$section_index];
    $story_section->setNewRevision(TRUE);
    $story_section->field_project_story_body->value .= "\n" . $preview_markup;
    $story_section->save();
    $project_node->field_content_sections[$section_index]->target_revision_id = $story_section->getRevisionId();
  }
  $project_node->setRevisionLogMessage('Distribute four SMEP iPhone sequences across the project story: element cards, playground, orbitals and guidelines.');
  $project_node->save();
  echo 'Saved four SMEP previews in node ' . $project_node->id() . ', revision ' . $project_node->getRevisionId() . PHP_EOL;
} catch (\Throwable $save_error) {
  $database_transaction->rollBack();
  throw $save_error;
}
