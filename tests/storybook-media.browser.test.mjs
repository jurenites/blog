import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium as chromium_browser } from 'playwright';
import * as sass_compiler from 'sass';

const FALLBACK_SOURCE = (await readFile('.storybook/media-fallback.js', 'utf8')).replace('export function', 'function');
const STORYBOOK_STYLES = sass_compiler.compile('src/styles/storybook.scss').css;
const TOKEN_STYLES = await readFile('generated/storybook/storybook-tokens.css', 'utf8');
const VALID_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 18"><rect width="32" height="18" fill="white"/></svg>')}`;

test('Storybook media failures show an animated accessible fallback and recover', async (test_context) => {
  const browser_instance = await chromium_browser.launch();
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage();
  await browser_page.route('https://media.test/**', (route_request) => route_request.fulfill({ status: 404, body: 'Missing' }));
  await browser_page.setContent(`<style>${TOKEN_STYLES}\n${STORYBOOK_STYLES}</style><main></main>`);
  await browser_page.addScriptTag({ content: `${FALLBACK_SOURCE}\ninstall_media_fallback();` });
  await browser_page.locator('main').evaluate((main_element) => {
    main_element.innerHTML = '<img src="https://media.test/photo.jpg" alt="Sample photo"><video src="https://media.test/recording.mov" aria-label="Sample recording"></video>';
  });
  await browser_page.waitForFunction(() => document.querySelectorAll('.storybook-media-fallback').length === 2);
  assert.equal(await browser_page.locator('img').isVisible(), false);
  assert.equal(await browser_page.locator('video').isVisible(), false);
  assert.equal(await browser_page.getByRole('img', { name: 'Sample photo' }).count(), 1);
  assert.equal(await browser_page.locator('.storybook-media-fallback').first().evaluate((surface_element) => getComputedStyle(surface_element).animationName), 'storybook-media-shadow');
  await browser_page.screenshot({ path: 'artifacts/storybook-media-fallback.png' });
  await browser_page.emulateMedia({ reducedMotion: 'reduce' });
  assert.equal(await browser_page.locator('.storybook-media-fallback').first().evaluate((surface_element) => getComputedStyle(surface_element).animationName), 'none');
  await browser_page.locator('img').evaluate((image_element, valid_source) => { image_element.src = valid_source; }, VALID_IMAGE);
  await browser_page.waitForFunction(() => document.querySelectorAll('.storybook-media-fallback').length === 1);
  assert.equal(await browser_page.locator('img').isVisible(), true);
  await browser_page.locator('img').evaluate((image_element) => { image_element.src = 'https://media.test/again.gif'; });
  await browser_page.waitForFunction(() => document.querySelectorAll('.storybook-media-fallback').length === 2);
});

test('built Media Loader image, GIF and video examples load successfully', async (test_context) => {
  const { createServer: create_server } = await import('node:http');
  const { resolve: resolve_path, extname: file_extension } = await import('node:path');
  const content_types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4' };
  const asset_server = create_server(async (request_message, response_message) => {
    try {
      const asset_path = resolve_path('storybook-static', `.${new URL(request_message.url, 'http://localhost').pathname}`);
      const asset_bytes = await readFile(asset_path);
      response_message.writeHead(200, { 'Content-Type': content_types[file_extension(asset_path)] || 'application/octet-stream' });
      response_message.end(asset_bytes);
    } catch {
      response_message.writeHead(404).end();
    }
  });
  await new Promise((resolve_server) => { asset_server.listen(0, '127.0.0.1', resolve_server); });
  test_context.after(() => asset_server.close());
  const browser_instance = await chromium_browser.launch();
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage({ viewport: { width: 960, height: 640 } });
  for (const story_name of ['default-story', 'animated-image', 'video-file']) {
    await browser_page.goto(`http://127.0.0.1:${asset_server.address().port}/iframe.html?id=molecules-media-loader--${story_name}&args=simulated_load_duration_ms:1000`);
    await browser_page.waitForSelector('.media-loader[data-loading-stage="complete"]', { timeout: 20000 });
    const media_success = await browser_page.locator('.media-loader__content img, .media-loader__content video').evaluate((media_element) => media_element.naturalWidth > 0 || media_element.readyState >= 2);
    assert.equal(media_success, true, story_name);
    assert.equal(await browser_page.locator('.storybook-media-fallback').count(), 0);
    await browser_page.screenshot({ path: `artifacts/storybook-media-${story_name}.png` });
  }
  await browser_page.route('**/assets/images/storybook/dsc_0001.webp', (route_request) => route_request.fulfill({ status: 404, body: 'Missing' }));
  await browser_page.goto(`http://127.0.0.1:${asset_server.address().port}/iframe.html?id=molecules-media-loader--default-story&args=simulated_load_duration_ms:1000`);
  await browser_page.waitForSelector('.media-loader[data-loading-stage="error"]');
  assert.equal(await browser_page.locator('.media-loader__content').evaluate((media_element) => getComputedStyle(media_element).filter), 'opacity(0)');
  await browser_page.screenshot({ path: 'artifacts/storybook-media-loader-error.png' });
});
