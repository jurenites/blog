<?php

/**
 * @file
 * Local check: drush php:script tests/article-youtube-metadata-form.php.
 */

use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

$article_ids = \Drupal::entityQuery('node')->condition('type', 'article')->exists('field_youtube_video.video_id')->accessCheck(FALSE)->range(0, 1)->execute();
$existing_article = $article_ids ? Node::load(reset($article_ids)) : NULL;
if (!$existing_article) {
  throw new RuntimeException('No YouTube Article available for verification.');
}
$editor_accounts = [];
foreach (User::loadMultiple() as $user_account) {
  if (!$user_account->isActive() || !($user_account->hasPermission('edit any article content') || $user_account->hasPermission('edit own article content') || $user_account->hasPermission('bypass node access'))) {
    continue;
  }
  $account_kind = $user_account->hasPermission('administer nodes') ? 'administrator' : 'editor';
  $editor_accounts[$account_kind] = $user_account;
}
if (count($editor_accounts) !== 2) {
  throw new RuntimeException('Both editor and administrator accounts are required for verification.');
}
foreach ($editor_accounts as $account_kind => $user_account) {
  \Drupal::service('account_switcher')->switchTo($user_account);
  try {
    foreach (['edit' => $existing_article, 'add' => Node::create(['type' => 'article'])] as $form_kind => $article_node) {
      // Use the real edit route operation: the default form has a different ID.
      $edit_operation = explode('.', \Drupal::service('router.route_provider')->getRouteByName('entity.node.edit_form')->getDefault('_entity_form'))[1];
      $article_form = \Drupal::service('entity.form_builder')->getForm($article_node, $form_kind === 'edit' ? $edit_operation : 'default');
      $rendered_form = (string) \Drupal::service('renderer')->renderRoot($article_form);
      $document_tree = new DOMDocument();
      @$document_tree->loadHTML($rendered_form);
      $document_query = new DOMXPath($document_tree);
      $details_path = '//details[@data-drupal-selector="edit-youtube-metadata"]';
      if ($document_query->query($details_path)->length !== 1 || $document_query->query($details_path . '[@open]')->length !== 0) {
        throw new RuntimeException("$account_kind $form_kind: metadata section must start collapsed.");
      }
      foreach (['field_youtube_creator_name[0][value]', 'field_youtube_creator_url[0][uri]', 'field_youtube_published_date[0][value][date]'] as $input_name) {
        if ($document_query->query($details_path . '//input[@name="' . $input_name . '"]')->length !== 1) {
          throw new RuntimeException("$account_kind $form_kind: missing grouped field $input_name.");
        }
      }
      $avatar_input = '//input[@name="field_youtube_channel_avatar[0][value]"]';
      $expected_avatar_count = $account_kind === 'administrator' ? 1 : 0;
      if ($document_query->query($details_path . $avatar_input)->length !== $expected_avatar_count
        || $document_query->query($avatar_input)->length !== $expected_avatar_count) {
        throw new RuntimeException("$account_kind $form_kind: channel avatar must be grouped and administrator-only.");
      }
      $video_input = '//input[@name="field_youtube_video[0][input]"]';
      if ($document_query->query($video_input)->length !== 1 || $document_query->query($details_path . $video_input)->length !== 0) {
        throw new RuntimeException("$account_kind $form_kind: video URL must remain outside metadata.");
      }
      if ($form_kind === 'edit' && $document_query->query($details_path . '//div[@class="youtube-video-id"]')->length !== 1) {
        throw new RuntimeException("$account_kind: saved video ID must be inside metadata.");
      }
      echo "$account_kind $form_kind: collapsed section, metadata fields and submission names, visible video URL, and saved video ID verified.\n";
    }
  }
  finally {
    \Drupal::service('account_switcher')->switchBack();
  }
}
