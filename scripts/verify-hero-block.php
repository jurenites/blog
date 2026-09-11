<?php

/**
 * @file
 * Run with Drush php:script. Checks DEV Hero setup without changing content.
 */

use Drupal\block\Entity\Block;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Entity\Entity\EntityViewDisplay;

\Drupal::moduleHandler()->loadInclude('jurenites_hero', 'install');
$block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
$hero_blocks = $block_storage->loadByProperties(['uuid' => JURENITES_HERO_BLOCK_UUID]);
$hero_block = reset($hero_blocks);
if (!$hero_block) {
  throw new RuntimeException('The initial Hero block is missing.');
}
$content_snapshot = serialize($hero_block->toArray());
$hero_placement = Block::load('jurenites_theme_homepage_hero');
$placement_snapshot = serialize($hero_placement->toArray());
jurenites_hero_create_about_block();
$block_storage->resetCache([$hero_block->id()]);
if ($content_snapshot !== serialize($block_storage->load($hero_block->id())->toArray())
  || $placement_snapshot !== serialize(Block::load($hero_placement->id())->toArray())) {
  throw new RuntimeException('Re-running setup changed authored content or placement.');
}
$visibility_pages = $hero_placement->getVisibility()['request_path']['pages'] ?? '';
if ($visibility_pages !== "/about\n/obo") {
  throw new RuntimeException('Hero placement is not limited to both About pages.');
}
$form_display = EntityFormDisplay::load('block_content.hero.default');
foreach (['field_hero_image', 'field_hero_eyebrow', 'field_hero_glow', 'field_hero_slides'] as $field_name) {
  if (!$form_display->getComponent($field_name)) {
    throw new RuntimeException('Missing editing widget: ' . $field_name);
  }
}
$view_display = EntityViewDisplay::load('block_content.hero.default');
$render_build = [];
jurenites_hero_block_content_view($render_build, $hero_block, $view_display, 'default');
$rendered_html = (string) \Drupal::service('renderer')->renderRoot($render_build);
if (substr_count($rendered_html, 'data-hero-panel') !== count($hero_block->get('field_hero_slides'))
  || preg_match('/\s(?:width|height|style)=/', $rendered_html)) {
  throw new RuntimeException('Slides or clean-DOM image contract failed.');
}
// Exercise missing images and escaping on an unsaved copy, leaving source alone.
$test_block = $hero_block->createDuplicate();
$test_block->set('field_hero_image', []);
$test_block->set('field_hero_eyebrow', '<script>untrusted example</script>');
$test_build = [];
jurenites_hero_block_content_view($test_build, $test_block, $view_display, 'default');
$test_html = (string) \Drupal::service('renderer')->renderRoot($test_build);
if (!str_contains($test_html, 'hero-section--without-image')
  || str_contains($test_html, '<script>') || !str_contains($test_html, '&lt;script&gt;')) {
  throw new RuntimeException('Missing-image fallback or escaped author text failed.');
}
print json_encode([
  'content_block_id' => $hero_block->id(),
  'edit_path' => $hero_block->toUrl('edit-form')->toString(),
  'slide_count' => count($hero_block->get('field_hero_slides')),
  'image_attached' => !$hero_block->get('field_hero_image')->isEmpty(),
  'placement' => $hero_placement->id(),
  'visibility_pages' => explode("\n", $visibility_pages),
  'region' => $hero_placement->getRegion(),
  'weight' => $hero_placement->getWeight(),
  'idempotence_widgets_rendering_escaping' => 'passed',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
