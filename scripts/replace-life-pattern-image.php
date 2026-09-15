<?php

/**
 * @file
 * Preview: drush php:script scripts/replace-life-pattern-image.php
 * Apply with LIFE_APPLY=1. Saves a new revision and preserves other body text.
 */

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$article_nodes = $node_storage->loadByProperties(['uuid' => JURENITES_LIFE_ARTICLE_UUID]);
if (count($article_nodes) !== 1) throw new RuntimeException('Expected exactly one Game of Life Article.');
$article_node = reset($article_nodes);
$original_body = $article_node->body->value;
$example_markup = file_get_contents(__DIR__ . '/content/conway-game-of-life-examples.html');
$image_path = '/themes/custom/jurenites_theme/assets/images/game-of-life/patterns.png';
if (!str_contains($original_body, $image_path)) {
  if (str_contains($original_body, '<table class="game-of-life-examples">')) {
    echo 'Live example table already present; no revision created.' . PHP_EOL;
    return;
  }
  throw new RuntimeException('The requested pattern image was not found.');
}
if (str_contains($original_body, 'class="game-of-life-examples"')) throw new RuntimeException('Both table and image exist; review the current body.');
$updated_body = preg_replace(
  '~<p>(?:(?!</p>).)*<img\b[^>]*src="' . preg_quote($image_path, '~') . '"[^>]*>(?:(?!</p>).)*</p>~s',
  $example_markup,
  $original_body,
  -1,
  $image_replacements,
);
if ($image_replacements !== 1) throw new RuntimeException('Expected one paragraph containing the pattern image.');
$updated_body = preg_replace('~<p>Three small examples make the rules easier to see\.(?:(?!</p>).)*</p>~s', '', $updated_body, -1, $intro_replacements);
$updated_body = str_replace('<p>Original pattern diagrams for this article. The glider images show generations zero and four; the intermediate phases are omitted.</p>', '', $updated_body, $caption_replacements);
if ($intro_replacements !== 1 || $caption_replacements !== 1) throw new RuntimeException('The expected introduction or obsolete image caption has changed; review before replacing.');
$filtered_document = \Drupal\Component\Utility\Html::load((string) check_markup($example_markup, $article_node->body->format));
if ($filtered_document->getElementsByTagName('canvas')->length !== 6 || $filtered_document->getElementsByTagName('table')->length !== 1) {
  throw new RuntimeException('The current text format must preserve the table and all six canvases.');
}
echo 'Node ' . $article_node->id() . ', revision ' . $article_node->getRevisionId() . ': replace the image/old glider paragraph, introduction, and image caption with six 6x6 examples at 4x zoom.' . PHP_EOL;
if (getenv('LIFE_APPLY') !== '1') {
  echo 'Preview only; set LIFE_APPLY=1 to save a new revision.' . PHP_EOL;
  return;
}
$article_node->body->value = $updated_body;
$article_node->setNewRevision(TRUE);
$article_node->setRevisionCreationTime(\Drupal::time()->getRequestTime());
$article_node->setRevisionLogMessage('Replace static Life pattern image and preview glider with six titled interactive 6x6 examples at 4x zoom.');
$article_node->save();
echo 'Saved revision ' . $article_node->getRevisionId() . '. Other article fields and body text preserved.' . PHP_EOL;
