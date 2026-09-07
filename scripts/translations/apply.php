<?php
/**
 * Apply the reviewed Russian catalogue with source and existing-translation guards.
 * Run with drush php:script scripts/translations/apply.php (dry run by default).
 * Set JURENITES_TRANSLATIONS_APPLY=1 to save. English is never overwritten.
 */
$catalogue_root = dirname(__DIR__, 2) . '/translations';
$content_rows = json_decode(file_get_contents($catalogue_root . '/content.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$interface_rows = json_decode(file_get_contents($catalogue_root . '/interface.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$apply_changes = getenv('JURENITES_TRANSLATIONS_APPLY') === '1';
$entity_groups = [];
foreach ($content_rows as $content_row) {
  $entity_key = $content_row['entity_type'] . ':' . $content_row['uuid'];
  $entity_groups[$entity_key][] = $content_row;
}
// Validate the whole catalogue before changing configuration or content.
$content_entities = [];
foreach ($entity_groups as $entity_key => $entity_rows) {
  $first_row = $entity_rows[0];
  $content_entity = \Drupal::service('entity.repository')->loadEntityByUuid($first_row['entity_type'], $first_row['uuid']);
  if (!$content_entity || $content_entity->getUntranslated()->language()->getId() !== 'en') {
    throw new \RuntimeException("Missing English source: $entity_key");
  }
  $content_entity = $content_entity->getUntranslated();
  foreach ($entity_rows as $content_row) {
    $source_value = $content_entity->get($content_row['field'])->getValue()[$content_row['delta']][$content_row['property']] ?? NULL;
    if ($source_value !== $content_row['en']) {
      throw new \RuntimeException("English changed: $entity_key / {$content_row['field']}");
    }
    if (!$content_entity->getFieldDefinition($content_row['field'])->isTranslatable()) {
      throw new \RuntimeException("Field is not translatable: $entity_key / {$content_row['field']}");
    }
    if ($content_entity->hasTranslation('ru')) {
      $existing_value = $content_entity->getTranslation('ru')->get($content_row['field'])->getValue()[$content_row['delta']][$content_row['property']] ?? NULL;
      if ($existing_value !== $content_row['en'] && $existing_value !== $content_row['ru']
        && $existing_value !== ($content_row['previous_ru'] ?? NULL)) {
        throw new \RuntimeException("Russian editorial conflict: $entity_key / {$content_row['field']}");
      }
    }
  }
  $content_entities[$entity_key] = $content_entity;
}
$locale_storage = \Drupal::service('locale.storage');
foreach ($interface_rows as $interface_row) {
  $existing_translation = $locale_storage->findTranslation([
    'source' => $interface_row['en'],
    'context' => $interface_row['context'],
    'language' => 'ru',
  ]);
  if ($existing_translation && $existing_translation->isTranslation()
    && $existing_translation->customized
    && $existing_translation->getString() !== $interface_row['en']
    && $existing_translation->getString() !== $interface_row['ru']
    && $existing_translation->getString() !== ($interface_row['previous_ru'] ?? NULL)) {
    throw new \RuntimeException('Russian interface conflict: ' . $interface_row['en']);
  }
}
if (!$apply_changes) {
  echo 'Validated ' . count($content_rows) . " content fields; dry run, nothing saved.\n";
  return;
}
// Enabling translation can install SQL columns; finish schema work before the content transaction.
foreach ($entity_groups as $entity_key => $entity_rows) {
  $first_row = $entity_rows[0];
  \Drupal::service('content_translation.manager')->setEnabled($first_row['entity_type'], $first_row['bundle'], TRUE);
}
// Paragraph structure is shared; translate fields inside paragraphs, as required by Paragraphs.
foreach ($content_entities as $content_entity) {
  foreach ($content_entity->getFieldDefinitions() as $field_definition) {
    if ($field_definition->getType() === 'entity_reference_revisions'
      && $field_definition instanceof \Drupal\field\Entity\FieldConfig
      && $field_definition->getSetting('target_type') === 'paragraph'
      && $field_definition->isTranslatable()) {
      $field_definition->setTranslatable(FALSE)->save();
    }
  }
}
\Drupal::service('entity_field.manager')->clearCachedFieldDefinitions();
foreach ($content_entities as $entity_key => $content_entity) {
  $entity_storage = \Drupal::entityTypeManager()->getStorage($content_entity->getEntityTypeId());
  $entity_storage->resetCache([$content_entity->id()]);
  $content_entities[$entity_key] = $entity_storage->load($content_entity->id());
}
$database_transaction = \Drupal::database()->startTransaction();
try {
  foreach ($content_entities as $entity_key => $content_entity) {
    $translated_entity = $content_entity->hasTranslation('ru') ? $content_entity->getTranslation('ru') : $content_entity->addTranslation('ru', $content_entity->toArray());
    $entity_changed = $translated_entity->isNewTranslation();
    foreach ($entity_groups[$entity_key] as $content_row) {
      $field_values = $translated_entity->get($content_row['field'])->getValue();
      if (($field_values[$content_row['delta']][$content_row['property']] ?? NULL) !== $content_row['ru']) {
        $field_values[$content_row['delta']][$content_row['property']] = $content_row['ru'];
        $translated_entity->set($content_row['field'], $field_values);
        $entity_changed = TRUE;
      }
    }
    if ($entity_changed) {
      // Paragraph references retain their existing revision IDs.
      if ($content_entity->getEntityTypeId() === 'node') {
        $translated_entity->setNewRevision(TRUE);
        $translated_entity->setRevisionLogMessage('Add reviewed Russian translation from the Git catalogue.');
      }
      $translated_entity->save();
    }
  }
  $locale_storage = \Drupal::service('locale.storage');
  foreach ($interface_rows as $interface_row) {
    $source_string = $locale_storage->findString(['source' => $interface_row['en'], 'context' => $interface_row['context']]);
    if (!$source_string) {
      $source_string = $locale_storage->createString(['source' => $interface_row['en'], 'context' => $interface_row['context']]);
      $source_string->save();
    }
    $translated_string = $locale_storage->findTranslation(['lid' => $source_string->lid, 'language' => 'ru']);
    if (!$translated_string) {
      $translated_string = $locale_storage->createTranslation(['lid' => $source_string->lid, 'language' => 'ru']);
    }
    $translated_string->setString($interface_row['ru']);
    $translated_string->setValues(['lid' => $source_string->lid, 'language' => 'ru', 'customized' => 1]);
    $translated_string->save();
  }
  echo 'Saved ' . count($content_rows) . ' fields across ' . count($content_entities) . ' entities and ' . count($interface_rows) . " interface strings.\n";
}
catch (\Throwable $import_error) {
  $database_transaction->rollBack();
  throw $import_error;
}
