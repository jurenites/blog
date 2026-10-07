<?php

/** Make the Home SMEP phone crossfade its screens without swipe motion. */
$preview_block = \Drupal\block_content\Entity\BlockContent::load(34);
if (!$preview_block || $preview_block->uuid() !== 'd70557b9-7e26-436a-9201-459375bd81f2') {
  throw new RuntimeException('Expected Home project preview block not found.');
}

$translation_updates = [];
foreach ($preview_block->getTranslationLanguages() as $language_code => $language_object) {
  $block_translation = $preview_block->getTranslation($language_code);
  $html_document = \Drupal\Component\Utility\Html::load($block_translation->body->value ?? '');
  $xpath_query = new DOMXPath($html_document);
  $smep_slides = $xpath_query->query('//*[@data-project-slide][.//h2[normalize-space(.)="SMEP"]]');
  if ($smep_slides->length !== 1) {
    throw new RuntimeException("Expected one SMEP Home slide in $language_code.");
  }
  $screen_frames = $xpath_query->query('.//*[@data-screen-frame]', $smep_slides->item(0));
  if ($screen_frames->length === 0) {
    throw new RuntimeException("No SMEP Home screens found in $language_code.");
  }
  $changed_frames = 0;
  foreach ($screen_frames as $frame_element) {
    $image_element = $xpath_query->query('.//img', $frame_element)->item(0);
    if (!$image_element || !str_starts_with($image_element->getAttribute('src'), '/themes/custom/jurenites_theme/assets/images/projects/smep/element-cards/')) {
      throw new RuntimeException("Unexpected SMEP Home screen in $language_code.");
    }
    $frame_mode = $frame_element->getAttribute('data-frame-mode');
    if ($frame_mode === 'still') {
      continue;
    }
    if ($frame_mode !== 'scroll') {
      throw new RuntimeException("Unexpected SMEP Home frame mode in $language_code: $frame_mode.");
    }
    $frame_element->setAttribute('data-frame-mode', 'still');
    $changed_frames++;
  }
  if ($changed_frames) {
    $translation_updates[$language_code] = [
      'translation' => $block_translation,
      'body' => \Drupal\Component\Utility\Html::serialize($html_document),
      'count' => $changed_frames,
    ];
  }
}

if (!$translation_updates) {
  echo "Home SMEP previews already use still frames.\n";
  return;
}
foreach ($translation_updates as $language_code => $translation_update) {
  $translation_update['translation']->body->value = $translation_update['body'];
  echo "Updated {$translation_update['count']} SMEP frames in $language_code.\n";
}
$preview_block->setNewRevision(TRUE);
$preview_block->setRevisionLogMessage('Show Home SMEP screens with fades only, without swipe movement.');
$preview_block->save();
echo 'Saved Home project preview block revision ' . $preview_block->getRevisionId() . PHP_EOL;
