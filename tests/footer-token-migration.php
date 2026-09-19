<?php

/**
 * @file
 * Verifies migration across historical, current, and pending menu revisions.
 * Run with Drush after updatedb; all fixtures are removed in finally.
 */

use Drupal\menu_link_content\Entity\MenuLinkContent;

require_once __DIR__ . '/../web/modules/custom/jurenites_footer/jurenites_footer.post_update.php';

function migration_assert_check(bool $test_condition, string $test_message): void {
  if (!$test_condition) {
    throw new RuntimeException($test_message);
  }
}

$menu_storage = \Drupal::entityTypeManager()->getStorage('menu_link_content');
$fixture_entities = [];
try {
  foreach (['footer', 'footer-legal'] as $menu_name) {
    $menu_entity = MenuLinkContent::create([
      'title' => 'Footer migration fixture',
      'langcode' => 'en',
      'menu_name' => $menu_name,
      'link' => ['uri' => 'https://example.com/footer-migration'],
      'enabled' => FALSE,
      'field_footer_hover_paint' => 'var(--component-footer-navigation-github-color-hover)',
    ]);
    $menu_entity->addTranslation('ru', ['title' => 'Проверка миграции']);
    $menu_entity->save();
    $fixture_entities[] = $menu_entity;
    $historic_revision = $menu_entity->getRevisionId();

    $custom_paint = 'linear-gradient(90deg, #aBcDeF 0%, var(--color-palette-brand-tertiary) 100%)';
    $menu_entity->setNewRevision(TRUE);
    $menu_entity->set('field_footer_hover_paint', $custom_paint)->save();
    $current_revision = $menu_entity->getRevisionId();

    $menu_entity->setNewRevision(TRUE);
    $menu_entity->isDefaultRevision(FALSE);
    $menu_entity->set('field_footer_hover_paint', 'linear-gradient(315deg, var(--component-footer-navigation-gmail-color-hover) 0%, #aBcDeF 100%)')->save();
    $pending_revision = $menu_entity->getRevisionId();
    $before_revisions = [];
    foreach ([$historic_revision, $current_revision, $pending_revision] as $revision_id) {
      $before_revisions[$revision_id] = $menu_storage->loadRevision($revision_id)->toArray();
    }

    $update_sandbox = [];
    jurenites_footer_post_update_literal_hover_paint($update_sandbox);
    $menu_storage->resetCache();
    $current_entity = $menu_storage->load($menu_entity->id());
    migration_assert_check($current_entity->getRevisionId() == $current_revision, 'Pending revision must remain unpublished.');
    migration_assert_check($current_entity->get('field_footer_hover_paint')->value === $custom_paint, 'Custom paint must be preserved exactly.');
    migration_assert_check($current_entity->getTranslation('ru')->label() === 'Проверка миграции', 'Translated titles must be preserved.');
    foreach ($before_revisions as $revision_id => $original_values) {
      $expected_values = $original_values;
      $expected_values['field_footer_hover_paint'][0]['value'] = \Drupal\jurenites_footer\LegacyHoverPaint::resolveReferences($original_values['field_footer_hover_paint'][0]['value']);
      migration_assert_check($menu_storage->loadRevision($revision_id)->toArray() === $expected_values, 'Only paint may change in revision ' . $revision_id);
    }
    migration_assert_check(str_contains(jurenites_footer_post_update_literal_hover_paint($update_sandbox), 'in 0 menu revisions'), 'A second migration must be a no-op.');
  }
  echo "PASS: both menus, historical/current/pending revisions, translation preservation, exact custom paint, unchanged metadata, idempotence.\n";
}
finally {
  foreach ($fixture_entities as $menu_entity) {
    $menu_storage->resetCache([$menu_entity->id()]);
    $menu_storage->load($menu_entity->id())?->delete();
  }
}
