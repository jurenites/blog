import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import test from 'node:test';

// Uses the same optional Playwright installation as storybook:inspect.
const { chromium: chromium_browser } = await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const MODULE_SOURCE = await readFile('src/slice/src/js/video-grid.js', 'utf8');

function listing_markup(page_number, page_count = 3) {
  return `<div data-video-listing>
    <div class="video-grid"><div class="video-grid__item">Video ${page_number}</div></div>
    <p data-video-status hidden role="status" data-loading-text="Loading"
      data-loaded-text="Loaded" data-complete-text="Complete" data-error-text="Use pagination"></p>
    <div data-video-pager><nav class="pagination">Page ${page_number}
      ${page_number < page_count ? `<a rel="next" href="?tag=music&page=${page_number}">Next</a>` : ''}
    </nav></div>
  </div>`;
}

test('Videos progressive loading in a browser', async (test_context) => {
  const browser_instance = await chromium_browser.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_CHROME_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHROME_CHANNEL } : {}),
  });
  const page_requests = [];
  const test_server = createServer((http_request, http_response) => {
    const request_url = new URL(http_request.url, 'http://localhost');
    http_response.setHeader('Content-Type', request_url.pathname === '/video-grid.js' ? 'text/javascript' : 'text/html');
    if (request_url.pathname === '/video-grid.js') return http_response.end(MODULE_SOURCE);
    page_requests.push(request_url.search);
    http_response.end(listing_markup(Number(request_url.searchParams.get('page') || 0) + 1));
  });
  await new Promise((resolve_listen) => { test_server.listen(0, '127.0.0.1', resolve_listen); });
  const fixture_url = `http://127.0.0.1:${test_server.address().port}/videos?tag=music`;
  test_context.after(async () => {
    await browser_instance.close();
    await new Promise((resolve_close) => { test_server.close(resolve_close); });
  });

  async function initialize_fixture(browser_page, failure_mode = '') {
    await browser_page.goto(fixture_url);
    await browser_page.evaluate(async (selected_failure) => {
      const grid_module = await import('/video-grid.js');
      window.grid_module = grid_module;
      window.attached_cards = 0;
      window.Drupal = { attachBehaviors() { window.attached_cards += 1; } };
      // Drive intersections explicitly to verify repeated callbacks during a request.
      window.IntersectionObserver = class {
        constructor(observer_callback) { window.trigger_loading = () => observer_callback([{ isIntersecting: true }]); }
        observe() {}
        unobserve() {}
        disconnect() { window.observer_stopped = true; }
      };
      const fetch_options = selected_failure ? {
        async fetch_page(request_url, request_options) {
          if (selected_failure === 'malformed') return { ok: true, text: async () => '<html>Wrong page</html>' };
          if (selected_failure === 'timeout') {
            return new Promise((_resolve_request, reject_request) => {
              request_options.signal.addEventListener('abort', () => reject_request(new Error('Timed out')));
            });
          }
          if (selected_failure === 'after-success' && new URL(request_url).searchParams.get('page') === '1') {
            return window.fetch(request_url, request_options);
          }
          throw new Error('Offline');
        },
      } : {};
      if (selected_failure === 'timeout') {
        const native_timeout = window.setTimeout.bind(window);
        window.setTimeout = (timeout_callback) => native_timeout(timeout_callback, 10);
      }
      grid_module.initialize_video_grids(document, fetch_options);
      grid_module.initialize_video_grids(document, fetch_options);
    }, failure_mode);
  }

  await test_context.test('appends ordered pages, preserves filters, prevents concurrent loads, and stops at the end', async () => {
    const browser_page = await browser_instance.newPage();
    await initialize_fixture(browser_page);
    page_requests.length = 0;
    assert.equal(await browser_page.locator('[data-video-pager]').isVisible(), false);
    await browser_page.evaluate(() => { window.trigger_loading(); window.trigger_loading(); });
    await browser_page.waitForFunction(() => document.querySelector('[data-video-status]').textContent === 'Loaded');
    assert.deepEqual(page_requests, ['?tag=music&page=1']);
    assert.equal(await browser_page.locator('a[rel="next"]').getAttribute('href'), '?tag=music&page=2');
    await browser_page.evaluate(() => window.trigger_loading());
    await browser_page.waitForFunction(() => document.querySelector('[data-video-status]').textContent === 'Complete');
    assert.deepEqual(await browser_page.locator('.video-grid__item').allTextContents(), ['Video 1', 'Video 2', 'Video 3']);
    assert.equal(await browser_page.evaluate(() => window.attached_cards), 2);
    assert.equal(await browser_page.evaluate(() => window.observer_stopped), true);
    assert.equal(await browser_page.locator('.video-grid').getAttribute('aria-busy'), null);
    await browser_page.close();
  });

  for (const failure_mode of ['offline', 'malformed', 'after-success', 'timeout']) {
    await test_context.test(`${failure_mode} restores a working pager without losing loaded cards`, async () => {
      const browser_page = await browser_instance.newPage();
      await initialize_fixture(browser_page, failure_mode);
      await browser_page.evaluate(() => window.trigger_loading());
      if (failure_mode === 'after-success') {
        await browser_page.waitForFunction(() => document.querySelector('[data-video-status]').textContent === 'Loaded');
        await browser_page.evaluate(() => window.trigger_loading());
      }
      await browser_page.waitForFunction(() => document.querySelector('[data-video-status]').textContent === 'Use pagination');
      assert.equal(await browser_page.locator('[data-video-pager]').isVisible(), true);
      assert.equal(await browser_page.locator('.video-grid__item').count(), failure_mode === 'after-success' ? 2 : 1);
      await browser_page.locator('a[rel="next"]').click();
      assert.equal(new URL(browser_page.url()).searchParams.get('page'), failure_mode === 'after-success' ? '2' : '1');
      await browser_page.close();
    });
  }

  await test_context.test('native pagination works without JavaScript or IntersectionObserver', async () => {
    const browser_context = await browser_instance.newContext({ javaScriptEnabled: false });
    const browser_page = await browser_context.newPage();
    await browser_page.goto(fixture_url);
    assert.equal(await browser_page.locator('[data-video-pager]').isVisible(), true);
    await browser_page.locator('a[rel="next"]').click();
    assert.equal(await browser_page.locator('.video-grid__item').textContent(), 'Video 2');
    await browser_context.close();
    const unsupported_page = await browser_instance.newPage();
    await unsupported_page.goto(fixture_url);
    await unsupported_page.evaluate(async () => {
      window.IntersectionObserver = undefined;
      (await import('/video-grid.js')).initialize_video_grids(document);
    });
    assert.equal(await unsupported_page.locator('[data-video-pager]').isVisible(), true);
    await unsupported_page.close();
  });

  await test_context.test('Drupal detach restores the pager and disconnects observation', async () => {
    const browser_page = await browser_instance.newPage();
    await initialize_fixture(browser_page);
    await browser_page.evaluate(() => window.grid_module.detach_video_grids(document));
    assert.equal(await browser_page.locator('[data-video-pager]').isVisible(), true);
    assert.equal(await browser_page.evaluate(() => window.observer_stopped), true);
    await browser_page.close();
  });
});
