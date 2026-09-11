<?php

/**
 * @file
 * Run: docker exec blog_jurenites_web ./vendor/bin/drush php:script tests/skills-profile.php
 * Validates authoring and rendering without saving changes to authored content.
 */

use Drupal\block_content\Entity\BlockContent;
use Drupal\Core\Entity\Entity\EntityViewDisplay;

$block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
$block_entities = $block_storage->loadByProperties(['uuid' => '0a3f8606-ecf5-4da3-9c26-a4e7eac1f734']);
$source_block = reset($block_entities);
if (!$source_block instanceof BlockContent) {
  throw new RuntimeException('Enable jurenites_skills before running this check.');
}
$source_items = $source_block->get('field_skills_items')->referencedEntities();
$source_skill = reset($source_items);
$view_display = EntityViewDisplay::load('block_content.skills_profile.default');
$check_count = 0;
$assert_check = static function (bool $check_passed, string $check_message) use (&$check_count): void {
  if (!$check_passed) {
    throw new RuntimeException($check_message);
  }
  $check_count++;
};

foreach ([['value' => NULL, 'expected' => NULL], ['value' => '0.0', 'expected' => '0.0'], ['value' => '3.4', 'expected' => '3.4'], ['value' => '5.0', 'expected' => '5.0']] as $score_case) {
  $test_skill = clone $source_skill;
  $test_skill->set('field_skill_score', $score_case['value']);
  $test_skill->set('field_skill_name', '<script>unsafe</script>');
  $test_block = clone $source_block;
  $test_block->set('field_skills_items', [$test_skill]);
  $test_block->set('field_skills_reviewed', FALSE);
  $build_output = [];
  jurenites_skills_block_content_view($build_output, $test_block, $view_display, 'full');
  $assert_check($build_output['skills_profile']['#skill_items'][0]['skill_score'] === $score_case['expected'], 'Missing and zero scores must remain distinct and decimals must be preserved.');
  $rendered_html = (string) \Drupal::service('renderer')->renderRoot($build_output);
  $assert_check(str_contains($rendered_html, '&lt;script&gt;unsafe&lt;/script&gt;'), 'Technology names must be escaped.');
  $assert_check(str_contains($rendered_html, 'provisional estimates'), 'Draft scores must retain the qualification.');
  $assert_check($score_case['value'] !== NULL || str_contains($rendered_html, 'Not assessed'), 'Missing scores need a visible unassessed state.');
}
foreach (['-0.1', '5.1'] as $invalid_score) {
  $test_skill = clone $source_skill;
  $test_skill->set('field_skill_score', $invalid_score);
  $assert_check(count($test_skill->get('field_skill_score')->validate()) > 0, 'Out-of-range scores must fail field validation.');
}
$test_block->set('field_skills_reviewed', TRUE);
$build_output = [];
jurenites_skills_block_content_view($build_output, $test_block, $view_display, 'full');
$assert_check($build_output['skills_profile']['#ratings_reviewed'] === TRUE, 'Reviewed state must reach the renderer.');
$assert_check(in_array('block_content:' . $source_block->id(), $build_output['skills_profile']['#cache']['tags'], TRUE), 'Authored block edits must invalidate the card.');
$assert_check(in_array('paragraph:' . $source_skill->id(), $build_output['skills_profile']['#cache']['tags'], TRUE), 'Skill edits must invalidate the card.');

\Drupal::moduleHandler()->loadInclude('jurenites_skills', 'install');
$before_values = $source_block->toArray();
jurenites_skills_setup();
$block_storage->resetCache([$source_block->id()]);
$assert_check($before_values === $block_storage->load($source_block->id())->toArray(), 'Repeated setup must preserve authored content.');
$assert_check(count($block_storage->loadByProperties(['uuid' => $source_block->uuid()])) === 1, 'Repeated setup must not duplicate the profile.');
print "Skills profile: $check_count checks passed.\n";
