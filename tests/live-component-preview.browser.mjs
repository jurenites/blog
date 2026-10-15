import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch({ headless: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
  page_instance.setDefaultTimeout(30000);
  await page_instance.route('**/api/status', async route_context => {
    const status_response = await route_context.fetch();
    const status_payload = await status_response.json();
    await route_context.fulfill({ response: status_response, json: { ...status_payload, workspaces: {} } });
  });
  await page_instance.route('**/api/workspace', route_context => route_context.fulfill({ json: route_context.request().postDataJSON().workspace_patch }));
  await page_instance.goto('http://test.jurenites.local/#atoms-button');
  const example_rows = page_instance.locator('#website-examples > fieldset');
  await example_rows.first().waitFor();
  assert.equal(await example_rows.count(), 3);
  assert.equal(await example_rows.locator('.visual-review__web-live').count(), 3);
  assert.equal(await example_rows.locator('.visual-review__web-live summary').count(), 0);
  for (const example_row of await example_rows.all()) {
    const target_component = example_row.frameLocator('iframe').locator('[data-component-preview-target]');
    await target_component.waitFor({ state: 'visible' });
    await page_instance.waitForFunction(example_id => document.querySelector(`[data-example-id="${example_id}"] [data-web-preview-message]`).textContent === '', await example_row.getAttribute('data-example-id'));
    const component_bounds = await target_component.boundingBox();
    const viewport_bounds = await example_row.locator('[data-web-preview-columns]').boundingBox();
    assert.ok(component_bounds.width > 0 && component_bounds.height > 0);
    assert.ok(viewport_bounds.width >= component_bounds.width && viewport_bounds.width < component_bounds.width + 8);
    assert.ok(viewport_bounds.height >= component_bounds.height && viewport_bounds.height < component_bounds.height + 8);
    const preview_frame = example_row.locator('iframe');
    assert.equal(await preview_frame.getAttribute('style'), null);
    const source_url = new URL(await preview_frame.getAttribute('src'));
    assert.equal(source_url.searchParams.get('jurenites_component_preview'), await example_row.locator('[data-example-field="component_selector"]').inputValue());
    assert.equal((await example_row.frameLocator('iframe').locator('body').innerText()).trim(), (await target_component.innerText()).trim());
    assert.deepEqual(await target_component.evaluate(component_element => { const target_bounds = component_element.getBoundingClientRect(); return { position_x: target_bounds.x, position_y: target_bounds.y }; }), { position_x: 0, position_y: 0 });
    await target_component.hover();
    await target_component.focus();
  }
  const original_sources = await example_rows.locator('iframe').evaluateAll(frame_rows => frame_rows.map(frame_element => frame_element.src));
  const first_example = example_rows.first();
  const selector_input = first_example.locator('[data-example-field="component_selector"]');
  const original_selector = await selector_input.inputValue();
  await selector_input.fill('.missing-component-preview');
  await selector_input.dispatchEvent('change');
  await page_instance.waitForFunction(() => document.querySelector('[data-web-preview-message]').textContent === 'The selector must match exactly one component.');
  assert.equal(await first_example.locator('[data-web-preview-columns]').isVisible(), false);
  assert.deepEqual((await example_rows.locator('iframe').evaluateAll(frame_rows => frame_rows.map(frame_element => frame_element.src))).slice(1), original_sources.slice(1), 'Other examples do not reload');
  assert.equal(await example_rows.nth(1).locator('[data-web-preview-columns]').isVisible(), true);
  await selector_input.fill(original_selector);
  await selector_input.dispatchEvent('change');
  await page_instance.waitForFunction(() => document.querySelector('[data-web-preview-message]').textContent === '');
  await page_instance.locator('#website-add-example').click();
  assert.equal(await example_rows.count(), 4);
  assert.equal(await example_rows.last().locator('[data-web-preview-message]').innerText(), 'Add a page URL and component selector.');
  assert.equal(await example_rows.last().locator('[data-example-field="page_url"]').evaluate(input_element => input_element === document.activeElement), true);
  await example_rows.nth(1).locator('[data-remove-example]').click();
  assert.equal(await example_rows.count(), 3);
  assert.equal(await example_rows.nth(1).locator('iframe').getAttribute('src'), original_sources[2]);
  assert.equal(await example_rows.nth(1).locator('iframe').getAttribute('title'), 'Website example 2 live preview');
  await example_rows.last().locator('[data-remove-example]').click();
  for (const viewport_width of [1440, 390]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    for (const example_row of await example_rows.all()) {
      const input_bounds = await example_row.locator('[data-example-field="page_url"]').boundingBox();
      const button_bounds = await example_row.locator('[data-remove-example]').boundingBox();
      assert.equal(button_bounds.width, 40);
      assert.equal(button_bounds.height, 40);
      assert.ok(Math.abs(input_bounds.y + input_bounds.height - button_bounds.y - button_bounds.height) < 1, 'Delete button aligns with URL input');
      assert.ok(button_bounds.x >= input_bounds.x + input_bounds.width, 'Delete button sits beside URL input');
    }
    assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `No page overflow at ${viewport_width}px`);
  }
  console.log('Per-example Live web: automatic previews, independent updates/errors, add/remove, focus and responsive URL-row alignment verified.');
} finally {
  await browser_instance.close();
}
