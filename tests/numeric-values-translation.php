<?php

/**
 * @file
 * Local check: drush php:script tests/numeric-values-translation.php.
 */

use Drupal\paragraphs\Entity\Paragraph;

// Reproduce a newly translated section containing an already bilingual tile.
// Keep fixtures unsaved so this check never changes editorial content.
$numeric_tile = Paragraph::create([
  'type' => 'numeric_value',
  'langcode' => 'en',
  'field_numeric_number' => '3',
  'field_numeric_description' => 'English tile',
]);
$numeric_tile->addTranslation('ru', [
  'field_numeric_number' => '3',
  'field_numeric_description' => 'Русская плитка',
]);
$numeric_section = Paragraph::create([
  'type' => 'numeric_values',
  'langcode' => 'en',
  'field_numeric_items' => [['entity' => $numeric_tile]],
]);
$numeric_section->addTranslation('ru', $numeric_section->toArray());

foreach (['en', 'ru'] as $language_id) {
  $section_translation = $numeric_section->getTranslation($language_id);
  $referenced_tile = $section_translation->get('field_numeric_items')->entity;
  if ($referenced_tile->uuid() !== $numeric_tile->uuid()) {
    throw new \RuntimeException('Translating a Numeric Values section duplicated its tile.');
  }
  $expected_description = $language_id === 'ru' ? 'Русская плитка' : 'English tile';
  if ($referenced_tile->getTranslation($language_id)->get('field_numeric_description')->value !== $expected_description) {
    throw new \RuntimeException('Translating a Numeric Values section changed the tile text.');
  }
}

print 'PASS: Numeric Values translations share tile identity and preserve bilingual text.' . PHP_EOL;
