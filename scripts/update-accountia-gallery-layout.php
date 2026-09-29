<?php

/** Add gallery presentation metadata while retaining current CMS content. */
$project_node = \Drupal\node\Entity\Node::load(105);
if (!$project_node || $project_node->uuid() !== '72e66614-211b-487e-b8ef-4cef5e5e7cf9') {
  throw new RuntimeException('Unexpected Accountia node.');
}
$original_body = $project_node->body->value;
$gallery_count = 0;
$body_value = preg_replace_callback('~<div class="accountia-preview(?: accountia-preview--guidelines)?" data-accountia-gallery><div class="accountia-preview__stage"[^>]*>(.*?)</figure>~s', function ($gallery_match) use (&$gallery_count) {
  $gallery_count++;
  $is_guidelines = str_contains($gallery_match[1], '/accoutnia-guidelines-description.webp');
  $gallery_class = $is_guidelines ? ' accountia-preview--guidelines' : '';
  $region_attributes = $is_guidelines ? '' : ' tabindex="0" role="region" aria-label="Screen preview"';
  return '<div class="accountia-preview' . $gallery_class . '" data-accountia-gallery><div class="accountia-preview__stage"' . $region_attributes . '>' . $gallery_match[1] . '</figure>';
}, $original_body);
if ($gallery_count !== 4) throw new RuntimeException('Expected four galleries; nothing saved.');
if ($body_value === $original_body) {
  echo "Accountia gallery layout already updated.\n";
  return;
}
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Use full-width scrollable desktop previews and a fixed-ratio guidelines gallery.');
$project_node->body->value = $body_value;
$project_node->save();
echo 'Saved Accountia gallery layout in revision ' . $project_node->getRevisionId() . PHP_EOL;
