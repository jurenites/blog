import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const site_origin = process.env.INTRO_TEST_ORIGIN || 'http://jurenites.local';
const artifact_directory = '/tmp/jurenites-site-intro';
await mkdir(artifact_directory, { recursive: true });
const browser_instance = await chromium.launch({ headless: true });
const browser_context = await browser_instance.newContext({ viewport: { width: 1440, height: 900 } });
const page_instance = await browser_context.newPage();
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));

async function wait_for_intro() {
  await page_instance.waitForFunction(() => document.documentElement.dataset.siteIntro === 'running');
}

async function finish_intro() {
  await page_instance.waitForFunction(() => !document.documentElement.hasAttribute('data-site-intro'));
  assert.equal(await page_instance.evaluate(() => document.body.inert), false);
}

async function assert_name_painted(image_path) {
  const image_data = PNG.sync.read(await readFile(image_path));
  let bright_pixels = 0;
  for (let pixel_offset = 0; pixel_offset < image_data.data.length; pixel_offset += 4) {
    if (image_data.data[pixel_offset] > 200
      && image_data.data[pixel_offset + 1] > 200
      && image_data.data[pixel_offset + 2] > 200) bright_pixels += 1;
  }
  assert(bright_pixels > 200, 'The white name must actually paint above the homepage-colored canvas.');
}

try {
  await page_instance.goto(`${site_origin}/videos`, { waitUntil: 'domcontentloaded' });
  await wait_for_intro();
  const intro_snapshot = await page_instance.evaluate(() => {
    const intro_animations = document.getAnimations().filter((animation_item) =>
      animation_item.animationName?.startsWith('site-intro-'));
    for (const animation_item of intro_animations) {
      animation_item.pause();
      animation_item.currentTime = 700;
    }
    const branding_element = document.querySelector('#block-jurenites-theme-site-branding');
    const name_element = branding_element.querySelector('.site-header__brand-name');
    const name_bounds = name_element.getBoundingClientRect();
    return {
      font_size: getComputedStyle(name_element).fontSize,
      center_position: name_bounds.y + name_bounds.height / 2,
      left_position: name_bounds.x,
      canvas_color: getComputedStyle(document.body, '::after').backgroundColor,
      canvas_opacity: getComputedStyle(document.body, '::after').opacity,
      stored_visit: JSON.parse(localStorage.getItem('jurenites.site-intro')),
      brand_count: document.querySelectorAll('#block-jurenites-theme-site-branding').length,
    };
  });
  assert.equal(intro_snapshot.font_size, '96px');
  assert.equal(intro_snapshot.center_position, 450);
  assert.equal(intro_snapshot.left_position, 16);
  assert.equal(intro_snapshot.canvas_color, 'rgb(0, 2, 7)');
  assert.equal(intro_snapshot.canvas_opacity, '1');
  assert.equal(intro_snapshot.stored_visit.loading, true);
  assert.equal(intro_snapshot.brand_count, 1);
  await page_instance.screenshot({ path: `${artifact_directory}/desktop-name.png` });
  await assert_name_painted(`${artifact_directory}/desktop-name.png`);
  const arrival_snapshot = await page_instance.evaluate(() => {
    for (const animation_item of document.getAnimations()) {
      if (animation_item.animationName?.startsWith('site-intro-')) animation_item.currentTime = 1900;
    }
    return {
      name_size: getComputedStyle(document.querySelector('.site-header__brand-name')).fontSize,
      letter_width: document.querySelector('.site-header__brand-name-letter').getBoundingClientRect().width,
      canvas_opacity: Number(getComputedStyle(document.body, '::after').opacity),
    };
  });
  assert.equal(arrival_snapshot.name_size, '40px');
  assert.equal(arrival_snapshot.letter_width, 0);
  assert(arrival_snapshot.canvas_opacity > 0 && arrival_snapshot.canvas_opacity < 1);
  await page_instance.screenshot({ path: `${artifact_directory}/desktop-reveal.png` });
  await finish_intro();
  await page_instance.screenshot({ path: `${artifact_directory}/videos-ready.png` });

  for (const route_path of ['/about', '/', '/ru']) {
    await page_instance.goto(`${site_origin}${route_path}`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page_instance.locator('html').getAttribute('data-site-intro'), null);
  }

  // Expiry is measured from the visit, not from midnight or an individual route.
  await page_instance.evaluate(() => localStorage.setItem('jurenites.site-intro', JSON.stringify({
    loading: true, shown_at: Date.now() - 86400001,
  })));
  await page_instance.goto(`${site_origin}/videos`, { waitUntil: 'domcontentloaded' });
  await wait_for_intro();
  await finish_intro();

  // Session storage retains the visit if localStorage disappears or becomes blocked.
  await page_instance.evaluate(() => localStorage.removeItem('jurenites.site-intro'));
  await page_instance.reload({ waitUntil: 'domcontentloaded' });
  assert.equal(await page_instance.locator('html').getAttribute('data-site-intro'), null);

  const mobile_context = await browser_instance.newContext({ viewport: { width: 375, height: 812 } });
  const mobile_page = await mobile_context.newPage();
  await mobile_page.goto(`${site_origin}/videos`, { waitUntil: 'domcontentloaded' });
  await mobile_page.waitForFunction(() => document.documentElement.dataset.siteIntro === 'running');
  await mobile_page.evaluate(() => {
    for (const animation_item of document.getAnimations()) {
      if (animation_item.animationName?.startsWith('site-intro-')) {
        animation_item.pause();
        animation_item.currentTime = 700;
      }
    }
  });
  assert.equal(await mobile_page.locator('#block-jurenites-theme-site-branding').isVisible(), true);
  const mobile_bounds = await mobile_page.locator('.site-header__brand-name').boundingBox();
  assert(mobile_bounds.x + mobile_bounds.width <= 375);
  await mobile_page.screenshot({ path: `${artifact_directory}/mobile-name.png` });
  await assert_name_painted(`${artifact_directory}/mobile-name.png`);
  await mobile_page.waitForFunction(() => !document.documentElement.hasAttribute('data-site-intro'));
  assert.equal(await mobile_page.locator('.site-header__menu-toggle').isVisible(), true);
  // A wide homepage must land in the centered header, without a final sideways jump.
  await mobile_page.setViewportSize({ width: 1920, height: 1080 });
  await mobile_page.evaluate(() => {
    localStorage.removeItem('jurenites.site-intro');
    sessionStorage.removeItem('jurenites.site-intro');
  });
  await mobile_page.goto(`${site_origin}/`, { waitUntil: 'domcontentloaded' });
  await mobile_page.waitForFunction(() => document.documentElement.dataset.siteIntro === 'running');
  await mobile_page.evaluate(() => {
    for (const animation_item of document.getAnimations()) {
      if (animation_item.animationName?.startsWith('site-intro-')) {
        animation_item.pause();
        animation_item.currentTime = 1900;
      }
    }
  });
  const arrival_bounds = await mobile_page.locator('.site-header__brand-name').boundingBox();
  await mobile_page.waitForFunction(() => !document.documentElement.hasAttribute('data-site-intro'));
  const header_bounds = await mobile_page.locator('.site-header__brand-name').boundingBox();
  assert.equal(arrival_bounds.x, header_bounds.x);
  assert.equal(arrival_bounds.y, header_bounds.y);
  await mobile_context.close();

  const reduced_context = await browser_instance.newContext({ reducedMotion: 'reduce' });
  const reduced_page = await reduced_context.newPage();
  await reduced_page.goto(`${site_origin}/videos`, { waitUntil: 'domcontentloaded' });
  assert.equal(await reduced_page.locator('html').getAttribute('data-site-intro'), null);
  await reduced_context.close();

  const fallback_context = await browser_instance.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const fallback_page = await fallback_context.newPage();
  await fallback_page.goto(`${site_origin}/videos`, { waitUntil: 'load' });
  assert.equal(await fallback_page.locator('html').getAttribute('data-site-intro'), 'fallback');
  assert.equal(await fallback_page.locator('.site-header__brand-name-letter').first().isVisible(), true);
  assert.equal(await fallback_page.locator('main').isVisible(), false);
  await fallback_page.screenshot({ path: `${artifact_directory}/no-javascript.png` });
  await assert_name_painted(`${artifact_directory}/no-javascript.png`);
  await fallback_context.close();
  assert.deepEqual(runtime_errors, []);
  console.log('Site intro passed: Videos entry, 96px → 40px → AI, canvas fade, daily expiry, cross-route skip, session fallback, mobile, reduced motion, and no JS.');
  console.log(`Screenshots: ${artifact_directory}`);
} finally {
  await browser_instance.close();
}
