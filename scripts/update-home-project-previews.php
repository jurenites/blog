<?php

/** Expand the existing Home preview once, preserving its previous revision. */
$preview_block = \Drupal\block_content\Entity\BlockContent::load(34);
if (!$preview_block || $preview_block->uuid() !== 'd70557b9-7e26-436a-9201-459375bd81f2') {
  throw new RuntimeException('Expected Home preview block not found.');
}
if (str_contains($preview_block->body->value, 'data-project-slider')) {
  echo "Existing project slider preserved.\n";
  return;
}
$project_records = [105 => 'Accountia', 106 => 'ScatchApp', 111 => 'Dzing', 28 => 'SMEP'];
$slide_markup = [];
foreach ($project_records as $project_id => $project_heading) {
  $project_node = \Drupal\node\Entity\Node::load($project_id);
  $source_markup = $project_id === 106 ? $preview_block->body->value : $project_node->body->value;
  foreach ($project_node->field_content_sections->referencedEntities() as $story_section) {
    if ($story_section->hasField('field_project_story_body')) {
      $source_markup .= $story_section->field_project_story_body->value;
    }
  }
  $html_document = \Drupal\Component\Utility\Html::load($source_markup);
  $xpath_query = new DOMXPath($html_document);
  $phone_cards = $xpath_query->query('//*[contains(concat(" ", normalize-space(@class), " "), " card ")]');
  // Accountia's second phone shows the application; the first shows its website.
  $phone_card = $phone_cards->item($project_id === 105 ? 1 : 0);
  if (!$phone_card) {
    throw new RuntimeException('Missing phone preview for ' . $project_heading);
  }
  $card_markup = $html_document->saveHTML($phone_card);
  $card_markup = preg_replace('/<svg class="card__background".*?<\/svg>/s', '', $card_markup);
  $card_markup = str_replace(['card--gradient', 'card--native-screen'], ['card--transparent', 'card--thumbnail'], $card_markup);
  $card_markup = preg_replace('/card-background-(\d+)/', 'home-project-' . $project_id . '-$1', $card_markup);
  $project_url = $project_node->toUrl()->toString();
  $escape_text = static fn(string $source_text): string => \Drupal\Component\Utility\Html::escape($source_text);
  $card_markup = preg_replace('/^<(?:a|div)\b[^>]*>/', '<a class="card card--thumbnail card--transparent card--compact-screen card--' . ($project_id === 28 ? 'classic' : 'modern') . '" href="' . $escape_text($project_url) . '" aria-label="' . $escape_text((string) t('Read @project', ['@project' => $project_heading])) . '" data-cursor-card data-follow-cursor="true">', $card_markup);
  $card_markup = preg_replace('/<\/(?:a|div)>$/', '</a>', $card_markup);
  $summary_text = $project_node->body->summary ?? '';
  if ($project_id === 105 && str_contains($summary_text, 'Transcription by CastingWords')) {
    $summary_text = 'An accounting system for Arabic-speaking businesses, covering products, warehouses, and sales and purchase agreements.';
    $project_node->setNewRevision(TRUE);
    $project_node->body->summary = $summary_text;
    $project_node->setRevisionLogMessage('Correct transcription text in the project summary used by the Home preview.');
    $project_node->save();
  }
  $slide_markup[] = '<section class="project-case-preview" data-project-slide>' . $card_markup . '<div class="project-case-preview__copy"><h2>' . $escape_text($project_heading) . '</h2><p>' . $escape_text(strip_tags($summary_text)) . '</p><p><a href="' . $escape_text($project_url) . '">' . t('Read the project note') . '</a></p></div></section>';
}
$preview_block->setNewRevision(TRUE);
$preview_block->setInfo('Home project previews');
$preview_block->body->value = '<div class="project-case-slider" data-project-slider><div class="project-case-slider__track" data-project-track tabindex="0" role="region" aria-label="' . t('Project previews') . '">' . implode('', $slide_markup) . '</div><div class="square-pagination" data-project-controls hidden></div></div>';
$preview_block->setRevisionLogMessage('Add transparent phone previews for ScatchApp, Dzing, Accountia and SMEP with project summaries.');
$preview_block->save();
echo 'Saved Home project slider, revision ' . $preview_block->getRevisionId() . PHP_EOL;
