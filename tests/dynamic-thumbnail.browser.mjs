import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1100 } });
page_instance.setDefaultTimeout(20000);
page_instance.setDefaultNavigationTimeout(45000);
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
await mkdir('outputs/dynamic-thumbnails', { recursive: true });
try {
  await page_instance.goto('http://jurenites.local/portfolio', { waitUntil: 'domcontentloaded' });
  await page_instance.waitForFunction(() => !document.documentElement.hasAttribute('data-site-intro'));
  const thumbnail_nodes = page_instance.locator('[data-dynamic-thumbnail]:is([href$="/portfolio/smep"], [href$="/portfolio/oksenate"], [href$="/portfolio/my-first-font"], [href$="/portfolio/my-second-font"])');
  assert.equal(await thumbnail_nodes.count(), 4);
  assert.equal(await thumbnail_nodes.locator('[data-thumbnail-depth]').count(), 14);
  assert.equal(await thumbnail_nodes.locator('svg.dynamic-thumbnail__artwork').count(), 4);
  assert.equal(await thumbnail_nodes.locator('[style]').count(), 0);
  for (const thumbnail_node of await thumbnail_nodes.all()) {
    const frame_bounds = await thumbnail_node.boundingBox();
    assert.ok(Math.abs(frame_bounds.width / frame_bounds.height - 2) < 0.01);
    if (await thumbnail_node.locator('[data-thumbnail-highlight]').count()) {
      assert.equal(await thumbnail_node.locator('[data-thumbnail-highlight]').getAttribute('gradientTransform'), 'translate(0 0) matrix(290 0 0 240 0 0)');
    }
  }
  await page_instance.screenshot({ path: 'outputs/dynamic-thumbnails/portfolio-initial.png', fullPage: true });
  const thumbnail_node = thumbnail_nodes.first();
  const frame_bounds = await thumbnail_node.boundingBox();
  const read_highlight = () => thumbnail_node.locator('[data-thumbnail-highlight]').evaluate((gradient_node) => {
    const gradient_matrix = gradient_node.gradientTransform.baseVal.consolidate().matrix;
    return { position_x: gradient_matrix.e, position_y: gradient_matrix.f };
  });
  await page_instance.mouse.move(frame_bounds.x + frame_bounds.width * 0.75, frame_bounds.y + frame_bounds.height * 0.6);
  await page_instance.waitForTimeout(150);
  const early_highlight = await read_highlight();
  assert.ok(early_highlight.position_x > 0 && early_highlight.position_x < 280, 'Gradient trails rather than jumps to the pointer.');
  await page_instance.waitForTimeout(350);
  const later_highlight = await read_highlight();
  assert.ok(later_highlight.position_x > early_highlight.position_x && later_highlight.position_x < 289, 'Gradient continues approaching the stationary cursor.');
  const layer_transforms = await thumbnail_node.locator('[data-thumbnail-depth]').evaluateAll((layer_nodes) => layer_nodes.map((layer_node) => getComputedStyle(layer_node).transform));
  assert.equal(new Set(layer_transforms).size, 3, 'Each depth moves differently.');
  const sphere_transforms = await thumbnail_node.locator('[data-thumbnail-depth="1"]').evaluateAll((layer_nodes) => layer_nodes.map((layer_node) => getComputedStyle(layer_node).transform));
  assert.equal(sphere_transforms.length, 2);
  assert.equal(new Set(sphere_transforms).size, 1, 'Both SMEP spheres share exactly the same depth.');
  for (const resting_thumbnail of (await thumbnail_nodes.all()).slice(1)) {
    assert.ok(await resting_thumbnail.locator('[data-thumbnail-depth]').evaluateAll((layer_nodes) => layer_nodes.every((layer_node) => getComputedStyle(layer_node).transform === 'none')), 'Other thumbnails must remain still.');
  }
  await page_instance.screenshot({ path: 'outputs/dynamic-thumbnails/portfolio-motion.png', fullPage: true });
  await page_instance.locator('.portfolio-grid').screenshot({ path: 'outputs/dynamic-thumbnails/grid-motion.png' });
  const before_exit = await read_highlight();
  await page_instance.mouse.move(50, 100);
  await page_instance.waitForTimeout(300);
  const returning_highlight = await read_highlight();
  assert.ok(returning_highlight.position_x > 0 && returning_highlight.position_x < before_exit.position_x, 'Gradient eases home on exit.');
  assert.ok(await thumbnail_node.locator('[data-thumbnail-depth]').evaluateAll((layer_nodes) => layer_nodes.every((layer_node) => getComputedStyle(layer_node).transform === 'none')), 'All layers return to neutral on exit.');
  await page_instance.waitForFunction((thumbnail_element) => thumbnail_element.querySelector('[data-thumbnail-highlight]').getAttribute('gradientTransform') === 'translate(0 0) matrix(290 0 0 240 0 0)', await thumbnail_node.elementHandle());
  await page_instance.mouse.move(70, 110);
  assert.equal((await read_highlight()).position_x, 0, 'Outside movement leaves the gradient at home.');
  await page_instance.mouse.move(frame_bounds.x + frame_bounds.width * 0.75, frame_bounds.y + frame_bounds.height * 0.6);
  await page_instance.waitForTimeout(150);
  const horizontal_layer = page_instance.locator('.dynamic-thumbnail__layer--horizontal');
  assert.equal(await horizontal_layer.count(), 1);
  const photo_thumbnail = horizontal_layer.locator('xpath=ancestor::*[@data-dynamic-thumbnail]');
  assert.equal(await photo_thumbnail.locator('[data-thumbnail-highlight]').count(), 0, 'Oksenate has no authored gradient and must not receive one.');
  const photo_bounds = await photo_thumbnail.boundingBox();
  for (const horizontal_fraction of [0.98, 0.02]) {
    await page_instance.mouse.move(photo_bounds.x + photo_bounds.width * horizontal_fraction, photo_bounds.y + photo_bounds.height * 0.8);
    await page_instance.waitForTimeout(350);
    const photo_geometry = await horizontal_layer.evaluate((layer_node) => {
      const transform_matrix = new DOMMatrix(getComputedStyle(layer_node).transform);
      const image_bounds = layer_node.querySelector('rect').getBoundingClientRect();
      const thumbnail_bounds = layer_node.closest('[data-dynamic-thumbnail]').getBoundingClientRect();
      return {
        horizontal_shift: transform_matrix.e, vertical_shift: transform_matrix.f,
        axis_values: [transform_matrix.a, transform_matrix.b, transform_matrix.c, transform_matrix.d],
        covers_frame: image_bounds.left <= thumbnail_bounds.left && image_bounds.right >= thumbnail_bounds.right
          && image_bounds.top <= thumbnail_bounds.top && image_bounds.bottom >= thumbnail_bounds.bottom,
      };
    });
    assert.ok(horizontal_fraction > 0.5 ? photo_geometry.horizontal_shift > 0 : photo_geometry.horizontal_shift < 0);
    assert.equal(photo_geometry.vertical_shift, 0);
    assert.deepEqual(photo_geometry.axis_values, [1, 0, 0, 1], 'Photo never tilts or scales.');
    assert.ok(photo_geometry.covers_frame, 'Photo covers every edge at both horizontal extremes.');
  }
  await page_instance.locator('.portfolio-grid').screenshot({ path: 'outputs/dynamic-thumbnails/grid-motion.png' });
  await page_instance.emulateMedia({ reducedMotion: 'reduce' });
  await page_instance.waitForTimeout(100);
  assert.equal(await thumbnail_node.locator('[data-thumbnail-highlight]').getAttribute('gradientTransform'), 'translate(0 0) matrix(290 0 0 240 0 0)');
  assert.ok((await thumbnail_node.locator('[data-thumbnail-depth]').evaluateAll((layer_nodes) => layer_nodes.map((layer_node) => getComputedStyle(layer_node).transform))).every((layer_transform) => layer_transform === 'none'));
  const mobile_context = await browser_instance.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile_page = await mobile_context.newPage();
  await mobile_page.goto('http://jurenites.local/portfolio', { waitUntil: 'domcontentloaded' });
  await mobile_page.waitForFunction(() => !document.documentElement.hasAttribute('data-site-intro'));
  assert.ok(await mobile_page.locator('[data-dynamic-thumbnail]').count() >= 4);
  assert.ok(await mobile_page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await mobile_page.screenshot({ path: 'outputs/dynamic-thumbnails/portfolio-mobile.png', fullPage: true });
  await mobile_context.close();
  await page_instance.emulateMedia({ reducedMotion: 'no-preference' });
  const flexible_markup = await readFile('outputs/dynamic-thumbnails/flexible-rendered.svg', 'utf8');
  await thumbnail_node.evaluate((thumbnail_element, svg_markup) => {
    Drupal.behaviors.jurenites_dynamic_thumbnail.detach(thumbnail_element, {}, 'unload');
    thumbnail_element.innerHTML = svg_markup;
    Drupal.behaviors.jurenites_dynamic_thumbnail.attach(thumbnail_element);
  }, flexible_markup);
  await page_instance.mouse.move(0, 0);
  await page_instance.waitForTimeout(100);
  const flexible_bounds = await thumbnail_node.boundingBox();
  assert.ok(Math.abs(flexible_bounds.width / flexible_bounds.height - 1.5) < 0.01, 'Use the uploaded viewBox aspect ratio.');
  const flexible_start = await read_highlight();
  assert.deepEqual(flexible_start, { position_x: 10, position_y: 20 }, 'Honor nonzero viewBox origin.');
  await page_instance.mouse.move(flexible_bounds.x + flexible_bounds.width * 0.9, flexible_bounds.y + flexible_bounds.height * 0.7);
  await page_instance.waitForTimeout(800);
  const flexible_layers = await thumbnail_node.locator('[data-thumbnail-depth]').evaluateAll((layer_nodes) => layer_nodes.map((layer_node) => ({ depth_number: layer_node.dataset.thumbnailDepth, transform_value: getComputedStyle(layer_node).transform })));
  assert.equal(flexible_layers.length, 6);
  assert.equal(flexible_layers[1].transform_value, flexible_layers[2].transform_value, 'Same-depth groups receive identical movement.');
  assert.equal(new Set(flexible_layers.map((layer_state) => layer_state.transform_value)).size, 5, 'All five distinct depths move independently.');
  const flexible_highlight = await read_highlight();
  assert.ok(flexible_highlight.position_x > 10 && flexible_highlight.position_x < 551);
  assert.ok(flexible_highlight.position_y > 20 && flexible_highlight.position_y < 301);
  const preserved_matrix = await thumbnail_node.locator('[data-thumbnail-highlight]').evaluate((gradient_node) => {
    const gradient_matrix = gradient_node.gradientTransform.baseVal.consolidate().matrix;
    return [gradient_matrix.a, gradient_matrix.d];
  });
  assert.deepEqual(preserved_matrix, [450, 200], 'Retain authored radial ellipse.');
  await thumbnail_node.screenshot({ path: 'outputs/dynamic-thumbnails/flexible-preview.png' });
  await thumbnail_node.evaluate((thumbnail_element) => {
    Drupal.behaviors.jurenites_dynamic_thumbnail.detach(thumbnail_element, {}, 'unload');
    Drupal.behaviors.jurenites_dynamic_thumbnail.attach(thumbnail_element);
  });
  await page_instance.mouse.move(0, 0);
  await page_instance.waitForTimeout(100);
  assert.deepEqual(await read_highlight(), { position_x: 10, position_y: 20 }, 'Reattachment restores the same geometry.');
  await page_instance.goto('http://storybook.jurenites.local/iframe.html?id=molecules-dynamic-thumbnail--roundabout-preview&viewMode=story', { waitUntil: 'domcontentloaded' });
  await page_instance.locator('[data-dynamic-thumbnail] [data-thumbnail-highlight]').waitFor({ state: 'attached' });
  assert.equal(await page_instance.locator('[data-thumbnail-depth]').count(), 3);
  assert.deepEqual(runtime_errors, []);
  console.log('PASS: four artworks, proportions, depth, hover-only layers and gradient, viscous tracking and return, reduced motion, mobile, Storybook, no inline styles or JS errors.');
} finally {
  await browser_instance.close();
}
