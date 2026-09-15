<?php

/**
 * @file
 * Verify Basic HTML authoring: drush php:script tests/game-of-life-examples.php
 */

$example_markup = '<canvas class="game-of-life__canvas" data-user=\'{"width":5,"height":5,"size":2,"alive":["b3","c4","d2","d3","d4"]}\' role="img" aria-label="Interactive glider">Glider example.</canvas>';
$filtered_markup = (string) check_markup($example_markup, 'basic_html');
$parsed_document = \Drupal\Component\Utility\Html::load($filtered_markup);
$canvas_element = $parsed_document->getElementsByTagName('canvas')->item(0);
if (!$canvas_element || $canvas_element->getAttribute('class') !== 'game-of-life__canvas'
  || json_decode($canvas_element->getAttribute('data-user'), TRUE)['alive'] !== ['b3', 'c4', 'd2', 'd3', 'd4']
  || $canvas_element->getAttribute('aria-label') !== 'Interactive glider') {
  throw new RuntimeException('Basic HTML must preserve the canvas, JSON preset, and accessible label.');
}
$unsafe_markup = '<canvas class="unrelated-class" data-user="{}" onclick="alert(1)" style="position:fixed" width="900">Example</canvas>';
$safe_markup = (string) check_markup($unsafe_markup, 'basic_html');
foreach (['onclick', 'style=', 'width=', 'unrelated-class'] as $unsafe_attribute) {
  if (str_contains($safe_markup, $unsafe_attribute)) throw new RuntimeException('Unexpected allowed attribute: ' . $unsafe_attribute);
}
$editor_entity = \Drupal\editor\Entity\Editor::load('basic_html');
$editor_settings = $editor_entity->getSettings();
$allowed_tags = $editor_settings['plugins']['ckeditor5_sourceEditing']['allowed_tags'];
if (!in_array('<canvas class="game-of-life__canvas" data-user role="img" aria-label>', $allowed_tags, TRUE)) {
  throw new RuntimeException('CKEditor source editing must preserve the same canvas contract.');
}
$format_settings = \Drupal\filter\Entity\FilterFormat::load('basic_html')->toArray();
jurenites_life_configure_examples();
if ($editor_settings !== \Drupal\editor\Entity\Editor::load('basic_html')->getSettings()
  || $format_settings !== \Drupal\filter\Entity\FilterFormat::load('basic_html')->toArray()) {
  throw new RuntimeException('Example configuration must be idempotent.');
}
echo 'Life examples: filtered canvas, JSON preset, accessible label, restricted attributes, source editing, and idempotency passed.' . PHP_EOL;

$table_markup = file_get_contents(__DIR__ . '/../scripts/content/conway-game-of-life-examples.html');
foreach (['basic_html', 'full_html'] as $format_id) {
  $table_document = \Drupal\Component\Utility\Html::load((string) check_markup($table_markup, $format_id));
  if ($table_document->getElementsByTagName('table')->item(0)?->getAttribute('class') !== 'game-of-life-examples'
    || $table_document->getElementsByTagName('canvas')->length !== 6
    || $table_document->getElementsByTagName('h3')->length !== 6) {
    throw new RuntimeException($format_id . ' must preserve the table, pattern titles, and all six live examples.');
  }
  foreach ($table_document->getElementsByTagName('canvas') as $canvas_element) {
    $canvas_options = json_decode($canvas_element->getAttribute('data-user'), TRUE);
    if ($canvas_options['width'] !== 6 || $canvas_options['height'] !== 6 || $canvas_options['size'] !== 4) {
      throw new RuntimeException('Expected authored 6x6 examples at 4x zoom.');
    }
  }
}
echo 'Life example table: both text formats preserve six titled 6x6 canvases at 4x zoom.' . PHP_EOL;
