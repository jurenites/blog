<?php
/**
 * Local integration checks: drush php:script tests/role-slider.php.
 */
use Drupal\block\Entity\Block;
use Drupal\editor\Entity\Editor;
use Drupal\user\Entity\User;

function role_check(bool $check_result, string $check_message): void {
  if (!$check_result) throw new RuntimeException($check_message);
}
$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(User::load(1));
try {
  $block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
  $role_blocks = $block_storage->loadByProperties(['uuid' => '570fc0e9-29e0-4e73-b77b-c5f927c30f33']);
  $role_block = reset($role_blocks);
  $metric_blocks = $block_storage->loadByProperties(['uuid' => 'c003d482-a65b-40e4-a05a-b0b203add14e']);
  $metric_block = reset($metric_blocks);
  role_check((bool) $role_block && (bool) $metric_block, 'Both editable blocks exist.');
  foreach (['en', 'ru'] as $language_id) {
    role_check(count($metric_block->getTranslation($language_id)->get('field_numeric_items')) === 2, 'Two general metrics remain.');
    role_check(count($role_block->get('field_role_items')) === 3, 'Three role tiles remain.');
    role_check(count($role_block->getTranslation($language_id)->validate()) === 0, 'Translated block validates.');
    foreach ($role_block->get('field_role_items')->referencedEntities() as $role_tile) {
      $role_translation = $role_tile->getTranslation($language_id);
      role_check(count($role_translation->validate()) === 0, 'Translated role fields validate: ' . (string) $role_translation->get('field_role_heading')->value);
    }
  }
  $source_uuids = ['93ff7158-07e2-46a4-a736-9c655b42003a', 'e392af27-f97d-4c76-85a0-dbe013b3b9b2', '0b212368-c104-4708-bcbf-d509db82cd90'];
  $paragraph_storage = \Drupal::entityTypeManager()->getStorage('paragraph');
  foreach ($role_block->get('field_role_items')->referencedEntities() as $role_index => $role_tile) {
    $source_tiles = $paragraph_storage->loadByProperties(['uuid' => $source_uuids[$role_index]]);
    $source_tile = reset($source_tiles);
    role_check((bool) $source_tile, 'Original paragraph preserved for old revisions.');
    role_check($role_tile->getParentEntity()->id() === $role_block->id(), 'Duplicated paragraph belongs to the role block.');
    foreach (['en', 'ru'] as $language_id) {
      foreach (['field_numeric_number', 'field_numeric_description', 'field_numeric_icon_image', 'field_numeric_link', 'field_numeric_caption', 'field_numeric_caption_link'] as $field_name) {
        role_check($source_tile->getTranslation($language_id)->get($field_name)->getValue() === $role_tile->getTranslation($language_id)->get($field_name)->getValue(), 'Original numeric content preserved: ' . $field_name);
      }
    }
  }
  $old_revisions = $block_storage->getQuery()->allRevisions()->accessCheck(FALSE)->condition('id', $metric_block->id())->execute();
  $original_block_preserved = FALSE;
  foreach (array_keys($old_revisions) as $revision_id) {
    if (count($block_storage->loadRevision($revision_id)->get('field_numeric_items')) === 5) $original_block_preserved = TRUE;
  }
  role_check($original_block_preserved, 'The original five-tile block revision is retained.');
  $revision_before = $role_block->getRevisionId();
  \Drupal::moduleHandler()->loadInclude('jurenites_roles', 'install');
  jurenites_roles_install();
  $block_storage->resetCache();
  role_check($block_storage->load($role_block->id())->getRevisionId() === $revision_before, 'Setup does not reset content or revisions.');
  role_check(Block::load('jurenites_theme_professional_roles')->getWeight() > Block::load('jurenites_theme_numeric_values')->getWeight(), 'Roles follow general metrics.');
  foreach (['basic_html', 'full_html'] as $format_id) {
    $text_editor = Editor::load($format_id);
    role_check(in_array('expandableTerm', $text_editor->getSettings()['toolbar']['items'], TRUE), 'Authoring button enabled.');
    $config_object = \Drupal::service('config.typed')->createFromNameAndData('editor.editor.' . $format_id, $text_editor->toArray());
    $config_errors = $config_object->validate();
    foreach ($config_errors as $config_error) {
      // Existing Game of Life table class duplicates a Style capability.
      $known_table_warning = str_contains($config_error->getPropertyPath(), 'ckeditor5_sourceEditing.allowed_tags')
        && str_contains((string) $config_error->getMessage(), 'game-of-life-examples');
      if ($known_table_warning) print 'Existing editor configuration warning: ' . $config_error->getMessage() . PHP_EOL;
      role_check($known_table_warning, 'Unexpected editor configuration error: ' . $config_error->getMessage());
    }
  }
  $nested_markup = '<p>A <span class="expandable-term"><span class="expandable-term__label">term</span><span class="expandable-term__explanation">a <span class="expandable-term"><span class="expandable-term__label">nested word</span><span class="expandable-term__explanation">deeper explanation</span></span></span></span>.</p>';
  $filtered_markup = (string) check_markup($nested_markup, 'basic_html');
  role_check(substr_count($filtered_markup, 'class="expandable-term"') === 2, 'Nested expansions survive filtering.');
  $unsafe_markup = (string) check_markup('<span class="expandable-term unwanted" onclick="alert(1)">test</span><script>alert(1)</script>', 'basic_html');
  role_check(!str_contains($unsafe_markup, 'onclick') && !str_contains($unsafe_markup, '<script') && !str_contains($unsafe_markup, 'unwanted'), 'Filter restrictions remain narrow.');
  print 'Role slider, translations, preservation, editor config and filtering passed. Block ID: ' . $role_block->id() . PHP_EOL;
}
finally {
  $account_switcher->switchBack();
}
