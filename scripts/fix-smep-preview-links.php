<?php

/** Remove only SMEP preview links, preserving their contents and authored prose. */
$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties([
  'uuid' => '9dcf5017-82ef-477c-8d99-dcaa26896516',
]);
$project_node = reset($project_nodes);
if (!$project_node) {
  throw new RuntimeException('SMEP project not found.');
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  $changed_count = 0;
  foreach ($project_node->field_content_sections->referencedEntities() as $section_index => $story_section) {
    if (!$story_section->hasField('field_project_story_body')) {
      continue;
    }
    $body_value = $story_section->field_project_story_body->value ?? '';
    $updated_body = preg_replace_callback(
      '~(<div\b[^>]*\bdata-smep-preview="[^"]+"[^>]*>\s*)<a\b([^>]*)>(.*?)</a>~s',
      function ($preview_match) {
        $card_attributes = preg_replace('~\s+(?:href|aria-label)="[^"]*"~', '', $preview_match[2]);
        return $preview_match[1] . '<div' . $card_attributes . '>' . $preview_match[3] . '</div>';
      },
      $body_value,
      -1,
      $section_count,
    );
    if (!$section_count) {
      continue;
    }
    $changed_count += $section_count;
    $story_section->setNewRevision(TRUE);
    $story_section->field_project_story_body->value = $updated_body;
    $story_section->save();
    $project_node->field_content_sections[$section_index]->target_revision_id = $story_section->getRevisionId();
  }
  if ($changed_count) {
    $project_node->setNewRevision(TRUE);
    $project_node->setRevisionLogMessage('Remove original-image links from SMEP phone previews.');
    $project_node->save();
  }
  echo "Removed $changed_count SMEP preview links.\n";
} catch (\Throwable $save_error) {
  $database_transaction->rollBack();
  throw $save_error;
}
