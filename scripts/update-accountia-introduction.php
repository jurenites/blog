<?php

/**
 * Apply the reviewed Accountia introduction to both editable Body translations.
 * Run with drush php:script scripts/update-accountia-introduction.php.
 */
$project_uuid = '72e66614-211b-487e-b8ef-4cef5e5e7cf9';
$project_node = \Drupal::service('entity.repository')->loadEntityByUuid('node', $project_uuid);
if (!$project_node || $project_node->bundle() !== 'project') {
  throw new RuntimeException('Accountia project is missing.');
}

$source_hashes = [
  'en' => [
    'value' => '4a240b9c82f3be86eda5a1a6fb441f7cc2cdf631f860cedf4fb04548e67a69c9',
    'summary' => 'b440e001d2084cac6fc5f554050f1f1e1ede65a4cc9eb7e64b01fd1962ca6c7f',
  ],
  'ru' => [
    'value' => '07b6871b07dd27bc493722a9d8023284349139546edb9fd68dacd8155cf0ed85',
    'summary' => '7e99d69ecefe7d25077c1c88e13645b8b1285f6e94f6136eb0d13066fc2f348d',
  ],
];
$catalogue_rows = json_decode(file_get_contents(__DIR__ . '/../translations/content.ru.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$updated_values = [];
foreach ($catalogue_rows as $catalogue_row) {
  if ($catalogue_row['entity_type'] === 'node' && $catalogue_row['uuid'] === $project_uuid
    && $catalogue_row['field'] === 'body' && $catalogue_row['delta'] === 0
    && in_array($catalogue_row['property'], ['value', 'summary'], TRUE)) {
    foreach (array_keys($source_hashes) as $language_code) {
      $updated_values[$language_code][$catalogue_row['property']] = $catalogue_row[$language_code];
    }
  }
}

// Validate every field before changing either translation; preserve later edits.
$has_changes = FALSE;
foreach ($source_hashes as $language_code => $property_hashes) {
  if (!$project_node->hasTranslation($language_code)) {
    throw new RuntimeException("Missing Accountia translation: $language_code");
  }
  $body_item = $project_node->getTranslation($language_code)->body->first();
  foreach ($property_hashes as $property_name => $source_hash) {
    $updated_value = $updated_values[$language_code][$property_name] ?? NULL;
    if (!is_string($updated_value) || $updated_value === '') {
      throw new RuntimeException("Missing reviewed Accountia $language_code $property_name.");
    }
    if ($body_item->$property_name === $updated_value) {
      continue;
    }
    if (hash('sha256', $body_item->$property_name ?? '') !== $source_hash) {
      throw new RuntimeException("Accountia $language_code $property_name changed since review; nothing saved.");
    }
    $has_changes = TRUE;
  }
}
if (!$has_changes) {
  echo "Accountia introduction already updated; no revision created.\n";
  return;
}

$previous_revision = $project_node->getRevisionId();
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Lead Accountia with the business problem, UX and backlog responsibility, three design decisions and their impact; preserve media and team credits in English and Russian.');
foreach ($updated_values as $language_code => $property_values) {
  $translated_node = $project_node->getTranslation($language_code);
  foreach ($property_values as $property_name => $updated_value) {
    $translated_node->body->first()->$property_name = $updated_value;
  }
  $translated_node->setRevisionTranslationAffected(TRUE);
}
$project_node->save();
echo "Accountia revision $previous_revision -> {$project_node->getRevisionId()}\n";
