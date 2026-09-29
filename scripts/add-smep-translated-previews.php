<?php

/** Add missing SMEP previews to Russian sections without replacing their text. */
$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties([
  'uuid' => '9dcf5017-82ef-477c-8d99-dcaa26896516',
]);
$project_node = reset($project_nodes);
if (!$project_node || !$project_node->hasTranslation('ru')) {
  throw new RuntimeException('Russian SMEP project translation not found.');
}
$preview_groups = json_decode(file_get_contents(__DIR__ . '/../generated/content/smep/previews.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$section_changes = [];
foreach ($project_node->field_content_sections->referencedEntities() as $section_index => $story_section) {
  foreach ($preview_groups as $preview_group) {
    if ($story_section->uuid() !== $preview_group['section_uuid']) {
      continue;
    }
    if (!$story_section->hasTranslation('ru') || !$story_section->hasField('field_project_story_body')) {
      throw new RuntimeException('Expected translated SMEP story section missing.');
    }
    $translated_section = $story_section->getTranslation('ru');
    $body_value = $translated_section->field_project_story_body->value ?? '';
    if (str_contains($body_value, 'data-smep-preview')) {
      continue;
    }
    $section_changes[$section_index] = [$translated_section, $preview_group['preview_markup']];
  }
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  foreach ($section_changes as $section_index => [$translated_section, $preview_markup]) {
    $translated_section->setNewRevision(TRUE);
    $translated_section->field_project_story_body->value .= "\n" . $preview_markup;
    $translated_section->save();
    foreach ($project_node->getTranslationLanguages() as $language_code => $language_item) {
      $project_node->getTranslation($language_code)->field_content_sections[$section_index]->target_revision_id = $translated_section->getRevisionId();
    }
  }
  if ($section_changes) {
    $project_node->setNewRevision(TRUE);
    $project_node->setRevisionLogMessage('Add the four phone previews to matching Russian SMEP story sections.');
    $project_node->save();
  }
  echo 'Added ' . count($section_changes) . " Russian SMEP previews.\n";
} catch (\Throwable $save_error) {
  $database_transaction->rollBack();
  throw $save_error;
}
