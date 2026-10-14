import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { create_status_server } from '../scripts/component-status/server.mjs';
const status_server = create_status_server();
await new Promise(resolve_listen => { status_server.listen(0, '127.0.0.1', resolve_listen); });
const status_origin = `http://127.0.0.1:${status_server.address().port}`;
const browser_instance = await chromium.launch({ headless: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
  await page_instance.route('**/api/status', async route_context => {
    const status_response = await route_context.fetch();
    const status_payload = await status_response.json();
    await route_context.fulfill({ response: status_response, json: { ...status_payload, workspaces: {} } });
  });
  await page_instance.route('**/api/workspace', route_context => route_context.fulfill({ json: route_context.request().postDataJSON().workspace_patch }));
  await page_instance.goto(`${status_origin}/#atoms-button`);
  const preview_frame = page_instance.locator('.visual-review__story-frame');
  const story_canvas = page_instance.frameLocator('.visual-review__story-frame');
  const component_buttons = story_canvas.locator('.button-combination-preview .button');
  await component_buttons.nth(5).waitFor();
  assert.equal(await component_buttons.count(), 6);
  assert.equal(await story_canvas.locator('.button-combination-preview .button:disabled').count(), 3);
  const combination_rows = await component_buttons.evaluateAll(button_rows => button_rows.map(button_element => ({ style_name: button_element.classList.contains('button--ghost') ? 'text' : button_element.classList.contains('button--secondary') ? 'secondary' : 'primary', is_disabled: button_element.disabled, position_y: button_element.getBoundingClientRect().y })));
  assert.deepEqual(combination_rows.map(({ style_name, is_disabled }) => [style_name, is_disabled]), [['primary', false], ['primary', true], ['secondary', false], ['secondary', true], ['text', false], ['text', true]]);
  assert.ok(combination_rows.every((row_values, row_index) => row_index === 0 || row_values.position_y > combination_rows[row_index - 1].position_y));
  assert.equal(await page_instance.locator('[data-image-source="storybook"] .visual-review__capture').isVisible(), false);
  await page_instance.waitForFunction(() => Number(document.querySelector('.visual-review__story-viewport').dataset.webPreviewColumns) < 40);
  const frame_bounds = await preview_frame.boundingBox();
  const viewport_bounds = await page_instance.locator('.visual-review__story-viewport').boundingBox();
  assert.equal(frame_bounds.width, viewport_bounds.width);
  assert.equal(frame_bounds.height, viewport_bounds.height);
  assert.ok(frame_bounds.width < 320);
  const original_url = await preview_frame.getAttribute('src');
  assert.equal(new URL(original_url).searchParams.get('preview_state'), null);
  await page_instance.locator('.visual-review').evaluate(review_element => review_element.dispatchEvent(new CustomEvent('button-combination-selected', { detail: { combination_key: 'text|false|hover' } })));
  assert.equal(await preview_frame.getAttribute('src'), original_url);
  assert.equal(await component_buttons.count(), 6);
  const disabled_button = component_buttons.nth(1);
  const disabled_color = await disabled_button.evaluate(button_element => getComputedStyle(button_element).backgroundColor);
  await disabled_button.hover();
  assert.equal(await disabled_button.evaluate(button_element => getComputedStyle(button_element).backgroundColor), disabled_color);
  const enabled_button = component_buttons.first();
  await page_instance.mouse.move(0, 0);
  const default_color = await enabled_button.evaluate(button_element => getComputedStyle(button_element).backgroundColor);
  await enabled_button.hover();
  await enabled_button.evaluate(async (button_element, previous_color) => {
    const deadline_time = Date.now() + 5000;
    while (getComputedStyle(button_element).backgroundColor === previous_color) {
      if (Date.now() > deadline_time) throw new Error('Enabled button did not respond to native hover');
      await new Promise(resolve_frame => { requestAnimationFrame(resolve_frame); });
    }
  }, default_color);
  assert.equal(await story_canvas.locator('[class*="pseudo-hover"]').count(), 0);
  await page_instance.locator('[data-preview-source="storybook"]').click();
  assert.equal(await page_instance.locator('.visual-review__story-live').isVisible(), false);
  await page_instance.locator('[data-preview-source="storybook"]').click();
  assert.equal(await page_instance.locator('.visual-review__story-live').isVisible(), true);
  console.log('PASS: six vertical Storybook combinations, natural enabled hover, disabled behavior and source visibility.');
} finally {
  await browser_instance.close();
  await new Promise(resolve_close => { status_server.close(resolve_close); });
}
