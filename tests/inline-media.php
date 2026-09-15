<?php

/**
 * @file
 * Local integration check: drush php:script tests/inline-media.php.
 */

use Drupal\Core\Session\AnonymousUserSession;
use Drupal\editor\Entity\Editor;
use Drupal\media\Entity\Media;
use Drupal\media\Entity\MediaType;
use Drupal\media_library\MediaLibraryState;
use Drupal\user\Entity\User;

function inline_media_assert(bool $test_result, string $failure_message): void {
  if (!$test_result) {
    throw new RuntimeException($failure_message);
  }
}

$typed_config_manager = \Drupal::service('config.typed');
foreach (['animated_gif', 'video'] as $bundle_name) {
  $config_name = "core.entity_view_display.media.$bundle_name.inline_media";
  $config_violations = $typed_config_manager->createFromNameAndData($config_name, \Drupal::config($config_name)->getRawData())->validate();
  inline_media_assert(count($config_violations) === 0, (string) $config_violations);
}
foreach (['basic_html', 'full_html'] as $format_name) {
  $text_editor = Editor::load($format_name);
  $config_violations = $typed_config_manager->createFromNameAndData($text_editor->getConfigDependencyName(), $text_editor->toArray())->validate();
  foreach ($config_violations as $config_violation) {
    // This existing Game of Life Source Editing warning is unrelated to media.
    if (str_starts_with($config_violation->getPropertyPath(), 'settings.plugins.ckeditor5_sourceEditing.allowed_tags.')
      && str_contains((string) $config_violation->getMessage(), 'game-of-life-examples')) {
      print "Existing editor validation warning: Game of Life table class belongs in the Styles dropdown.\n";
      continue;
    }
    inline_media_assert(FALSE, (string) $config_violation);
  }
  inline_media_assert($text_editor->getImageUploadSettings()['max_size'] === '5 MB', 'Direct image uploads must be capped at 5 MB.');
}

$editor_account = User::create(['name' => 'Inline media permission check', 'roles' => ['content_editor']]);
$anonymous_account = new AnonymousUserSession();
$media_access = \Drupal::entityTypeManager()->getAccessControlHandler('media');
foreach (['animated_gif', 'video'] as $bundle_name) {
  inline_media_assert($media_access->createAccess($bundle_name, $editor_account), "Editors cannot upload $bundle_name.");
  inline_media_assert(!$media_access->createAccess($bundle_name, $anonymous_account), "Anonymous users can upload $bundle_name.");
}
$library_state = MediaLibraryState::create('media_library.opener.editor', ['animated_gif', 'video'], 'animated_gif', 1, ['filter_format_id' => 'basic_html']);
$library_opener = \Drupal::service('media_library.opener.editor');
inline_media_assert($library_opener->checkAccess($library_state, $editor_account)->isAllowed(), 'Editors cannot open the inline media picker.');
inline_media_assert(!$library_opener->checkAccess($library_state, $anonymous_account)->isAllowed(), 'Anonymous users can open the inline media picker.');

$created_media = [];
$created_files = [];
try {
  foreach (['animated_gif' => ['gif', 5], 'video' => ['mp4', 20]] as $bundle_name => [$file_extension, $limit_megabytes]) {
    $media_type = MediaType::load($bundle_name);
    $field_name = $media_type->getSource()->getSourceFieldDefinition($media_type)->getName();
    $test_media = Media::create(['bundle' => $bundle_name, 'name' => 'Inline media integration fixture', 'status' => TRUE, 'uid' => 1]);
    $field_item = $test_media->get($field_name)->appendItem();
    $upload_validators = $field_item->getUploadValidators();
    // Use real GIF bytes, and a synthetic video header for formatter tests.
    // Browser playback is verified separately with an actual MP4.
    $file_bytes = $bundle_name === 'animated_gif'
      ? file_get_contents(DRUPAL_ROOT . '/core/misc/throbber-active.gif')
      : pack('N', 24) . 'ftypisom' . pack('N', 0) . 'isommp42';
    $test_file = \Drupal::service('file.repository')->writeData($file_bytes, 'public://inline-media-test-' . bin2hex(random_bytes(5)) . '.' . $file_extension);
    $created_files[] = $test_file;
    inline_media_assert(count(\Drupal::service('file.validator')->validate($test_file->createDuplicate(), $upload_validators)) === 0, "Valid $bundle_name upload rejected.");
    $oversize_file = $test_file->createDuplicate();
    $oversize_file->setSize($limit_megabytes * 1024 * 1024 + 1);
    inline_media_assert(count(\Drupal::service('file.validator')->validate($oversize_file, $upload_validators)) > 0, "Oversized $bundle_name upload accepted.");
    $wrong_extension_file = $test_file->createDuplicate();
    $wrong_extension_file->setTemporary();
    $wrong_extension_file->setFilename('invalid.txt');
    inline_media_assert(count(\Drupal::service('file.validator')->validate($wrong_extension_file, $upload_validators)) > 0, "Invalid $bundle_name extension accepted.");
    $test_media->set($field_name, ['target_id' => $test_file->id(), 'alt' => 'Animated upload test']);
    $test_media->save();
    $created_media[] = $test_media;
    $original_hash = hash_file('sha256', $test_file->getFileUri());
    foreach (['basic_html', 'full_html'] as $format_name) {
      $render_array = ['#type' => 'processed_text', '#text' => '<drupal-media data-entity-type="media" data-entity-uuid="' . $test_media->uuid() . '"></drupal-media>', '#format' => $format_name];
      \Drupal::service('account_switcher')->switchTo($anonymous_account);
      try {
        $rendered_html = (string) \Drupal::service('renderer')->renderInIsolation($render_array);
      }
      finally {
        \Drupal::service('account_switcher')->switchBack();
      }
      inline_media_assert(str_contains($rendered_html, $bundle_name === 'animated_gif' ? 'inline-media__image' : 'inline-media__video'), "Missing $bundle_name embed in $format_name: $rendered_html");
      inline_media_assert(!preg_match('/\s(?:width|height|style)=/', $rendered_html), 'Inline media contains presentational HTML attributes.');
      if ($bundle_name === 'animated_gif') {
        inline_media_assert(!str_contains($rendered_html, '/styles/'), 'GIF must use its original file, not a resized derivative.');
      }
      else {
        inline_media_assert(str_contains($rendered_html, 'controls') && str_contains($rendered_html, 'playsinline') && !str_contains($rendered_html, 'autoplay'), 'Video playback attributes are incorrect.');
      }
    }
    inline_media_assert(hash_file('sha256', $test_file->getFileUri()) === $original_hash, 'Rendering changed the original file.');
  }
}
finally {
  foreach ($created_media as $test_media) {
    $test_media->delete();
  }
  foreach ($created_files as $test_file) {
    $test_file->delete();
  }
}
print "PASS: editor validation, editor/anonymous access, valid uploads, oversize and extension rejection, public embeds, original GIF bytes and dimension-free video/image markup.\n";
