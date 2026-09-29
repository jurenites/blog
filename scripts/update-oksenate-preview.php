<?php

/** Add the supplied desktop capture once, preserving subsequent CMS edits. */
$project_nodes = \Drupal::entityTypeManager()->getStorage('node')->loadByProperties([
  'uuid' => '26681fb7-751e-40b6-a3d1-f9c33fe56ab3',
]);
$project_node = reset($project_nodes);
if (!$project_node) {
  throw new RuntimeException('Oksenate project not found.');
}
$story_sections = $project_node->field_content_sections->referencedEntities();
foreach ($story_sections as $story_section) {
  if ($story_section->hasField('field_project_story_body') && str_contains($story_section->field_project_story_body->value ?? '', 'desktop-preview')) {
    echo "Existing desktop preview preserved.\n";
    return;
  }
}
foreach ($story_sections as $section_index => $story_section) {
  if ($story_section->uuid() !== '477402c7-41b3-47d1-9342-716f486d3fd5') {
    continue;
  }
  $story_section->setNewRevision(TRUE);
  $story_section->field_project_story_body->value .= '<figure class="desktop-preview"><div class="desktop-preview__stage" tabindex="0" role="region" aria-label="Oklahoma Senate desktop homepage preview, scroll to explore"><img class="desktop-preview__image" src="/themes/custom/jurenites_theme/assets/images/projects/oksenate/anonymous-home-stage.png" alt="Oklahoma Senate homepage, including senator and legislation search, public resources, events and leadership." loading="lazy"></div></figure>';
  $story_section->save();
  $project_node->setNewRevision(TRUE);
  $project_node->field_content_sections[$section_index]->target_revision_id = $story_section->getRevisionId();
  $project_node->setRevisionLogMessage('Add a scrollable desktop homepage preview after the accessibility section.');
  $project_node->save();
  echo 'Updated Oksenate node ' . $project_node->id() . ', revision ' . $project_node->getRevisionId() . PHP_EOL;
  return;
}
throw new RuntimeException('Expected accessibility section not found; nothing changed.');
