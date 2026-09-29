<?php

/** Seed the four requested internal case-study links once, preserving later edits. */
$state_key = 'jurenites_timeline.project_details_links_v1';
if (\Drupal::state()->get($state_key)) {
  echo "Project detail links were already seeded; CMS edits are preserved.\n";
  return;
}
$project_paths = [
  'Oklahoma Senate' => '/portfolio/oksenate',
  'ScatchApp' => '/portfolio/scatchapp',
  'Accountia' => '/portfolio/accountia',
  'Dzing Finance App' => '/portfolio/dzing-finance',
];
$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$project_uris = [];
foreach ($project_paths as $project_name => $project_path) {
  $system_path = \Drupal::service('path_alias.manager')->getPathByAlias($project_path, 'en');
  if (!preg_match('@^/node/(\d+)$@', $system_path, $node_matches) || !$node_storage->load($node_matches[1])) {
    throw new RuntimeException('Missing project node: ' . $project_path);
  }
  $project_uris[$project_name] = 'entity:node/' . $node_matches[1];
}
$matched_names = [];
foreach ($node_storage->loadByProperties(['type' => 'timeline']) as $timeline_node) {
  $updated_items = [];
  $node_changed = FALSE;
  foreach ($timeline_node->getTranslationLanguages() as $language_id => $language_object) {
    $node_translation = $timeline_node->getTranslation($language_id);
    foreach ($node_translation->field_timeline_items->referencedEntities() as $item_delta => $project_item) {
      $project_name = $project_item->getUntranslated()->field_timeline_name->value;
      if (!isset($project_uris[$project_name])) {
        continue;
      }
      $matched_names[$project_name] = TRUE;
      $revision_key = $project_item->id() . ':' . $project_item->getRevisionId();
      if (!array_key_exists($revision_key, $updated_items)) {
        $item_changed = FALSE;
        foreach ($project_item->getTranslationLanguages() as $item_language => $item_language_object) {
          $item_translation = $project_item->getTranslation($item_language);
          $existing_uris = array_column($item_translation->field_timeline_proof_links->getValue(), 'uri');
          if (!in_array($project_uris[$project_name], $existing_uris, TRUE)) {
            $item_translation->field_timeline_proof_links->appendItem([
              'uri' => $project_uris[$project_name],
              'title' => $item_language === 'ru' ? 'Подробнее' : 'Read more',
            ]);
            $item_changed = TRUE;
          }
        }
        if ($item_changed) {
          $project_item->setNewRevision(TRUE);
          $project_item->save();
        }
        $updated_items[$revision_key] = $project_item;
      }
      $updated_item = $updated_items[$revision_key];
      if ($node_translation->field_timeline_items[$item_delta]->target_revision_id != $updated_item->getRevisionId()) {
        $node_translation->field_timeline_items[$item_delta]->target_revision_id = $updated_item->getRevisionId();
        $node_changed = TRUE;
      }
    }
  }
  if ($node_changed) {
    $timeline_node->setNewRevision(TRUE);
    $timeline_node->setRevisionLogMessage('Link four Timeline projects to their internal case studies.');
    $timeline_node->save();
  }
}
if (count($matched_names) !== count($project_paths)) {
  throw new RuntimeException('Not all four Timeline projects were found.');
}
\Drupal::state()->set($state_key, TRUE);
echo "Seeded internal case-study links for four Timeline projects.\n";
