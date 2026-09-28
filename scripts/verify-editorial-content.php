<?php

/**
 * @file
 * Local Drupal integration checks: drush php:script scripts/verify-editorial-content.php.
 * Temporary content is enclosed in a rolled-back database transaction.
 */

use Drupal\block_content\Entity\BlockContent;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\user\Entity\User;
use Drupal\views\Views;

function verify_editorial_condition(bool $check_result, string $check_label): void {
  if (!$check_result) {
    throw new RuntimeException($check_label);
  }
  echo "PASS: $check_label\n";
}

$database_transaction = \Drupal::database()->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(new AnonymousUserSession());
$block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
$test_block_id = NULL;
try {
  $template_cache = [];
  $template_copy_records = require DRUPAL_ROOT . '/modules/custom/jurenites_editorial/data/template-copy.php';
  $header_block = \Drupal::service('entity.repository')->loadEntityByUuid('block_content', $template_copy_records['header_name']['uuid']);
  verify_editorial_condition($header_block !== NULL, 'Header has an editable Page copy block');
  $header_block->set('body', ['value' => '<p>Editable Header Probe</p>', 'format' => 'full_html'])->save();
  verify_editorial_condition(jurenites_editorial_template_copy('header_name', $template_cache, TRUE) === 'Editable Header Probe', 'Template copy reflects CMS edits without a build');
  verify_editorial_condition(in_array('block_content:' . $header_block->id(), $template_cache['#cache']['tags'], TRUE), 'Standalone template copy carries entity cache tags');
  $header_variables = ['base_plugin_id' => 'system_branding_block'];
  jurenites_editorial_preprocess_block($header_variables);
  verify_editorial_condition(count($header_variables['brand_name_words']) === 3, 'Header animation follows the authored words');
  \Drupal::moduleHandler()->loadInclude('jurenites_editorial', 'install');
  jurenites_editorial_migrate_template_copy();
  verify_editorial_condition(jurenites_editorial_template_copy('header_name', $template_cache, TRUE) === 'Editable Header Probe', 'Template migration preserves later CMS edits');
  $header_block->set('body', [])->save();
  verify_editorial_condition(jurenites_editorial_template_copy('header_name', $template_cache, TRUE) === '', 'Cleared template copy has no hardcoded fallback');
  $header_block->set('body', ['value' => '<p>Hidden Header Probe</p>', 'format' => 'full_html']);
  $header_block->setUnpublished()->save();
  \Drupal::entityTypeManager()->getAccessControlHandler('block_content')->resetCache();
  verify_editorial_condition(jurenites_editorial_template_copy('header_name', $template_cache, TRUE) === '', 'Unpublished template copy is hidden from visitors');
  foreach ([['node', 'timeline', 'field_timeline_count_label'], ['node', 'timeline', 'field_timeline_eyebrow'], ['node', 'project', 'field_comparison_heading'], ['node', 'guideline', 'field_specimen_heading'], ['node', 'guideline', 'field_specimen_description'], ['paragraph', 'pixel_glyph_editor', 'field_editor_heading']] as [$entity_type, $bundle_name, $field_name]) {
    $field_config = \Drupal\field\Entity\FieldConfig::loadByName($entity_type, $bundle_name, $field_name);
    $form_display = \Drupal::entityTypeManager()->getStorage('entity_form_display')->load("$entity_type.$bundle_name.default");
    verify_editorial_condition($field_config?->isTranslatable() && (bool) $form_display?->getComponent($field_name), "$field_name is translatable and exposed in its edit form");
  }

  $copy_block = BlockContent::create([
    'type' => 'editorial_copy', 'info' => 'Editorial integration probe',
    'langcode' => 'en', 'status' => TRUE, 'reusable' => TRUE,
    'body' => ['value' => '<p>Original editorial probe</p>', 'format' => 'full_html'],
  ]);
  $copy_block->addTranslation('ru', ['info' => 'Editorial integration probe', 'body' => ['value' => '<p>Перевод проверки</p>', 'format' => 'full_html']]);
  $copy_block->save();
  $test_block_id = $copy_block->id();
  \Drupal::moduleHandler()->loadInclude('jurenites_editorial', 'install');
  $test_view = Views::getView('guidelines');
  $test_view->setDisplay('default');
  $test_view->setHandler('default', 'header', 'editorial_probe', jurenites_editorial_area_options('editorial_probe', $copy_block));
  $test_view->initHandlers();
  $area_plugin = $test_view->header['editorial_probe'];
  $renderer_service = \Drupal::service('renderer');
  $initial_build = $area_plugin->render();
  $initial_markup = (string) $renderer_service->renderInIsolation($initial_build);
  verify_editorial_condition(str_contains($initial_markup, 'Original editorial probe'), 'Published copy is visible anonymously');
  verify_editorial_condition(!str_contains($initial_markup, 'data-contextual-id'), 'Anonymous output has no edit controls');
  verify_editorial_condition(in_array('block_content:' . $test_block_id, $initial_build['#cache']['tags'], TRUE), 'Copy carries its entity cache tag');
  verify_editorial_condition(in_array('languages:language_content', $initial_build['#cache']['contexts'], TRUE), 'Copy varies by content language');

  $copy_block->setNewRevision(TRUE);
  $copy_block->set('body', ['value' => '<p>Changed editorial probe</p>', 'format' => 'full_html'])->save();
  $changed_build = $area_plugin->render();
  $changed_markup = (string) $renderer_service->renderInIsolation($changed_build);
  verify_editorial_condition(str_contains($changed_markup, 'Changed editorial probe') && !str_contains($changed_markup, 'Original editorial probe'), 'Saving a revision replaces previously cached copy');

  $translated_build = $block_storage->load($test_block_id)->getTranslation('ru')->get('body')->view(['label' => 'hidden']);
  verify_editorial_condition(str_contains((string) $renderer_service->renderInIsolation($translated_build), 'Перевод проверки'), 'The translated body remains independent');
  $copy_block->setUnpublished()->save();
  // A real form submission redirects to a new request with fresh access results.
  \Drupal::entityTypeManager()->getAccessControlHandler('block_content')->resetCache();
  $hidden_build = $area_plugin->render();
  verify_editorial_condition(!str_contains((string) $renderer_service->renderInIsolation($hidden_build), 'Changed editorial probe'), 'Unpublished copy is hidden from anonymous visitors');
  verify_editorial_condition(in_array('user.permissions', $hidden_build['#cache']['contexts'], TRUE), 'Denied output retains permission cache metadata');

  $account_switcher->switchBack();
  $account_switcher->switchTo(User::load(1));
  $admin_build = $area_plugin->render();
  $admin_markup = (string) $renderer_service->renderInIsolation($admin_build);
  verify_editorial_condition(str_contains($admin_markup, 'data-contextual-id') && str_contains($admin_markup, 'Changed editorial probe'), 'Administrator can preview and edit unpublished copy');
  $copy_block->delete();
  $missing_build = $area_plugin->render();
  verify_editorial_condition((string) $renderer_service->renderInIsolation($missing_build) === '', 'Deleting a referenced block leaves no broken public markup');
  verify_editorial_condition(in_array('block_content_list', $missing_build['#cache']['tags'], TRUE), 'Missing references carry a list cache tag');

  $existing_ids = $block_storage->getQuery()->accessCheck(FALSE)->condition('type', 'editorial_copy')->execute();
  jurenites_editorial_migrate_content();
  $repeated_ids = $block_storage->getQuery()->accessCheck(FALSE)->condition('type', 'editorial_copy')->execute();
  verify_editorial_condition($existing_ids === $repeated_ids, 'Repeating migration preserves content and does not recreate deleted blocks');
}
finally {
  $account_switcher->switchBack();
  $database_transaction->rollBack();
  $block_storage->resetCache();
  Cache::invalidateTags(['block_content_list', 'block_content:' . $test_block_id]);
}
