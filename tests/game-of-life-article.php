<?php

declare(strict_types=1);

/**
 * @file
 * Run against DEV: drush php:script tests/game-of-life-article.php
 */

use Drupal\node\Entity\Node;
use Drupal\Core\Session\AnonymousUserSession;

function verify_life_condition(bool $test_condition, string $failure_message): void {
  if (!$test_condition) throw new RuntimeException($failure_message);
}

$entity_manager = \Drupal::entityTypeManager();
$matching_nodes = $entity_manager->getStorage('node')->loadByProperties(['uuid' => JURENITES_LIFE_ARTICLE_UUID]);
verify_life_condition(count($matching_nodes) === 1, 'Exactly one tribute Article must exist.');
$article_node = reset($matching_nodes);
verify_life_condition($article_node->isPublished() && $article_node->bundle() === 'article', 'Published Article expected in DEV.');
verify_life_condition($article_node->getOwner()->getAccountName() === 'alexander', 'Alexander must own the Article.');
verify_life_condition($article_node->get('field_youtube_video')->isEmpty(), 'Personal Article must keep its primary YouTube field empty.');
verify_life_condition(count($article_node->get('field_supporting_videos')) === 2, 'Two supporting films expected.');

$account_switcher = \Drupal::service('account_switcher');
$account_switcher->switchTo(new AnonymousUserSession());
try {
  verify_life_condition($article_node->access('view'), 'Article must be readable anonymously.');
  $view_builder = $entity_manager->getViewBuilder('node');
  $full_build = $view_builder->view($article_node, 'full');
  $full_markup = (string) \Drupal::service('renderer')->renderRoot($full_build);
  verify_life_condition(substr_count($full_markup, 'data-game-of-life') === 1, 'Full Article must contain one simulation.');
  verify_life_condition(strpos($full_markup, 'data-game-of-life') < strpos($full_markup, 'article-detail__body'), 'Simulation must precede narrative.');
  verify_life_condition(!str_contains($full_markup, 'filter-image-invalid'), 'Body diagrams must pass the secure image filter.');
  verify_life_condition(substr_count($full_markup, '/game-of-life/') === substr_count($article_node->body->value, '/game-of-life/'), 'All currently authored diagrams must render.');
  verify_life_condition(substr_count($full_markup, 'class="media-oembed-content"') === 2, 'Both supporting video players must render.');
  verify_life_condition(!preg_match('/<iframe[^>]+\s(?:width|height|style)=/', $full_markup), 'Player presentation belongs in SCSS.');
  $teaser_build = $view_builder->view($article_node, 'teaser');
  $teaser_markup = (string) \Drupal::service('renderer')->renderRoot($teaser_build);
  verify_life_condition(substr_count($teaser_markup, 'data-game-of-life') === 1, 'Teaser must contain exactly one live thumbnail.');
  $list_build = $view_builder->view($article_node, 'blog_list');
  $list_markup = (string) \Drupal::service('renderer')->renderRoot($list_build);
  verify_life_condition(substr_count($list_markup, 'data-game-of-life') === 1, 'Blog list must contain exactly one live thumbnail.');
  verify_life_condition(str_contains($list_markup, 'article-list-item--game-of-life'), 'Live thumbnail needs its scoped 281px grid column.');
  verify_life_condition(substr_count($full_markup, 'data-life-pause ') === 1, 'Exactly one pause/play control expected.');
  foreach (['data-life-shape', 'data-life-step', 'data-life-reset', 'data-life-clear', 'data-life-add', 'game-of-life__rules', 'game-of-life__heading'] as $removed_feature) {
    verify_life_condition(!str_contains($full_markup, $removed_feature), 'Removed simulation feature remains: ' . $removed_feature);
  }
  verify_life_condition(str_contains($full_markup, 'data-icon-name="play-triangle"') && str_contains($full_markup, 'data-icon-name="pause-rect"'), 'User supplied playback icons must render.');
  $ordinary_node = Node::create(['type' => 'article', 'title' => 'Unrelated test article']);
  $ordinary_build = [];
  $view_display = $entity_manager->getStorage('entity_view_display')->load('node.article.default');
  jurenites_life_node_view($ordinary_build, $ordinary_node, $view_display, 'full');
  verify_life_condition(!isset($ordinary_build['game_of_life']), 'Unrelated articles must remain unaffected.');
}
finally {
  $account_switcher->switchBack();
}
$original_revision = $article_node->getRevisionId();
require __DIR__ . '/../scripts/create-life-article.php';
$entity_manager->getStorage('node')->resetCache([$article_node->id()]);
verify_life_condition($entity_manager->getStorage('node')->load($article_node->id())->getRevisionId() === $original_revision, 'Rerunning setup must preserve the existing revision.');
echo 'Life Article: author, scope, images, video embeds, anonymous rendering, and idempotency passed.' . PHP_EOL;
