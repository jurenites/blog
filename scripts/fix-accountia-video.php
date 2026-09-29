<?php

/** Move the existing Accountia recording first without replacing editorial copy. */
$project_node = \Drupal\node\Entity\Node::load(105);
if (!$project_node || $project_node->uuid() !== '72e66614-211b-487e-b8ef-4cef5e5e7cf9') {
  throw new RuntimeException('Unexpected Accountia node.');
}
$body_value = $project_node->body->value;
$original_body = $body_value;
$video_pattern = '~<section class="accountia-showcase"><div class="accountia-preview__recording" data-accountia-video>.*?</section>~s';
if (preg_match_all($video_pattern, $body_value, $video_matches) !== 1) {
  throw new RuntimeException('Expected exactly one Accountia recording; nothing saved.');
}
$video_markup = preg_replace('~<button\b[^>]*\bdata-video-expand\b[^>]*>.*?</button>~s', '', $video_matches[0][0]);
$body_value = preg_replace($video_pattern, '', $body_value);
$first_preview = strpos($body_value, '<section class="accountia-showcase">');
if ($first_preview === FALSE) {
  throw new RuntimeException('Expected existing Accountia previews; nothing saved.');
}
$body_value = substr_replace($body_value, $video_markup, $first_preview, 0);
if ($body_value === $original_body) {
  echo "Accountia video is already first and has no expand button.\n";
  return;
}
$previous_revision = $project_node->getRevisionId();
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Move the Accountia video before the other previews and remove the expand button.');
$project_node->body->value = $body_value;
$project_node->save();
echo 'Accountia revision ' . $previous_revision . ' -> ' . $project_node->getRevisionId() . PHP_EOL;
