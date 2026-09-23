import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import { chromium as chromium_browser } from 'playwright';

const BUNDLE_SOURCE = (await build({
  stdin: { contents: "export * from './src/slice/src/js/loading-activity.js'; export * from './src/slice/src/js/asset-warming.js'; export * from './src/slice/src/js/progressive-photo.js';", resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife', globalName: 'WarmingRuntime',
})).outputFiles[0].text;
const IMAGE_SOURCE = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><path fill="gray" d="M0 0h640v400H0z"/></svg>';
const PHOTO_MARKUP = `<img alt="Future portrait" src="data:image/svg+xml,${encodeURIComponent(IMAGE_SOURCE)}"
  data-photo-stages='${JSON.stringify([96, 320, 640, 1280, 1920].map((image_width) => ({ image_width, image_url: `/photo-${image_width}.svg` })))}'>`;

async function create_fixture(test_context, { target_source = PHOTO_MARKUP, target_headers = {}, hold_image = false, slow_asset = false, target_status = 200, first_source = '', asset_bytes = 0 } = {}) {
  const request_paths = [];
  let release_image;
  let release_asset;
  let active_downloads = 0;
  let maximum_downloads = 0;
  const http_server = createServer((request_info, response_info) => {
    const request_path = request_info.url;
    request_paths.push(request_path);
    response_info.setHeader('Cache-Control', 'public, max-age=3600');
    if (request_path === '/bundle.js') {
      response_info.setHeader('Content-Type', 'application/javascript');
      response_info.end(BUNDLE_SOURCE);
    } else if (request_path.startsWith('/photo-') || request_path === '/current.svg') {
      active_downloads += 1;
      maximum_downloads = Math.max(maximum_downloads, active_downloads);
      response_info.once('close', () => { active_downloads -= 1; });
      response_info.setHeader('Content-Type', 'image/svg+xml');
      if (hold_image && request_path === '/current.svg') release_image = () => response_info.end(IMAGE_SOURCE);
      else if (slow_asset && request_path === '/photo-96.svg' && !release_asset) {
        response_info.write(IMAGE_SOURCE.slice(0, 20));
        release_asset = () => response_info.end(IMAGE_SOURCE.slice(20));
      } else response_info.end(asset_bytes ? IMAGE_SOURCE + ' '.repeat(asset_bytes) : IMAGE_SOURCE);
    } else {
      response_info.setHeader('Content-Type', 'text/html');
      if (request_path === '/next' || request_path === '/second') {
        response_info.writeHead(target_status, target_headers);
        response_info.end(`<html><body>${target_source}<script src="/bundle.js"></script><script>WarmingRuntime.initialize_progressive_photos()</script></body></html>`);
      } else {
        response_info.end(`<html><body>${first_source}${hold_image ? '<img src="/current.svg">' : ''}<nav class="site-header__navigation"><a href="/next">Next</a><a href="/second">Second</a><a href="/third">Third</a></nav><script src="/bundle.js"></script></body></html>`);
      }
    }
  });
  await new Promise((resolve_listen) => { http_server.listen(0, '127.0.0.1', resolve_listen); });
  const browser_instance = await chromium_browser.launch({ headless: true });
  test_context.after(async () => { await browser_instance.close(); http_server.closeAllConnections(); await new Promise((resolve_close) => { http_server.close(resolve_close); }); });
  const browser_page = await browser_instance.newPage({ viewport: { width: 700, height: 600 } });
  const page_errors = [];
  browser_page.on('pageerror', (error_info) => page_errors.push(error_info.message));
  test_context.after(() => assert.deepEqual(page_errors, []));
  const base_url = `http://127.0.0.1:${http_server.address().port}`;
  await browser_page.goto(base_url, { waitUntil: hold_image ? 'domcontentloaded' : 'load' });
  return { browser_page, base_url, request_paths, release_image: () => release_image(), release_asset: () => release_asset?.(), maximum_downloads: () => maximum_downloads };
}
async function install_queue(browser_page) {
  await browser_page.evaluate(() => {
    WarmingRuntime.install_asset_warming(window, document, async () => { window.catalog_finished = true; });
    WarmingRuntime.install_asset_warming();
  });
}
async function wait_for_asset(browser_page, asset_path) {
  await browser_page.waitForFunction((target_path) => performance.getEntriesByType('resource').some((resource_entry) => resource_entry.name.endsWith(target_path) && resource_entry.responseEnd > 0), asset_path);
}

// A real HTTP server is essential here: Playwright request interception disables HTTP caching.
test('queue downloads small stages first, serializes work, limits pages and reuses HTTP cache on navigation', async (test_context) => {
  const fixture_data = await create_fixture(test_context);
  await install_queue(fixture_data.browser_page);
  await wait_for_asset(fixture_data.browser_page, '/photo-640.svg');
  assert.equal(await fixture_data.browser_page.evaluate(() => window.catalog_finished), true);
  assert.deepEqual(fixture_data.request_paths.filter((request_path) => request_path.startsWith('/photo-')), ['/photo-96.svg', '/photo-320.svg', '/photo-640.svg']);
  assert.equal(fixture_data.maximum_downloads(), 1);
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path === '/next').length, 1);
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path === '/second').length, 1);
  assert.equal(fixture_data.request_paths.includes('/third'), false);
  await fixture_data.browser_page.goto(`${fixture_data.base_url}/next`);
  await fixture_data.browser_page.waitForFunction(() => document.querySelector('img').dataset.photoState === 'complete');
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path === '/photo-96.svg').length, 1, 'The first visible stage must reuse the warmed HTTP response.');
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path === '/photo-640.svg').length, 1);
  assert.equal(await fixture_data.browser_page.evaluate(() => performance.getEntriesByType('resource').find((resource_entry) => resource_entry.name.endsWith('/photo-96.svg')).transferSize), 0);
});

test('current-page media and interaction delay the catalog and speculation until quiet', async (test_context) => {
  const fixture_data = await create_fixture(test_context, { hold_image: true });
  await install_queue(fixture_data.browser_page);
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 1100); });
  assert.equal(fixture_data.request_paths.includes('/next'), false);
  assert.equal(await fixture_data.browser_page.evaluate(() => Boolean(window.catalog_finished)), false);
  fixture_data.release_image();
  await fixture_data.browser_page.waitForLoadState('load');
  await fixture_data.browser_page.evaluate(() => {
    const current_image = document.querySelector('img');
    current_image.dataset.photoLoading = 'true';
  });
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 1100); });
  assert.equal(await fixture_data.browser_page.evaluate(() => Boolean(window.catalog_finished)), false);
  await fixture_data.browser_page.evaluate(() => { document.querySelector('img').dataset.photoLoading = 'false'; document.dispatchEvent(new Event('scroll')); });
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 400); });
  assert.equal(fixture_data.request_paths.includes('/next'), false);
  await wait_for_asset(fixture_data.browser_page, '/photo-96.svg');
});

test('foreground activity aborts a background transfer and the queue resumes after quiet', async (test_context) => {
  const fixture_data = await create_fixture(test_context, { slow_asset: true });
  await install_queue(fixture_data.browser_page);
  await fixture_data.browser_page.waitForFunction(() => performance.getEntriesByType('resource').filter((resource_entry) => /\/(next|second)$/.test(resource_entry.name)).length === 2);
  while (!fixture_data.request_paths.includes('/photo-96.svg')) await new Promise((resolve_delay) => { setTimeout(resolve_delay, 50); });
  await fixture_data.browser_page.evaluate(() => document.dispatchEvent(new Event('pointerdown')));
  await wait_for_asset(fixture_data.browser_page, '/photo-640.svg');
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path === '/photo-96.svg').length, 2);
  assert.equal(fixture_data.maximum_downloads(), 1);
});

test('image discovery respects progressive, responsive, picture, opt-out and same-origin boundaries', async (test_context) => {
  const fixture_data = await create_fixture(test_context);
  const selected_assets = await fixture_data.browser_page.evaluate((photo_markup) => WarmingRuntime.collect_page_assets(`
    <noscript><img src="/original.svg"></noscript><img data-no-prefetch src="/excluded.svg">
    ${photo_markup}<img src="/fallback.svg" srcset="/small.svg 325w, /medium.svg 650w, /huge.svg 1300w">
    <picture><source media="(min-width: 2000px)" srcset="/desktop.svg 325w"><source type="image/webp" srcset="/picture-small.webp 325w, /picture-medium.webp 650w"><img src="/picture-fallback.svg"></picture>
    <img src="/fourth.svg"><script src="https://external.test/file.js"></script><script src="/shared.js"></script>`, location.href, window, document), PHOTO_MARKUP);
  assert.deepEqual(selected_assets.map((asset_entry) => new URL(asset_entry.asset_url).pathname), [
    '/photo-96.svg', '/small.svg', '/picture-small.webp', '/photo-320.svg', '/photo-640.svg', '/medium.svg', '/picture-medium.webp', '/shared.js',
  ]);
});

test('private and oversized HTML never starts dependent downloads', async (test_context) => {
  for (const target_options of [{ target_headers: { 'Cache-Control': 'private' } }, { target_source: 'x'.repeat(262145) + PHOTO_MARKUP }, { target_headers: { 'Cache-Control': 'no-store' } }, { target_status: 500 }]) {
    const fixture_data = await create_fixture(test_context, target_options);
    await install_queue(fixture_data.browser_page);
    await wait_for_asset(fixture_data.browser_page, '/second');
    await new Promise((resolve_delay) => { setTimeout(resolve_delay, 1200); });
    assert.deepEqual(fixture_data.request_paths.filter((request_path) => request_path.startsWith('/photo-')), []);
  }
});

test('Save-Data suspends speculation and changing the connection resumes pending work', async (test_context) => {
  const fixture_data = await create_fixture(test_context);
  await fixture_data.browser_page.evaluate(() => {
    const connection_info = new EventTarget();
    connection_info.saveData = true;
    Object.defineProperty(navigator, 'connection', { configurable: true, value: connection_info });
  });
  await install_queue(fixture_data.browser_page);
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 2200); });
  assert.equal(fixture_data.request_paths.includes('/next'), false);
  await fixture_data.browser_page.evaluate(() => { navigator.connection.saveData = false; navigator.connection.dispatchEvent(new Event('change')); });
  await wait_for_asset(fixture_data.browser_page, '/photo-96.svg');
});


test('application-owned foreground requests pause the queue through body consumption', async (test_context) => {
  const fixture_data = await create_fixture(test_context);
  await fixture_data.browser_page.evaluate(() => {
    void WarmingRuntime.track_foreground_loading(() => new Promise((resolve_request) => { window.finish_foreground = resolve_request; }));
  });
  await install_queue(fixture_data.browser_page);
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 1200); });
  assert.equal(await fixture_data.browser_page.evaluate(() => Boolean(window.catalog_finished)), false);
  await fixture_data.browser_page.evaluate(() => window.finish_foreground());
  await wait_for_asset(fixture_data.browser_page, '/photo-96.svg');
});


test('streaming byte limits stop oversized assets and cap the total background budget', async (test_context) => {
  const fixture_data = await create_fixture(test_context, { asset_bytes: 2 * 1024 * 1024 + 65536 });
  await install_queue(fixture_data.browser_page);
  await wait_for_asset(fixture_data.browser_page, '/photo-640.svg');
  assert.equal(fixture_data.request_paths.filter((request_path) => request_path.startsWith('/photo-')).length, 3,
    'Oversized responses are canceled and later candidates are still attempted.');
  const multiple_photos = ['first', 'second', 'third'].map((photo_name) => PHOTO_MARKUP.replaceAll('/photo-', `/photo-${photo_name}-`)).join('');
  const budget_fixture = await create_fixture(test_context, { asset_bytes: 1900000, target_source: multiple_photos });
  await install_queue(budget_fixture.browser_page);
  await wait_for_asset(budget_fixture.browser_page, '/photo-second-320.svg');
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 1500); });
  assert.equal(budget_fixture.request_paths.filter((request_path) => request_path.startsWith('/photo-')).length, 5,
    'The fifth transfer exhausts 8 MiB; the remaining queue must stay stopped.');
});
