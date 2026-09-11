<?php

/**
 * @file
 * Local check: vendor/bin/drush php:script tests/article-comment-language.php.
 */

use Drupal\comment\CommentInterface;
use Drupal\comment\CommentManagerInterface;
use Drupal\Core\Form\FormState;

\Drupal::moduleHandler()->loadInclude('jurenites_admin', 'module');

$comment_storage = \Drupal::entityTypeManager()->getStorage('comment');
$expected_comments = [];
foreach ([
  'en' => 'fb7ce39c-fdd9-4ff5-b43d-63eb883fe3ad',
  'ru' => '1c47d445-f500-4406-b9ac-12e828b095e2',
] as $comment_language_id => $comment_uuid) {
  $matching_comments = $comment_storage->loadByProperties(['uuid' => $comment_uuid]);
  $comment_entity = reset($matching_comments);
  if (!$comment_entity instanceof CommentInterface) {
    throw new \RuntimeException("Missing $comment_language_id comment fixture.");
  }
  if ($comment_entity->language()->getId() !== $comment_language_id) {
    throw new \RuntimeException("The $comment_language_id comment has the wrong stored language.");
  }
  $expected_comments[$comment_language_id] = $comment_entity;
}

$article_entity = $expected_comments['en']->getCommentedEntity();
foreach ($expected_comments as $comment_language_id => $expected_comment) {
  if (!$article_entity->hasTranslation($comment_language_id)) {
    throw new \RuntimeException("The Article has no $comment_language_id translation.");
  }

  $article_translation = $article_entity->getTranslation($comment_language_id);
  $language_comments = $comment_storage->loadThread(
    $article_translation,
    'comment',
    CommentManagerInterface::COMMENT_MODE_THREADED,
  );
  $language_comment_ids = array_values(array_map(
    static fn(CommentInterface $comment_entity): string => $comment_entity->id(),
    $language_comments,
  ));
  if ($language_comment_ids !== [$expected_comment->id()]) {
    throw new \RuntimeException(sprintf(
      'Expected only comment %s in %s, got %s.',
      $expected_comment->id(),
      $comment_language_id,
      implode(', ', $language_comment_ids),
    ));
  }

  $article_path = $article_translation->toUrl()->toString();
  $page_response = \Drupal::httpClient()->get('http://localhost' . $article_path, [
    'headers' => ['Host' => 'jurenites.local'],
    'http_errors' => FALSE,
  ]);
  $page_html = (string) $page_response->getBody();
  $expected_permalink = $article_path . '#comment-' . $expected_comment->id();
  if (!str_contains($page_html, 'href="' . $expected_permalink . '"')) {
    throw new \RuntimeException(sprintf(
      'Comment %s does not link directly to its %s Article anchor.',
      $expected_comment->id(),
      $comment_language_id,
    ));
  }
  foreach ($expected_comments as $candidate_language_id => $candidate_comment) {
    $comment_is_visible = str_contains($page_html, 'id="comment-' . $candidate_comment->id() . '"');
    if ($comment_is_visible !== ($candidate_language_id === $comment_language_id)) {
      throw new \RuntimeException(sprintf(
        'Comment %s has incorrect visibility on the %s Article.',
        $candidate_comment->id(),
        $comment_language_id,
      ));
    }
  }
}

$new_comment = $comment_storage->create([
  'entity_type' => 'node',
  'entity_id' => $article_entity->id(),
  'field_name' => 'comment',
  'comment_type' => 'comment',
]);
jurenites_admin_set_article_comment_language($new_comment, 'ru');
if ($new_comment->language()->getId() !== 'ru') {
  throw new \RuntimeException('A new Russian-page comment did not receive the Russian language.');
}

$edited_comment = clone $expected_comments['en'];
$comment_form_state = new FormState();
$comment_form_state->setValue('comment_language_id', 'ru');
$comment_form = [];
jurenites_admin_build_article_comment_language(
  'comment',
  $edited_comment,
  $comment_form,
  $comment_form_state,
);
if ($edited_comment->language()->getId() !== 'ru') {
  throw new \RuntimeException('An edited comment did not receive its selected Article language.');
}

$contextual_link_definitions = \Drupal::service('plugin.manager.menu.contextual_link')
  ->getDefinitions();
$comment_edit_link = $contextual_link_definitions['jurenites_admin.comment_edit'] ?? [];
if (($comment_edit_link['route_name'] ?? '') !== 'entity.comment.edit_form') {
  throw new \RuntimeException('The comment contextual edit shortcut is unavailable.');
}

print 'PASS: Article comments stay in their language threads and expose language-aware editing.' . PHP_EOL;
