import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { mkdir } from 'node:fs/promises';

const dashboard_origin = process.env.STATUS_DASHBOARD_URL ?? 'http://127.0.0.1:7779';
const image_buffer = PNG.sync.write(new PNG({ width: 2, height: 2 }));
const browser_instance = await chromium.launch({ headless: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1280, height: 900 } });
  const page_errors = [];
  page_instance.on('pageerror', (page_error) => page_errors.push(page_error.message));
  async function drop_file(file_name, file_type = 'image/png', target_selector = '.file-input__drop-zone') {
    const transfer_handle = await page_instance.evaluateHandle(({ file_name, file_type, file_bytes }) => {
      const transfer_data = new DataTransfer();
      transfer_data.items.add(new File([new Uint8Array(file_bytes)], file_name, { type: file_type }));
      return transfer_data;
    }, { file_name, file_type, file_bytes: [...image_buffer] });
    await page_instance.locator(target_selector).dispatchEvent('drop', { dataTransfer: transfer_handle });
    await transfer_handle.dispose();
  }
  async function check_geometry() {
    const button_bounds = await page_instance.locator('.file-input__choose').boundingBox();
    const drop_bounds = await page_instance.locator('.file-input__drop-zone').boundingBox();
    const content_bounds = await page_instance.locator('.file-input__drop-content').boundingBox();
    assert.equal(button_bounds.height, 40);
    assert.equal(await page_instance.locator('.file-input__drop-zone > .file-input__choose').count(), 1);
    assert.equal(content_bounds.x, button_bounds.x + button_bounds.width);
    assert.equal(await page_instance.locator('.file-input__drop-content').evaluate(content_element => getComputedStyle(content_element).borderLeftWidth), '0px');
    assert.ok(drop_bounds.width <= 400);
    if (page_instance.viewportSize().width === 1280) assert.equal(drop_bounds.width, 400);
    assert.equal((await page_instance.locator('.file-input__drop-zone').boundingBox()).height, 40);
    assert.equal(await page_instance.locator('.file-input__choose').getAttribute('type'), 'button');
    assert.match(await page_instance.locator('.file-input__choose').getAttribute('class'), /button--secondary/);
  }
  await page_instance.goto(`${dashboard_origin}/storybook/iframe.html?id=molecules-input-fields-file-input--default-story&viewMode=story`);
  await page_instance.locator('.file-input--enhanced').waitFor();
  await check_geometry();
  const chooser_promise = page_instance.waitForEvent('filechooser');
  await page_instance.locator('.file-input__choose').focus();
  await page_instance.locator('.file-input__choose').press('Enter');
  const file_chooser = await chooser_promise;
  await file_chooser.setFiles({ name: 'chosen-reference.png', mimeType: 'image/png', buffer: image_buffer });
  assert.equal(await page_instance.locator('.file-input__filename').textContent(), 'chosen-reference.png');
  await drop_file('dropped-reference.png', 'image/png', '.file-input__choose');
  assert.equal(await page_instance.locator('.file-input__native').evaluate(input_element => input_element.files[0].name), 'dropped-reference.png');
  await drop_file('not-a-png.txt', 'text/plain');
  assert.equal(await page_instance.locator('.file-input__error').isVisible(), true);
  assert.equal(await page_instance.locator('.file-input__native').evaluate(input_element => input_element.files[0].name), 'dropped-reference.png');
  await drop_file('replacement.png');
  assert.equal(await page_instance.locator('.file-input__error').isVisible(), false);
  await page_instance.setViewportSize({ width: 390, height: 844 });
  await check_geometry();
  assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await mkdir('.cache/component-status/artifacts/browser-qa', { recursive: true });
  await page_instance.locator('.file-input').screenshot({ path: '.cache/component-status/artifacts/browser-qa/file-input-storybook.png' });
  await page_instance.goto(`${dashboard_origin}/storybook/iframe.html?id=molecules-input-fields-file-input--default-story&viewMode=story&args=is_disabled:true`);
  await page_instance.locator('.file-input--disabled').waitFor();
  assert.equal(await page_instance.locator('.file-input__choose').isDisabled(), true);
  await drop_file('disabled.png');
  assert.equal(await page_instance.locator('.file-input__native').evaluate(input_element => input_element.files.length), 0);

  await page_instance.goto(`${dashboard_origin}/#atoms-badge`);
  await page_instance.locator('.file-input--enhanced').waitFor();
  await check_geometry();
  await drop_file('figma-reference.png');
  assert.equal(await page_instance.locator('#visual-review-form').evaluate(form_element => new FormData(form_element).get('figma_png').name), 'figma-reference.png');
  assert.equal(await page_instance.locator('#visual-review-form').evaluate(form_element => new FormData(form_element).get('figma_png').size), image_buffer.length);
  await page_instance.locator('#visual-review-form').evaluate(form_element => form_element.reset());
  assert.equal(await page_instance.locator('.file-input__filename').textContent(), 'Drop a PNG here');
  assert.equal(await page_instance.locator('.file-input__native').evaluate(input_element => input_element.files.length), 0);
  assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  await page_instance.locator('.file-input').screenshot({ path: '.cache/component-status/artifacts/browser-qa/file-input-dashboard.png' });
  assert.deepEqual(page_errors, []);
  console.log('File Input: shared secondary button and drop area at 40px, keyboard chooser, drag/drop, type errors, replacement, disabled state, form payload/reset and mobile width passed.');
} finally { await browser_instance.close(); }
