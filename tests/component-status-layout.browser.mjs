import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const dashboard_origin = process.env.STATUS_DASHBOARD_URL ?? 'http://127.0.0.1:7779';
const browser_instance = await chromium.launch({ headless: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1920, height: 1080 } });
  const page_errors = [];
  page_instance.on('pageerror', (page_error) => page_errors.push(page_error.message));
  await page_instance.goto(`${dashboard_origin}/#organisms-top-nav-menu-site-header`);
  await page_instance.locator('#review-state').waitFor();
  assert.equal(await page_instance.locator('[data-component-id]').count(), 66);
  assert.equal(await page_instance.locator('#catalogue-count').textContent(), '66 of 66 components');
  assert.equal(await page_instance.locator('[data-component-id^="foundations-"]').count(), 0);
  assert.equal(await page_instance.locator('[aria-current="page"]').getAttribute('data-component-id'), 'organisms-top-nav-menu-site-header');
  await page_instance.locator('#component-search').fill('top nav');
  assert.equal(await page_instance.locator('[data-component-id]').count(), 1);
  await page_instance.getByRole('button', { name: 'Show all', exact: true }).click();
  assert.equal(await page_instance.locator('[data-component-id]').count(), 66);
  await page_instance.locator('#component-search').fill('no matching component');
  assert.equal(await page_instance.locator('#empty-results').isVisible(), true);
  await page_instance.getByRole('button', { name: 'Show all', exact: true }).click();
  await page_instance.locator('[data-component-id="atoms-badge"]').click();
  await page_instance.getByRole('heading', { name: 'Badge', exact: true }).waitFor();
  assert.match(await page_instance.locator('[data-image-source="figma"]').textContent(), /Missing reference/);
  assert.match(await page_instance.locator('[data-image-source="drupal"]').textContent(), /Missing page mapping/);
  assert.equal(await page_instance.locator('#visual-review-form').isVisible(), true);

  // Controlled image widths exercise layout independently of real capture dimensions.
  const response_data = await page_instance.request.get(`${dashboard_origin}/api/status`);
  const fixture_report = await response_data.json();
  const header_component = fixture_report.components.find((component_item) => component_item.component_id === 'organisms-top-nav-menu-site-header');
  const integration_check = header_component.checks.find((check_item) => check_item.check_key === 'integration');
  const first_state = integration_check.details.visual_states[0];
  integration_check.details.visual_states = [80, 360, 1920].map((capture_width) => ({
    ...first_state, state_label: `Layout fixture ${capture_width}px`,
    images: Object.fromEntries(['figma', 'storybook', 'drupal'].map((source_name) => [source_name, `layout-fixture/${capture_width}.png`])),
  }));
  await page_instance.route('**/api/status', (route_request) => route_request.fulfill({ json: fixture_report }));
  await page_instance.route('**/layout-fixture/*.png', (route_request) => {
    const capture_width = Number(new URL(route_request.request().url()).pathname.match(/(\d+)\.png$/)[1]);
    const image_data = new PNG({ width: capture_width, height: 130 });
    return route_request.fulfill({ contentType: 'image/png', body: PNG.sync.write(image_data) });
  });
  await page_instance.goto(`${dashboard_origin}/#organisms-top-nav-menu-site-header`);
  await page_instance.locator('#review-state').waitFor();
  await page_instance.reload();
  await page_instance.locator('#review-state').waitFor();
  for (const [viewport_width, state_value, expected_width, expected_layout] of [
    [1920, '0', 80, 'Side by side'], [1920, '1', 360, 'Side by side'],
    [1920, '2', 1920, 'Stacked rows'], [390, '0', 80, 'Side by side'],
    [390, '1', 360, 'Stacked rows'], [390, '2', 1920, 'Stacked rows'],
    [1920, '0', 80, 'Side by side'],
  ]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1080 });
    await page_instance.locator('#review-state').selectOption(state_value);
    await page_instance.locator('.visual-review__three-up img').evaluateAll((image_items) => Promise.all(image_items.map((image_item) => image_item.decode())));
    await page_instance.waitForFunction((layout_label) => document.querySelector('#capture-layout-label').textContent === layout_label, expected_layout);
    const image_bounds = await page_instance.locator('.visual-review__three-up img').evaluateAll((image_items) => image_items.map((image_item) => ({
      image_width: image_item.getBoundingClientRect().width,
      image_top: image_item.getBoundingClientRect().top,
      image_left: image_item.getBoundingClientRect().left,
    })));
    assert.deepEqual(image_bounds.map((image_item) => image_item.image_width), [expected_width, expected_width, expected_width]);
    if (expected_layout === 'Side by side') {
      assert.equal(new Set(image_bounds.map((image_item) => image_item.image_top)).size, 1);
      assert.ok(image_bounds[0].image_left < image_bounds[1].image_left && image_bounds[1].image_left < image_bounds[2].image_left);
    } else {
      assert.equal(new Set(image_bounds.map((image_item) => image_item.image_left)).size, 1);
      assert.ok(image_bounds[0].image_top < image_bounds[1].image_top && image_bounds[1].image_top < image_bounds[2].image_top);
    }
    assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  }
  assert.deepEqual(page_errors, []);
  console.log('66 components, filtering/reset, selected component, missing references, 80/360/1920px native sizing, automatic columns/rows and mobile overflow passed.');
} finally {
  await browser_instance.close();
}
