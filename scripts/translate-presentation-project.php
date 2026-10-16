<?php

declare(strict_types=1);

/** Seed the local Russian Presentation UX translation once; preserve later edits. */
if (getenv('DRUPAL_DATABASE_HOST') !== 'db') {
  throw new RuntimeException('Run only against the local Docker database.');
}
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$project_nodes = $node_storage->loadByProperties(['uuid' => '57ae61ab-4c93-40ad-975a-21365074e437']);
$project_node = reset($project_nodes);
if (!$project_node || $project_node->bundle() !== 'project') {
  throw new RuntimeException('Expected Presentation UX project not found.');
}
if ($project_node->hasTranslation('ru')) {
  echo "Russian Presentation UX already exists; CMS edits preserved.\n";
  return;
}
$russian_copy = json_decode(file_get_contents(__DIR__ . '/content/presentation-ux.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$story_sections = $project_node->field_content_sections->referencedEntities();
if (count($story_sections) !== count($russian_copy['story_sections'])) {
  throw new RuntimeException('Story structure changed; review translation mapping.');
}
$english_content = [$project_node->getTitle(), $project_node->body->getValue(), $project_node->field_dynamic_thumbnail->getValue()];
foreach ($story_sections as $section_index => $story_section) {
  if ($story_section->uuid() !== $russian_copy['story_sections'][$section_index]['section_uuid'] || $story_section->hasTranslation('ru')) {
    throw new RuntimeException('Unexpected section identity or existing Russian section; review before translating.');
  }
  $english_content[] = $story_section->field_project_story_body->getValue();
}
$database_transaction = \Drupal::database()->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo($project_node->getOwner());
try {
  foreach ($story_sections as $section_index => $story_section) {
    $russian_section = $story_section->addTranslation('ru', $story_section->toArray());
    $russian_section->field_project_story_body->value = $russian_copy['story_sections'][$section_index]['story_html'];
    $russian_section->content_translation_source = 'en';
    $russian_section->setNewRevision(TRUE);
    $russian_section->save();
    $project_node->field_content_sections[$section_index]->target_revision_id = $russian_section->getRevisionId();
  }
  $russian_project = $project_node->addTranslation('ru', $project_node->toArray());
  $russian_project->setTitle($russian_copy['project_title']);
  $russian_project->set('body', [
    'value' => $russian_copy['project_intro'],
    'summary' => $russian_copy['project_summary'],
    'format' => $project_node->body->format,
  ]);
  $russian_project->set('path', ['alias' => '/portfolio/presentation-ux', 'pathauto' => FALSE]);
  $russian_project->content_translation_source = 'en';
  $validation_errors = $russian_project->validate();
  if ($validation_errors->count()) {
    throw new RuntimeException((string) $validation_errors);
  }
  $russian_project->setNewRevision(TRUE);
  $russian_project->setRevisionLogMessage('Add Russian Presentation UX copy locally, sharing the original three-layer SVG.');
  $russian_project->save();
  $node_storage->resetCache([$project_node->id()]);
  $saved_project = $node_storage->load($project_node->id());
  $saved_english = [$saved_project->getTitle(), $saved_project->body->getValue(), $saved_project->field_dynamic_thumbnail->getValue()];
  foreach ($saved_project->field_content_sections->referencedEntities() as $story_section) {
    $saved_english[] = $story_section->getUntranslated()->field_project_story_body->getValue();
    if (!$story_section->hasTranslation('ru')) {
      throw new RuntimeException('A translated section was not saved.');
    }
  }
  if ($saved_english !== $english_content) {
    throw new RuntimeException('English content changed unexpectedly.');
  }
  echo "Created /ru/portfolio/presentation-ux with five Russian sections; English content and artwork unchanged.\n";
}
catch (Throwable $translation_error) {
  $database_transaction->rollBack();
  throw $translation_error;
}
finally {
  $account_switcher->switchBack();
}
