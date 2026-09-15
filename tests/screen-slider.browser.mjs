import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
try {
  await page_instance.goto('http://jurenites.local/portfolio/smep', { waitUntil: 'domcontentloaded' });
  await page_instance.locator('.cookie-policy-notice__close').click();
  const slider_locator = page_instance.locator('[data-screen-slider]');
  await slider_locator.scrollIntoViewIfNeeded();
  await page_instance.waitForFunction(() => document.querySelector('[data-slider-track]')?.getAnimations().length === 1);
  const initial_state = await slider_locator.evaluate((slider_element) => ({
    screen_count: slider_element.querySelectorAll('.screen-slider__screen:not([data-slider-clone])').length,
    viewport_width: slider_element.querySelector('[data-slider-viewport]').getBoundingClientRect().width,
    image_sizes: [...slider_element.querySelectorAll('.screen-slider__image')].map((image_element) => [image_element.getBoundingClientRect().width, image_element.getBoundingClientRect().height]),
    visible_dots: slider_element.querySelectorAll('[data-slider-dot]:not([hidden])').length,
    image_sources: [...slider_element.querySelectorAll('.screen-slider__screen:not([data-slider-clone]) img')].map((image_element) => decodeURIComponent(image_element.src.split('/').pop())),
  }));
  assert.equal(initial_state.screen_count, 42);
  assert.equal(initial_state.viewport_width, 1440);
  assert.equal(initial_state.visible_dots, 9);
  assert(initial_state.image_sizes.every(([image_width, image_height]) => Math.abs(image_width - 187.5) < 0.01 && image_height === 333.5));
  assert.deepEqual(initial_state.image_sources, [...initial_state.image_sources].sort((first_name, second_name) => first_name.localeCompare(second_name, 'en', { numeric: true })));
  const motion_start = await page_instance.locator('[data-slider-track]').evaluate((track_element) => Number(track_element.getAnimations()[0].currentTime));
  await page_instance.waitForTimeout(250);
  const motion_end = await page_instance.locator('[data-slider-track]').evaluate((track_element) => Number(track_element.getAnimations()[0].currentTime));
  assert(motion_end > motion_start + 100, 'Autoplay must advance continuously');
  await page_instance.locator('[data-slider-viewport]').focus();
  await page_instance.keyboard.press('End');
  assert.equal(await page_instance.locator('[data-slider-count]').textContent(), '42 / 42');
  await page_instance.keyboard.press('ArrowRight');
  assert.equal(await page_instance.locator('[data-slider-count]').textContent(), '1 / 42');
  const seam_state = await page_instance.locator('[data-slider-track]').evaluate((track_element) => {
    const track_animation = track_element.getAnimations()[0];
    track_animation.pause();
    track_animation.currentTime = 42 * 8000 - 1;
    const clone_rect = track_element.querySelector('[data-slider-clone]').getBoundingClientRect();
    const viewport_rect = track_element.parentElement.getBoundingClientRect();
    track_animation.currentTime = 42 * 8000;
    const first_rect = track_element.firstElementChild.getBoundingClientRect();
    return { before_left: clone_rect.left - viewport_rect.left, after_left: first_rect.left - viewport_rect.left };
  });
  assert(Math.abs(seam_state.before_left - seam_state.after_left) < 1, 'Loop seam must align');
  await slider_locator.screenshot({ path: 'artifacts/smep-slider/desktop.png' });
  for (const viewport_width of [1920, 375, 360]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 667 });
    await slider_locator.scrollIntoViewIfNeeded();
    const mobile_state = await slider_locator.evaluate((slider_element) => ({
      page_width: document.documentElement.scrollWidth,
      viewport_width: window.innerWidth,
      crop_width: slider_element.querySelector('[data-slider-viewport]').getBoundingClientRect().width,
      crop_left: slider_element.querySelector('[data-slider-viewport]').getBoundingClientRect().left,
      clone_width: slider_element.querySelectorAll('[data-slider-clone]').length * 203.5,
      image_width: slider_element.querySelector('img').getBoundingClientRect().width,
      dots_width: slider_element.querySelector('[data-slider-pagination]').scrollWidth,
      slider_width: slider_element.getBoundingClientRect().width,
    }));
    assert.equal(mobile_state.page_width, viewport_width);
    assert(Math.abs(mobile_state.image_width - 187.5) < 0.01);
    assert.equal(mobile_state.crop_width, viewport_width);
    assert(Math.abs(mobile_state.crop_left) < 0.01);
    assert(mobile_state.clone_width > viewport_width);
    assert(mobile_state.dots_width <= mobile_state.slider_width + 1);
    await slider_locator.screenshot({ path: `artifacts/smep-slider/mobile-${viewport_width}.png` });
    console.log({ viewport_width, ...mobile_state });
  }
  await page_instance.emulateMedia({ reducedMotion: 'reduce' });
  await page_instance.reload({ waitUntil: 'domcontentloaded' });
  await slider_locator.scrollIntoViewIfNeeded();
  await page_instance.waitForFunction(() => document.querySelector('[data-slider-track]')?.getAnimations().length === 1);
  assert.equal(await page_instance.locator('[data-slider-track]').evaluate((track_element) => track_element.getAnimations()[0].playState), 'paused');
  assert.equal(await page_instance.locator('[data-slider-toggle]').getAttribute('aria-label'), 'Play');
  assert.equal(await page_instance.locator('.screen-slider__play-icon').isVisible(), true);
  assert.equal(await page_instance.locator('.screen-slider__pause-icon').isVisible(), false);
  await page_instance.locator('[data-slider-toggle]').click();
  assert.equal(await page_instance.locator('[data-slider-toggle]').getAttribute('aria-label'), 'Pause');
  assert.equal(await page_instance.locator('.screen-slider__play-icon').isVisible(), false);
  assert.equal(await page_instance.locator('.screen-slider__pause-icon').isVisible(), true);
  assert.equal(await page_instance.locator('[data-slider-track]').evaluate((track_element) => track_element.getAnimations()[0].playState), 'running');
  await page_instance.locator('[data-slider-toggle]').click();
  assert.equal(await page_instance.locator('[data-slider-track]').evaluate((track_element) => track_element.getAnimations()[0].playState), 'paused');
  const viewport_bounds = await page_instance.locator('[data-slider-viewport]').boundingBox();
  await page_instance.mouse.move(viewport_bounds.x + 250, Math.max(10, viewport_bounds.y + 100));
  await page_instance.mouse.down();
  const before_drag = await page_instance.locator('[data-slider-track]').evaluate((track_element) => Number(track_element.getAnimations()[0].currentTime));
  await page_instance.mouse.move(viewport_bounds.x + 50, Math.max(10, viewport_bounds.y + 100), { steps: 10 });
  await page_instance.mouse.up();
  const after_drag = await page_instance.locator('[data-slider-track]').evaluate((track_element) => Number(track_element.getAnimations()[0].currentTime));
  assert(after_drag > before_drag + 3000, 'Dragging must move the screen track');
  assert.deepEqual(runtime_errors, []);
  console.log('PASS: 42 screens, order, 187.5×333.5 thumbnails, browser-edge desktop, continuous motion, loop seam, mobile clipping, pagination, keyboard and reduced motion.');
} finally {
  await browser_instance.close();
}
