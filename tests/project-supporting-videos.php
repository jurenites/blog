<?php

declare(strict_types=1);

/**
 * @file
 * DEV check: drush php:script tests/project-supporting-videos.php.
 */

use Drupal\Core\Session\AnonymousUserSession;
use Drupal\node\Entity\Node;
use Drupal\user\Entity\User;

function project_video_expect(bool $test_condition, string $failure_message): void {
  if (!$test_condition) {
    throw new RuntimeException($failure_message);
  }
}

$entity_manager = \Drupal::entityTypeManager();
$video_ids = $entity_manager->getStorage('media')->getQuery()
  ->condition('bundle', 'remote_video')->condition('status', 1)
  ->accessCheck(FALSE)->range(0, 2)->execute();
project_video_expect(count($video_ids) === 2, 'Two existing published Remote videos are required.');
$config_names = [
  'core.entity_form_display.node.article.default',
  'core.entity_view_display.node.article.default',
  'core.entity_form_display.node.project.default',
  'core.entity_view_display.node.project.default',
  'core.entity_view_display.node.project.teaser',
];
$config_snapshot = [];
foreach ($config_names as $config_name) {
  $config_snapshot[$config_name] = \Drupal::config($config_name)->getRawData();
}
require_once DRUPAL_ROOT . '/modules/custom/jurenites_font_projects/jurenites_font_projects.post_update.php';
jurenites_font_projects_post_update_project_supporting_videos();
foreach ($config_snapshot as $config_name => $config_values) {
  project_video_expect(\Drupal::config($config_name)->getRawData() === $config_values, 'Repeated update changed ' . $config_name);
}

$database_transaction = \Drupal::database()->startTransaction();
$account_switcher = \Drupal::service('account_switcher');
try {
  $project_node = Node::create([
    'type' => 'project', 'title' => 'Project supporting video verification',
    'uid' => 1, 'status' => 1, 'path' => ['pathauto' => 0],
    'body' => ['value' => '<p>Project narrative verification.</p>', 'format' => 'basic_html'],
    'field_supporting_videos' => array_values($video_ids),
  ]);
  project_video_expect(count($project_node->field_supporting_videos->validate()) === 0, 'Remote video references must validate.');
  $project_node->save();
  $entity_manager->getStorage('node')->resetCache([$project_node->id()]);
  $project_node = Node::load($project_node->id());
  project_video_expect(count($project_node->field_supporting_videos) === 2, 'Both videos must survive save/reload.');

  $account_switcher->switchTo(User::load(1));
  try {
    foreach (['default' => Node::create(['type' => 'project']), 'edit' => $project_node] as $form_operation => $form_node) {
      $project_form = \Drupal::service('entity.form_builder')->getForm($form_node, $form_operation);
      $form_markup = (string) \Drupal::service('renderer')->renderRoot($project_form);
      project_video_expect(str_contains($form_markup, 'field_supporting_videos-media-library-open-button'), $form_operation . ': missing Media Library button.');
      project_video_expect(str_contains($form_markup, 'Supporting videos'), $form_operation . ': missing field label.');
    }
  }
  finally {
    $account_switcher->switchBack();
  }

  $account_switcher->switchTo(new AnonymousUserSession());
  try {
    $view_builder = $entity_manager->getViewBuilder('node');
    $full_build = $view_builder->view($project_node, 'full');
    $full_markup = (string) \Drupal::service('renderer')->renderRoot($full_build);
    project_video_expect(substr_count($full_markup, 'project-detail__video-player') === 2, 'Both supporting players must render.');
    project_video_expect(strpos($full_markup, 'Project narrative verification.') < strpos($full_markup, 'project-detail__videos'), 'Videos must follow the narrative.');
    project_video_expect(!preg_match('/<iframe[^>]+\s(?:width|height|style)=/', $full_markup), 'Player dimensions must remain in SCSS.');
    $teaser_build = $view_builder->view($project_node, 'teaser');
    $teaser_markup = (string) \Drupal::service('renderer')->renderRoot($teaser_build);
    project_video_expect(!str_contains($teaser_markup, '<iframe'), 'Portfolio cards must not embed supporting videos.');
    $project_node->set('field_supporting_videos', []);
    $project_node->save();
    $empty_build = $view_builder->view($project_node, 'full');
    $empty_markup = (string) \Drupal::service('renderer')->renderRoot($empty_build);
    project_video_expect(!str_contains($empty_markup, 'project-detail__videos'), 'An empty field must not leave a wrapper.');
  }
  finally {
    $account_switcher->switchBack();
  }
}
finally {
  $database_transaction->rollBack();
  $entity_manager->getStorage('node')->resetCache();
}
print "Project videos: add/edit controls, save/reload, responsive rendering, empty field, cards and update idempotency passed.\n";
