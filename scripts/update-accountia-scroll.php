<?php

/** Update preview motion settings without regenerating authored Body content. */
$project_node = \Drupal\node\Entity\Node::load(105);
if (!$project_node || $project_node->uuid() !== '72e66614-211b-487e-b8ef-4cef5e5e7cf9') {
  throw new RuntimeException('Unexpected Accountia node.');
}
$original_body = $project_node->body->value;
$phone_index = 0;
$body_value = preg_replace_callback('~<figure class="accountia-preview__phone">.*?</figure>~s', function ($phone_match) use (&$phone_index) {
  $hold_duration = [850, 1450, 2050][$phone_index] ?? 2050;
  $scroll_start = $phone_index === 1 ? 'bottom' : 'top';
  $phone_index++;
  return preg_replace_callback('~<span\b[^>]*\bdata-screen-frame\b[^>]*>~s', function ($frame_match) use ($hold_duration, $scroll_start) {
    $frame_markup = preg_replace('~\sdata-(?:scroll-behavior|scroll-start|hold-duration|bottom-duration)="[^"]*"~', '', $frame_match[0]);
    return substr($frame_markup, 0, -1) . ' data-scroll-behavior="swipe" data-scroll-start="' . $scroll_start . '" data-hold-duration="' . $hold_duration . '" data-bottom-duration="800">';
  }, $phone_match[0]);
}, $original_body);
if ($phone_index !== 3) throw new RuntimeException('Expected three phone previews; nothing saved.');
if ($body_value === $original_body) {
  echo "Accountia swipe settings already applied.\n";
  return;
}
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Use staggered swipe motion and a bottom-first middle preview for Accountia.');
$project_node->body->value = $body_value;
$project_node->save();
echo 'Saved Accountia swipe settings in revision ' . $project_node->getRevisionId() . PHP_EOL;
