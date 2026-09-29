<?php

/** Recover the damaged phone grid without reverting editorial changes. */
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$project_node = $node_storage->load(105);
$working_node = $node_storage->loadRevision(624);
if (!$project_node || $project_node->uuid() !== '72e66614-211b-487e-b8ef-4cef5e5e7cf9'
  || !$working_node || (int) $project_node->getRevisionId() !== 625) {
  throw new RuntimeException('Accountia changed since inspection; review before recovery.');
}

function phone_grid_range(string $body_value): array {
  if (!preg_match('~<div\b[^>]*class="accountia-preview__phones"[^>]*>~', $body_value, $grid_match, PREG_OFFSET_CAPTURE)) {
    throw new RuntimeException('Phone grid missing.');
  }
  $start_offset = $grid_match[0][1];
  preg_match_all('~</?div\b[^>]*>~', $body_value, $div_matches, PREG_OFFSET_CAPTURE, $start_offset);
  $nesting_depth = 0;
  foreach ($div_matches[0] as [$tag_text, $tag_offset]) {
    $nesting_depth += str_starts_with($tag_text, '</') ? -1 : 1;
    if ($nesting_depth === 0) return [$start_offset, $tag_offset + strlen($tag_text) - $start_offset];
  }
  throw new RuntimeException('Unbalanced phone grid.');
}

$original_body = $project_node->body->value;
[$current_offset, $current_length] = phone_grid_range($original_body);
[$working_offset, $working_length] = phone_grid_range($working_node->body->value);
$working_grid = substr($working_node->body->value, $working_offset, $working_length);
if (substr_count($working_grid, 'data-card-phone') !== 3 || substr_count($working_grid, 'data-screen-frame') !== 30) {
  throw new RuntimeException('Unexpected recovery phone inventory.');
}
$repaired_body = substr_replace($original_body, $working_grid, $current_offset, $current_length);
file_put_contents(__DIR__ . '/../generated/content/accountia/body-before-preview-repair.html', $original_body);
$project_node->setNewRevision(TRUE);
$project_node->setRevisionLogMessage('Recover only the Accountia phone grid from revision 624; retain current authored content and removals.');
$project_node->body->value = $repaired_body;
$project_node->save();
echo 'Recovered phone previews in revision ' . $project_node->getRevisionId() . PHP_EOL;
