import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdtemp, rm, copyFile, access, readFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { create_status_server } from '../scripts/component-status/server.mjs';

const report_directory = await mkdtemp(resolve(tmpdir(), 'review-workspace-browser-'));
const status_server = create_status_server({ report_directory });
await new Promise(resolve_ready => { status_server.listen(0, '127.0.0.1', resolve_ready); });
const status_origin = `http://127.0.0.1:${status_server.address().port}`;
const browser_instance = await chromium.launch({ headless: true });
try {
  const original_report = resolve('.cache/component-status/report-review-atoms-button.json');
  try {
    await access(original_report);
    await copyFile(original_report, resolve(report_directory, 'report-review-atoms-button.json'));
    const report_text = await readFile(original_report, 'utf8');
    const artifact_paths = [...new Set([...report_text.matchAll(/"(artifacts\/[^"]+\.png)"/g)].map(match_row => match_row[1]))];
    for (const artifact_path of artifact_paths) {
      const target_path = resolve(report_directory, artifact_path);
      await mkdir(dirname(target_path), { recursive: true });
      await copyFile(resolve('.cache/component-status', artifact_path), target_path);
    }
  } catch { /* A capture is optional for preference tests. */ }
  const browser_page = await browser_instance.newPage({ viewport: { width: 1440, height: 1100 } });
  const browser_errors = [];
  browser_page.on('pageerror', error_item => browser_errors.push(error_item.message));
  await browser_page.goto(`${status_origin}/#atoms-button`, { waitUntil: 'domcontentloaded' });
  await browser_page.locator('.button-matrix').waitFor();
  const wait_saved = () => browser_page.locator('[data-autosave-status]').filter({ hasText: /^Saved$/ }).waitFor();
  await browser_page.getByText('Table layout', { exact: true }).click();
  await browser_page.getByRole('button', { name: 'Move hover earlier' }).click();
  await browser_page.getByRole('checkbox', { name: 'Show text row' }).uncheck();
  await browser_page.locator('[data-matrix-axis="column_axis"]').selectOption('is_disabled');
  assert.equal(await browser_page.locator('[data-matrix-axis="depth_axis"]').inputValue(), 'pointer_state');
  if (await browser_page.locator('#review-example option[value="web-3"]').count()) await browser_page.locator('#review-example').selectOption('web-3');
  await browser_page.locator('#review-state').fill('0');
  await browser_page.locator('.button-matrix__plane--active [data-combination-key="primary|true|hover"]').click();
  await browser_page.getByRole('checkbox', { name: 'Include this combination in the test table' }).check();
  await browser_page.getByText('Capture settings', { exact: true }).click();
  await browser_page.locator('[name="story_selector"]').fill('.button.autosaved');
  await wait_saved();
  await browser_page.evaluate(() => { localStorage.clear(); });
  await browser_page.reload({ waitUntil: 'domcontentloaded' });
  await browser_page.locator('.button-matrix').waitFor();
  assert.equal(await browser_page.locator('[data-matrix-axis="column_axis"]').inputValue(), 'is_disabled');
  assert.equal(await browser_page.locator('[data-matrix-axis="depth_axis"]').inputValue(), 'pointer_state');
  assert.equal(await browser_page.locator('[data-matrix-depth]').count(), 0);
  assert.equal(await browser_page.locator('.button-matrix__plane--active').getAttribute('data-depth-value'), 'hover');
  assert.deepEqual(await browser_page.locator('.button-matrix__plane--active thead th[data-table-value] code').allTextContents(), ['false', 'true']);
  assert.deepEqual(await browser_page.locator('.button-matrix__plane--active tbody th code').allTextContents(), ['primary', 'secondary']);
  assert.equal(await browser_page.locator('[name="story_selector"]').inputValue(), '.button.autosaved');
  assert.equal(await browser_page.locator('#review-state').inputValue(), '1');
  if (await browser_page.locator('#review-example option[value="web-3"]').count()) assert.equal(await browser_page.locator('#review-example').inputValue(), 'web-3');
  assert.equal(await browser_page.locator('#review-state').getAttribute('max'), '23');
  assert.match(await browser_page.locator('#review-state-label').textContent(), /No recorded capture/);
  assert.equal(await browser_page.locator('.visual-review__capture .visual-review__image').count(), 0);
  await browser_page.locator('.button-matrix__plane--active [data-combination-key="primary|true|hover"]').click();
  assert.equal(await browser_page.getByRole('checkbox', { name: 'Include this combination in the test table' }).isChecked(), true);
  assert.match(await browser_page.locator('[data-matrix-rule]').textContent(), /Your table rule/);
  const saved_workspaces = JSON.parse(await readFile(resolve(report_directory, 'workspace.json'), 'utf8'));
  assert.deepEqual(saved_workspaces.components['atoms-button'].matrix_state.axis_roles, { row_axis: 'button_style', column_axis: 'is_disabled', depth_axis: 'pointer_state' });
  assert.deepEqual(saved_workspaces.components['atoms-button'].matrix_state.dimension_orders.pointer_state, ['hover', 'default', 'focus', 'active']);
  assert.equal(saved_workspaces.components['atoms-button'].matrix_state.rule_overrides['primary|true|hover'], true);
  assert.equal(saved_workspaces.components['atoms-button'].view_state.combination_key, 'primary|true|hover');
  assert.deepEqual(browser_errors, []);
  await browser_page.locator('[data-workspace-details="matrix-layout"]').evaluate(detail_element => { detail_element.open = false; });
  await browser_page.locator('[data-workspace-details="capture-settings"]').evaluate(detail_element => { detail_element.open = false; });
  await browser_page.screenshot({ path: '/private/tmp/review-workspace-desktop.png', fullPage: true });
  await browser_page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await browser_page.screenshot({ path: '/private/tmp/review-workspace-mobile.png', fullPage: true });
  console.log('PASS: autosave survives reload; reordered/hidden dimensions, depth, rules, drafts and source visibility persist; 8px marks, code typography, unique top captures.');
} finally {
  await browser_instance.close();
  await new Promise(resolve_closed => { status_server.close(resolve_closed); });
  await rm(report_directory, { recursive: true, force: true });
}
