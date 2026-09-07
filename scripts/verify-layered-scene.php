<?php

/**
 * @file
 * Verify local scene authoring, safe rendering and preservation of edits.
 */

use Drupal\block\Entity\Block;
use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Entity\Entity\EntityViewDisplay;

\Drupal::moduleHandler()->loadInclude('jurenites_hero', 'install');
$block_storage = \Drupal::entityTypeManager()->getStorage('block_content');
$scene_blocks = $block_storage->loadByProperties(['uuid' => JURENITES_LAYERED_SCENE_UUID]);
$scene_block = reset($scene_blocks);
if (!$scene_block) {
  throw new RuntimeException('Desk arrival block is missing.');
}
$scene_placement = Block::load('jurenites_theme_desk_arrival');
$content_snapshot = serialize($scene_block->toArray());
$placement_snapshot = serialize($scene_placement->toArray());
jurenites_hero_layered_scene_seed();
$block_storage->resetCache([$scene_block->id()]);
if ($content_snapshot !== serialize($block_storage->load($scene_block->id())->toArray())
  || $placement_snapshot !== serialize(Block::load($scene_placement->id())->toArray())) {
  throw new RuntimeException('Scene setup changed authored content or placement.');
}
$form_display = EntityFormDisplay::load('block_content.layered_scene.default');
foreach (['background', 'foreground', 'eyebrow', 'heading', 'description', 'arrival', 'primary', 'secondary'] as $field_suffix) {
  if (!$form_display->getComponent('field_scene_' . $field_suffix)) {
    throw new RuntimeException('Missing widget: ' . $field_suffix);
  }
}
$view_display = EntityViewDisplay::load('block_content.layered_scene.default');
$render_build = [];
jurenites_hero_block_content_view($render_build, $scene_block, $view_display, 'default');
$scene_html = (string) \Drupal::service('renderer')->renderRoot($render_build);
if (substr_count($scene_html, '<img') !== 2 || preg_match('/\s(?:width|height|style)=/', $scene_html)) {
  throw new RuntimeException('Aligned layers or clean DOM contract failed.');
}
$test_block = $scene_block->createDuplicate();
$test_block->set('field_scene_background', []);
$test_block->set('field_scene_heading', '<script>example</script>');
$test_block->set('field_scene_arrival', FALSE);
$test_build = [];
jurenites_hero_block_content_view($test_build, $test_block, $view_display, 'default');
$test_html = (string) \Drupal::service('renderer')->renderRoot($test_build);
if (!str_contains($test_html, 'layered-scene--without-image')
  || !str_contains($test_html, 'data-arrival-enabled="false"')
  || str_contains($test_html, '<script>') || !str_contains($test_html, '&lt;script&gt;')) {
  throw new RuntimeException('Fallback, static mode or escaping failed.');
}
print json_encode([
  'edit_path' => $scene_block->toUrl('edit-form')->toString(),
  'region' => $scene_placement->getRegion(),
  'weight' => $scene_placement->getWeight(),
  'widgets_rendering_escaping_idempotence' => 'passed',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL;
