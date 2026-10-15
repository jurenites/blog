import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { create_status_server } from '../scripts/component-status/server.mjs';
const status_server = create_status_server();
await new Promise(resolve_listen => { status_server.listen(0, '127.0.0.1', resolve_listen); });
const status_origin = `http://127.0.0.1:${status_server.address().port}`;
const browser_instance = await chromium.launch({ headless: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
  let workspace_state = {};
  await page_instance.route('**/api/status', async route_context => {
    const status_response = await route_context.fetch();
    const status_payload = await status_response.json();
    await route_context.fulfill({ response: status_response, json: { ...status_payload, workspaces: { 'atoms-button': workspace_state } } });
  });
  await page_instance.route('**/api/workspace', async route_context => {
    const workspace_patch = route_context.request().postDataJSON().workspace_patch;
    workspace_state = { ...workspace_state, ...workspace_patch, draft_case: { ...workspace_state.draft_case, ...workspace_patch.draft_case }, updated_at: new Date().toISOString() };
    await route_context.fulfill({ json: workspace_state });
  });
  await page_instance.goto(`${status_origin}/#atoms-button`);
  assert.equal(await page_instance.locator('.visual-review__figma-overview-image').count(), 0);
  assert.equal(await page_instance.locator('.visual-review__figma-canvas').count(), 0);
  const figma_disclosure = page_instance.locator('.visual-review__figma-live');
  await figma_disclosure.locator('summary').click();
  for (const viewport_width of [1440, 1700, 390]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    const wrapper_bounds = await figma_disclosure.boundingBox();
    const iframe_bounds = await figma_disclosure.locator('iframe').boundingBox();
    assert.ok(iframe_bounds.width <= wrapper_bounds.width + 1);
    assert.equal(await figma_disclosure.locator('.visual-review__figma-frame-scroll').evaluate(scroll_element => scroll_element.scrollWidth <= scroll_element.clientWidth), true);
  }
  await page_instance.setViewportSize({ width: 1440, height: 1000 });
  const live_figma_url = new URL(await page_instance.locator('.visual-review__figma-frame').getAttribute('src'));
  assert.equal(live_figma_url.searchParams.get('viewport-controls'), 'true');
  const reference_capture = page_instance.locator('[data-image-source="figma"] .visual-review__capture');
  const original_source = await reference_capture.locator('img').getAttribute('src');
  assert.equal(await page_instance.locator('input[type="checkbox"][name="remove_baseline"]').count(), 0);
  const remove_button = page_instance.locator('[data-image-source="figma"] .visual-review__source-heading [data-remove-figma-png]');
  const refresh_button = page_instance.locator('[data-obtain-figma-png]');
  const upload_button = page_instance.locator('[data-upload-figma-png]');
  assert.equal(await upload_button.isVisible(), false);
  assert.equal(await refresh_button.isVisible(), false);
  assert.equal(await page_instance.locator('[data-obtain-figma-png] [data-icon-name="arrow-refresh"]').count(), 1);
  assert.equal((await page_instance.locator('[data-obtain-figma-png]').innerText()).trim(), '');
  assert.equal(await remove_button.locator('[data-icon-name="cross-big"]').count(), 1);
  assert.equal(await remove_button.isVisible(), true);
  assert.equal(await remove_button.evaluate(button_element => button_element === button_element.parentElement.lastElementChild), true);
  assert.equal((await remove_button.boundingBox()).width, 40);
  await remove_button.click();
  assert.equal(await reference_capture.locator('img').count(), 0);
  assert.equal(await upload_button.isVisible(), true);
  assert.equal(await refresh_button.isVisible(), true);
  assert.equal((await reference_capture.innerText()).trim(), 'N/A');
  assert.equal(await upload_button.locator('[data-icon-name="arrow-upload"]').count(), 1);
  assert.equal(await remove_button.isVisible(), false);
  await page_instance.reload();
  await reference_capture.waitFor();
  assert.equal(await reference_capture.locator('img').count(), 0, 'Removed image stays removed after reload');
  const file_chooser_wait = page_instance.waitForEvent('filechooser');
  await upload_button.click();
  const file_chooser = await file_chooser_wait;
  await file_chooser.setFiles('tests/visual-baselines/manual-atoms/button.png');
  await reference_capture.locator('img').waitFor();
  assert.equal(await upload_button.isVisible(), false);
  assert.equal(await refresh_button.isVisible(), false);
  await remove_button.click();
  assert.equal(await upload_button.isVisible(), true);
  assert.equal(await refresh_button.isVisible(), true);
  assert.equal((await reference_capture.innerText()).trim(), 'N/A');
  await page_instance.route('**/api/figma-reference', async route_context => {
    const request_data = route_context.request().postDataJSON();
    assert.equal(request_data.component_id, 'atoms-button');
    assert.ok(new URL(request_data.figma_url).searchParams.get('node-id'));
    workspace_state.draft_case = { ...workspace_state.draft_case, remove_baseline: false, figma_baseline: original_source.slice(1) };
    await route_context.fulfill({ json: workspace_state });
  });
  await page_instance.locator('[data-obtain-figma-png]').click();
  await reference_capture.locator('img').waitFor();
  assert.equal(await reference_capture.locator('img').getAttribute('src'), original_source);
  assert.equal(await upload_button.isVisible(), false);
  assert.equal(await refresh_button.isVisible(), false);
  await remove_button.focus();
  assert.equal(await remove_button.evaluate(button_element => getComputedStyle(button_element).opacity), '1');
  console.log('PASS: heading X and upload/refresh icon controls, immediate persistent removal and obtain-PNG restoration.');
} finally {
  await browser_instance.close();
  await new Promise(resolve_close => { status_server.close(resolve_close); });
}
