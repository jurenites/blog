import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium as chromium_browser } from 'playwright';

const PHOTO_SOURCE = (await readFile('src/slice/src/js/progressive-photo.js', 'utf8')).replaceAll('export function', 'function');
const THEME_STYLES = await readFile('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8');
const PREVIEW_SOURCE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="14"><path fill="rgb(40,80,120)" d="M0 0h24v14H0z"/></svg>')}`;
const PHOTO_WIDTHS = [96, 320, 640, 1280, 1672];

async function create_fixture(test_context, { slow_loading = false, failed_widths = [], lazy_loading = false, display_width = 1000 } = {}) {
  const browser_instance = await chromium_browser.launch({ headless: true });
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage({ viewport: { width: 1800, height: 900 } });
  const requested_widths = [];
  await browser_page.route('https://photo-fixture.test/**', async (route_request) => {
    const image_width = Number(new URL(route_request.request().url()).pathname.slice(1));
    requested_widths.push(image_width);
    if (slow_loading) await new Promise((resolve_delay) => { setTimeout(resolve_delay, 170); });
    if (failed_widths.includes(image_width)) {
      await route_request.fulfill({ status: 404, body: 'Missing photo' });
      return;
    }
    await route_request.fulfill({ contentType: 'image/svg+xml', body: `<svg xmlns="http://www.w3.org/2000/svg" width="${image_width}" height="${image_width * 9 / 16}"><path fill="rgb(40,80,120)" d="M0 0h${image_width}v${image_width}H0z"/></svg>` });
  });
  const image_candidates = PHOTO_WIDTHS.map((image_width) => ({ image_width, image_url: `https://photo-fixture.test/${image_width}` }));
  await browser_page.setContent(`<html class="js"><head><style>${THEME_STYLES}
    .contact-photo { width: ${display_width}px; margin: 0; }
    .offscreen-spacer { height: ${lazy_loading ? 2500 : 0}px; }
    </style></head><body><div class="offscreen-spacer"></div><figure class="contact-photo">
    <img class="contact-photo__image" src="${PREVIEW_SOURCE}" alt="Portrait description"
    data-photo-stages='${JSON.stringify(image_candidates)}' data-photo-state="preview" data-photo-lazy="${lazy_loading}">
    </figure></body></html>`);
  await browser_page.addScriptTag({ content: PHOTO_SOURCE });
  return { browser_page, requested_widths };
}

test('slow photos retain complete pixelated frames until decode, without layout shifts', async (test_context) => {
  const { browser_page, requested_widths } = await create_fixture(test_context, { slow_loading: true });
  const original_bounds = await browser_page.locator('.contact-photo__image').boundingBox();
  await browser_page.evaluate(() => {
    const original_decode = HTMLImageElement.prototype.decode;
    window.release_decode = null;
    HTMLImageElement.prototype.decode = async function () {
      await original_decode.call(this);
      if (this.src.endsWith('/320')) {
        await new Promise((resolve_decode) => { window.release_decode = resolve_decode; });
      }
    };
    initialize_progressive_photos();
    initialize_progressive_photos();
  });
  await browser_page.waitForFunction(() => window.release_decode);
  assert.equal(await browser_page.locator('img').getAttribute('data-photo-width'), '96', 'The decoded previous stage remains while the next decode is pending.');
  assert.equal(await browser_page.locator('img').evaluate((image_element) => getComputedStyle(image_element).imageRendering), 'pixelated');
  assert.deepEqual(await browser_page.locator('img').boundingBox(), original_bounds);
  await browser_page.evaluate(() => window.release_decode());
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoState === 'complete');
  assert.deepEqual(requested_widths, [96, 320, 640, 1280]);
  assert.deepEqual(await browser_page.locator('img').boundingBox(), original_bounds);
  assert.equal(await browser_page.locator('img').getAttribute('alt'), 'Portrait description');
  assert.equal(await browser_page.locator('img').evaluate((image_element) => getComputedStyle(image_element).imageRendering), 'auto');
});

test('fast photos skip intermediate downloads, stop at the viewport target, and upgrade after resize', async (test_context) => {
  const { browser_page, requested_widths } = await create_fixture(test_context, { display_width: 600 });
  await browser_page.evaluate(() => initialize_progressive_photos());
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoState === 'complete');
  assert.deepEqual(requested_widths, [96, 640]);
  await browser_page.addStyleTag({ content: '.contact-photo { width: 1600px; }' });
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoWidth === '1672');
  assert.deepEqual(requested_widths, [96, 640, 1672]);
  assert.equal(await browser_page.locator('img').getAttribute('data-photo-state'), 'complete');
});

test('a failed final derivative retains the previous image; intermediate failures can recover', async (test_context) => {
  const { browser_page, requested_widths } = await create_fixture(test_context, { slow_loading: true, failed_widths: [320, 1280] });
  await browser_page.evaluate(() => initialize_progressive_photos());
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoState === 'error');
  assert.deepEqual(requested_widths, [96, 320, 640, 1280]);
  assert.equal(await browser_page.locator('img').getAttribute('data-photo-width'), '640');
  assert.equal(await browser_page.locator('img').evaluate((image_element) => image_element.complete && image_element.naturalWidth > 0), true);
});

test('Contact defers network stages until near the viewport and detachment stops replacements', async (test_context) => {
  const { browser_page, requested_widths } = await create_fixture(test_context, { lazy_loading: true, slow_loading: true });
  await browser_page.evaluate(() => initialize_progressive_photos());
  await browser_page.evaluate(() => new Promise((resolve_frame) => { requestAnimationFrame(() => requestAnimationFrame(resolve_frame)); }));
  assert.deepEqual(requested_widths, []);
  await browser_page.locator('img').scrollIntoViewIfNeeded();
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoWidth === '96');
  await browser_page.evaluate(() => detach_progressive_photos(document));
  await new Promise((resolve_delay) => { setTimeout(resolve_delay, 250); });
  assert.equal(await browser_page.locator('img').getAttribute('data-photo-width'), '96');
});

test('Save Data caps density at 1x and reduced motion needs no animation', async (test_context) => {
  const { browser_page, requested_widths } = await create_fixture(test_context, { display_width: 300 });
  await browser_page.emulateMedia({ reducedMotion: 'reduce' });
  await browser_page.evaluate(() => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3 });
    Object.defineProperty(navigator, 'connection', { value: { saveData: true } });
    initialize_progressive_photos();
  });
  await browser_page.waitForFunction(() => document.querySelector('img').dataset.photoState === 'complete');
  assert.deepEqual(requested_widths, [96, 320]);
  assert.equal(await browser_page.locator('img').evaluate((image_element) => getComputedStyle(image_element).animationName), 'none');
});
