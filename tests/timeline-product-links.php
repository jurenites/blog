<?php

/**
 * Local integration check: drush php:script tests/timeline-product-links.php.
 * Applies only the Timeline post-update, verifies preservation and idempotency.
 */

function timeline_link_check(bool $check_result, string $check_message): void {
  if (!$check_result) {
    throw new RuntimeException($check_message);
  }
}

function timeline_link_snapshot(): array {
  $node_storage = \Drupal::entityTypeManager()->getStorage('node');
  $node_storage->resetCache();
  \Drupal::entityTypeManager()->getStorage('paragraph')->resetCache();
  $node_ids = $node_storage->getQuery()->accessCheck(FALSE)->condition('type', 'timeline')->execute();
  $timeline_snapshot = [];
  foreach ($node_storage->loadMultiple($node_ids) as $timeline_node) {
    foreach ($timeline_node->getTranslationLanguages() as $language_id => $language_object) {
      $node_translation = $timeline_node->getTranslation($language_id);
      $paragraph_rows = [];
      foreach ($node_translation->get('field_timeline_items')->referencedEntities() as $timeline_paragraph) {
        $paragraph_translation = $timeline_paragraph->hasTranslation($language_id) ? $timeline_paragraph->getTranslation($language_id) : $timeline_paragraph;
        $preserved_fields = [];
        foreach (['field_timeline_name', 'field_timeline_summary', 'field_timeline_periods', 'field_timeline_hours', 'field_timeline_organization', 'field_timeline_organization_url', 'field_timeline_emphasis'] as $field_name) {
          $preserved_fields[$field_name] = $paragraph_translation->get($field_name)->getValue();
        }
        $paragraph_rows[$timeline_paragraph->id()] = [
          'revision_id' => $timeline_paragraph->getRevisionId(),
          'preserved_fields' => $preserved_fields,
          'sources' => $paragraph_translation->get('field_timeline_proof_links')->getValue(),
          'websites' => $paragraph_translation->hasField('field_timeline_website_links') ? $paragraph_translation->get('field_timeline_website_links')->getValue() : [],
          'stores' => $paragraph_translation->hasField('field_timeline_store_links') ? $paragraph_translation->get('field_timeline_store_links')->getValue() : [],
        ];
      }
      $timeline_snapshot[$timeline_node->id() . ':' . $language_id] = ['revision_id' => $timeline_node->getRevisionId(), 'body' => $node_translation->get('body')->getValue(), 'items' => $paragraph_rows];
    }
  }
  return $timeline_snapshot;
}

$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(\Drupal\user\Entity\User::load(1));
try {
  $before_snapshot = timeline_link_snapshot();
  timeline_link_check($before_snapshot !== [], 'Timeline exists.');
  \Drupal::moduleHandler()->loadInclude('jurenites_timeline', 'post_update.php');
  print jurenites_timeline_post_update_separate_product_links() . PHP_EOL;
  $after_snapshot = timeline_link_snapshot();
  $paragraph_storage = \Drupal::entityTypeManager()->getStorage('paragraph');
  foreach ($before_snapshot as $node_key => $before_node) {
    $after_node = $after_snapshot[$node_key];
    timeline_link_check($before_node['body'] === $after_node['body'], 'Introduction preserved.');
    timeline_link_check(array_keys($before_node['items']) === array_keys($after_node['items']), 'Project order and identities preserved.');
    foreach ($before_node['items'] as $paragraph_id => $before_item) {
      $after_item = $after_node['items'][$paragraph_id];
      timeline_link_check($before_item['preserved_fields'] === $after_item['preserved_fields'], 'Editorial fields and translations preserved.');
      $all_uris = array_column(array_merge($after_item['sources'], $after_item['websites'], $after_item['stores']), 'uri');
      foreach ($before_item['sources'] as $source_link) {
        timeline_link_check(in_array($source_link['uri'], $all_uris, TRUE), 'Every original destination preserved.');
      }
      $old_paragraph = $paragraph_storage->loadRevision($before_item['revision_id']);
      $language_id = explode(':', $node_key)[1];
      if ($old_paragraph->hasTranslation($language_id)) $old_paragraph = $old_paragraph->getTranslation($language_id);
      timeline_link_check($old_paragraph->get('field_timeline_proof_links')->getValue() === $before_item['sources'], 'Old paragraph revision preserved.');
      $project_name = $after_item['preserved_fields']['field_timeline_name'][0]['value'];
      if ($project_name === 'ScatchApp') {
        timeline_link_check(count($after_item['stores']) === 2, 'Scatch has both stores.');
        timeline_link_check(count($after_item['sources']) === 2, 'Both Scatch sources preserved.');
        timeline_link_check($after_item['websites'] === [], 'Scatch source and store hosts are not product domains.');
      }
      if ($project_name === 'Accountia') {
        timeline_link_check(array_column($after_item['websites'], 'uri') === ['https://accountia.no/'], 'Accountia product domain separated.');
        timeline_link_check(count($after_item['sources']) === 1 && str_contains($after_item['sources'][0]['uri'], 'figma.com'), 'Accountia Figma remains a source.');
      }
      $current_paragraph = $paragraph_storage->loadRevision($after_item['revision_id']);
      timeline_link_check(count($current_paragraph->validate()) === 0, 'Migrated paragraph validates.');
    }
  }
  print jurenites_timeline_post_update_separate_product_links() . PHP_EOL;
  timeline_link_check($after_snapshot === timeline_link_snapshot(), 'Second run preserves values and revision IDs.');
  \Drupal::service('update.post_update_registry')->registerInvokedUpdates(['jurenites_timeline_post_update_separate_product_links']);
  print 'Timeline migration, translations, original revisions, source separation and idempotency passed.' . PHP_EOL;

}
finally {
  $account_switcher->switchBack();
}
