<?php

/**
 * @file
 * Verify rich-text configuration and rendered forms with drush php:script.
 */

function full_html_check(bool $passed_check, string $failure_message): void {
  if (!$passed_check) {
    throw new \RuntimeException($failure_message);
  }
}

foreach (['basic_html', 'restricted_html'] as $format_name) {
  full_html_check(\Drupal\filter\Entity\FilterFormat::load($format_name) === NULL, 'Obsolete format still exists.');
  full_html_check(\Drupal\editor\Entity\Editor::load($format_name) === NULL, 'Obsolete editor still exists.');
}
foreach (\Drupal\field\Entity\FieldConfig::loadMultiple() as $field_config) {
  if (in_array($field_config->getType(), ['text', 'text_long', 'text_with_summary'], TRUE)) {
    full_html_check($field_config->getSetting('allowed_formats') === ['full_html'], $field_config->id() . ' allows another format.');
  }
}
full_html_check(\Drupal\user\Entity\Role::load('content_editor')->hasPermission('use text format full_html'), 'Content editor cannot use Full HTML.');
foreach (['anonymous', 'authenticated'] as $role_name) {
  full_html_check(!\Drupal\user\Entity\Role::load($role_name)->hasPermission('use text format full_html'), 'Public role received Full HTML.');
}

$account_switcher = \Drupal::service('account_switcher');
$editor_account = \Drupal\user\Entity\User::create(['name' => 'Full HTML verification', 'roles' => ['content_editor']]);
$editor_account->set('uid', 999999);
$account_switcher->switchTo($editor_account);
try {
  foreach ([
    \Drupal\node\Entity\Node::create(['type' => 'article']),
    \Drupal\block_content\Entity\BlockContent::create(['type' => 'editorial_copy']),
  ] as $content_entity) {
    $entity_form = \Drupal::service('entity.form_builder')->getForm($content_entity);
    $form_markup = (string) \Drupal::service('renderer')->renderRoot($entity_form);
    $parsed_document = \Drupal\Component\Utility\Html::load($form_markup);
    $document_xpath = new \DOMXPath($parsed_document);
    full_html_check($document_xpath->query('//select[contains(@name, "[format]")]')->length === 0, 'Format chooser is visible.');
    full_html_check($document_xpath->query('//input[@type="hidden" and @value="full_html" and @data-editor-for]')->length > 0, 'CKEditor hidden format input is missing.');
    full_html_check(!str_contains($form_markup, 'This field has been disabled'), 'Rich text is inaccessible.');
    full_html_check(isset($entity_form['#attached']['drupalSettings']['editor']['formats']['full_html']), 'Full HTML editor settings are missing.');
  }
}
finally {
  $account_switcher->switchBack();
}

\Drupal::moduleHandler()->loadInclude('jurenites_admin', 'inc', 'jurenites_admin.formats');
full_html_check(jurenites_admin_configure_full_html() === 0, 'Migration left obsolete content references or is not idempotent.');
print "Full HTML configuration, editorial access, rendered forms, and migration idempotency passed.\n";
