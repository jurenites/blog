<?php
/** Seed Accountia previews once, preserving later editorial changes. */
$project_node = \Drupal\node\Entity\Node::load(105);
if (!$project_node || $project_node->uuid() !== '72e66614-211b-487e-b8ef-4cef5e5e7cf9') {
  throw new RuntimeException('Unexpected Accountia node.');
}
$body_value = $project_node->body->value;
if (str_contains($body_value, 'accountia-showcase')) {
  echo "Existing Accountia previews preserved.\n";
  return;
}
$section_values = json_decode(file_get_contents(__DIR__ . '/../generated/content/accountia/sections.json'), TRUE, 512, JSON_THROW_ON_ERROR);
$original_body = $body_value;
$body_value = str_replace('<h4>Evolving an existing visual direction</h4>', $section_values['video_markup'] . $section_values['phones_markup'] . '<h4>Evolving an existing visual direction</h4>', $body_value);
$body_value = str_replace('<h4>Building consistency beyond individual screens</h4>', $section_values['comparison_markup'] . '<h4>Building consistency beyond individual screens</h4>', $body_value);
$body_value = str_replace('<h4>The website and collaboration</h4>', $section_values['guideline_markup'] . '<h4>The website and collaboration</h4>', $body_value);
$body_value = preg_replace('~<drupal-media[^>]*data-entity-uuid="73aed357-853e-4425-bf40-412341215f9e"[^>]*>.*?</drupal-media>~s', '', $body_value, -1, $replacement_count);
if ($replacement_count !== 1 || substr_count($body_value, 'class="accountia-showcase"') !== 4) throw new RuntimeException('Unexpected source structure; nothing saved.');
file_put_contents(__DIR__ . '/../generated/content/accountia/body-before.html', $original_body);
$previous_revision = $project_node->getRevisionId();
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Add Accountia phone sequences, original style guide, guideline and desktop galleries, invoice comparison and browser-compatible landing recording.');
$project_node->body->value = $body_value;
$project_node->save();
echo 'Accountia revision ' . $previous_revision . ' -> ' . $project_node->getRevisionId() . PHP_EOL;
