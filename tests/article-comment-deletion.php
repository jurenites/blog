<?php

/**
 * @file
 * Read-only check: drush php:script tests/article-comment-deletion.php.
 */

use Drupal\comment\Entity\Comment;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\Core\Session\UserSession;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

$article_entity = Node::create(['type' => 'article', 'title' => 'Comment access fixture']);
$comment_entity = Comment::create([
  'comment_type' => 'comment',
  'entity_type' => 'node',
  'entity_id' => $article_entity,
  'field_name' => 'comment',
  'uid' => 999991,
]);
$editor_account = new UserSession([
  'uid' => 999991,
  'roles' => ['authenticated', 'content_editor'],
]);
$other_editor = new UserSession([
  'uid' => 999992,
  'roles' => ['authenticated', 'content_editor'],
]);
$ordinary_author = new UserSession(['uid' => 999991, 'roles' => ['authenticated']]);
$access_handler = \Drupal::entityTypeManager()->getAccessControlHandler('comment');

foreach ([
  [$editor_account, TRUE, 'own Article comment'],
  [$other_editor, FALSE, 'another editor comment'],
  [$ordinary_author, FALSE, 'author without deletion permission'],
  [new AnonymousUserSession(), FALSE, 'anonymous visitor'],
  [User::load(1), TRUE, 'administrator'],
] as [$user_account, $expected_access, $case_description]) {
  $access_handler->resetCache();
  if ($comment_entity->access('delete', $user_account) !== $expected_access) {
    throw new \RuntimeException('Incorrect deletion access: ' . $case_description);
  }
}

$delete_access = $comment_entity->access('delete', $editor_account, TRUE);
foreach (['user', 'user.permissions'] as $cache_context) {
  if (!in_array($cache_context, $delete_access->getCacheContexts(), TRUE)) {
    throw new \RuntimeException('Missing deletion cache context: ' . $cache_context);
  }
}

$comment_entity->set('entity_id', Node::create(['type' => 'page', 'title' => 'Other content fixture']));
$access_handler->resetCache();
if ($comment_entity->access('delete', $editor_account)) {
  throw new \RuntimeException('Article deletion permission must not apply to other content types.');
}

$comment_entity->set('entity_id', $article_entity);
$comment_entity->set('field_name', 'other_comments');
$access_handler->resetCache();
if ($comment_entity->access('delete', $editor_account)) {
  throw new \RuntimeException('Article deletion permission must not apply to other comment fields.');
}

$comment_definitions = \Drupal::service('plugin.manager.menu.contextual_link')->getDefinitions();
$delete_definition = $comment_definitions['jurenites_admin.comment_delete'] ?? [];
if (($delete_definition['route_name'] ?? '') !== 'entity.comment.delete_form'
  || ($delete_definition['group'] ?? '') !== 'comment') {
  throw new \RuntimeException('Delete must use the native comment confirmation route in the pencil menu.');
}

print 'PASS: Comment deletion respects ownership, role, content type, field, and cache contexts; the pencil menu uses native confirmation.' . PHP_EOL;
