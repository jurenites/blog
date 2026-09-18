import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { create_status_server, REPORT_DIRECTORY } from '../scripts/component-status/server.mjs';
const STATUS_SERVER = create_status_server();
await new Promise((resolve_listen) => { STATUS_SERVER.listen(0, '127.0.0.1', resolve_listen); });
const STATUS_ORIGIN = `http://127.0.0.1:${STATUS_SERVER.address().port}`;
const BROWSER_INSTANCE = await chromium.launch({ headless: true });
try {
  const page_instance = await BROWSER_INSTANCE.newPage({ viewport: { width: 1440, height: 1100 } });
  const browser_errors = [];
  page_instance.on('pageerror', (page_error) => browser_errors.push(page_error.message));
  await page_instance.goto(`${STATUS_ORIGIN}/#organisms-font-preview-4pixel`);
  await page_instance.locator('#visual-review-form').waitFor({ state: 'attached' });
  if (!await page_instance.locator('#visual-review-form').isVisible()) await page_instance.getByText('Source mapping & capture settings', { exact: true }).click();
  assert.match(await page_instance.locator('[name="drupal_url"]').inputValue(), /portfolio\/my-first-font/);
  await page_instance.locator('[name="inputs_matched"]').uncheck();
  await page_instance.getByRole('button', { name: 'Capture and compare' }).click();
  await page_instance.waitForFunction(() => document.querySelector('#visual-review-message')?.textContent.includes('Capture finished'), null, { timeout: 150000 });
  const capture_images = page_instance.locator('.visual-review__three-up img');
  assert.equal(await capture_images.count(), 2, await page_instance.locator('#component-details').innerText());
  assert.match(await page_instance.locator('.visual-review__empty').innerText(), /Missing/);
  await page_instance.getByText('Overlay and differences', { exact: true }).click();
  await page_instance.locator('#comparison-mode').selectOption('wipe');
  await page_instance.getByRole('button', { name: 'Toggle layer' }).click();
  await page_instance.locator('#comparison-mode').selectOption('difference');
  assert.match(await page_instance.locator('#comparison-message').innerText(), /pixels|dimensions/);
  await page_instance.locator('.visual-review__three-up').scrollIntoViewIfNeeded();
  await mkdir(`${REPORT_DIRECTORY}/artifacts/browser-qa`, { recursive: true });
  await page_instance.screenshot({ path: `${REPORT_DIRECTORY}/artifacts/browser-qa/three-way-review.png` });
  await page_instance.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  assert.deepEqual(browser_errors, []);
  console.log('PASS: real Drupal and Storybook captures, missing Figma, overlay controls, and mobile page width.');
} finally {
  await BROWSER_INSTANCE.close();
  await new Promise((resolve_close) => { STATUS_SERVER.close(resolve_close); });
}
