import assert from 'node:assert/strict';
import { readFile as read_file } from 'node:fs/promises';
import { createServer as create_vite_server } from 'vite';
import { build as build_script } from 'esbuild';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const HEADER_COLOR = [76, 36, 98, 255];
const BODY_COLOR = [248, 248, 248, 255];
const screenshot_image = new PNG({ width: 375, height: 1600 });
for (let pixel_row = 0; pixel_row < screenshot_image.height; pixel_row++) {
  for (let pixel_column = 0; pixel_column < screenshot_image.width; pixel_column++) {
    screenshot_image.data.set(pixel_row < 100 ? HEADER_COLOR : BODY_COLOR,
      (pixel_row * screenshot_image.width + pixel_column) * 4);
  }
}
const image_source = `data:image/png;base64,${PNG.sync.write(screenshot_image).toString('base64')}`;
const vite_server = await create_vite_server({ configFile: false, server: { middlewareMode: true, hmr: false }, appType: 'custom' });
let browser_instance;
try {
  const { card_markup } = await vite_server.ssrLoadModule('/src/stories/molecules/card/card.markup.js');
  const preview_markup = card_markup({
    card_url: '', display_size: 'native-screen', background_mode: 'transparent', follow_cursor: false,
    island_overlay: true, is_playing: true, fallback_source: image_source,
    frame_list: [{ image_source, image_description: 'Header above a differently colored page body', frame_mode: 'scroll', scroll_behavior: 'swipe', hold_ms: 3000, bottom_hold_ms: 800 }],
  });
  const theme_source = await read_file('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8');
  const runtime_bundle = await build_script({
    stdin: { contents: "import { initialize_cursor_cards, detach_cursor_cards } from './src/slice/src/js/cursor-card.js'; window.detach_test_cards = detach_cursor_cards; initialize_cursor_cards();", resolveDir: process.cwd() },
    bundle: true, write: false, format: 'iife',
  });
  browser_instance = await chromium.launch({ headless: true });
  const page_instance = await browser_instance.newPage({ viewport: { width: 700, height: 1100 } });
  await page_instance.route('http://phone-test.local/', route_entry => route_entry.fulfill({
    contentType: 'text/html', body: `<style>${theme_source}</style><div class="accountia-preview__phones"><figure class="accountia-preview__phone">${preview_markup}</figure></div>`,
  }));
  await page_instance.goto('http://phone-test.local/');
  await page_instance.addScriptTag({ content: runtime_bundle.outputFiles[0].text });
  const top_locator = page_instance.locator('.card__frame [data-screen-top-fill]');
  await page_instance.waitForFunction(() => document.querySelector('.card__frame [data-screen-top-fill] image')?.hasAttribute('height'));
  const screen_locator = page_instance.locator('.card__screen');
  const camera_locator = page_instance.locator('.card__frame .card__island-camera');
  async function camera_position() {
    const camera_bounds = await camera_locator.boundingBox();
    const screen_bounds = await screen_locator.boundingBox();
    return { top_offset: camera_bounds.y - screen_bounds.y, left_offset: camera_bounds.x - screen_bounds.x, width: camera_bounds.width, height: camera_bounds.height };
  }
  const initial_camera = await camera_position();
  async function screen_color() {
    const screen_image = PNG.sync.read(await screen_locator.screenshot());
    const pixel_offset = (28 * screen_image.width + Math.floor(screen_image.width * 0.15)) * 4;
    return [...screen_image.data.subarray(pixel_offset, pixel_offset + 4)];
  }
  async function verify_seam() {
    const seam_offset = await screen_locator.evaluate(screen_element => {
      const image_element = screen_element.querySelector('.card__frame .card__image');
      return image_element.getBoundingClientRect().top - screen_element.getBoundingClientRect().top;
    });
    const screen_image = PNG.sync.read(await screen_locator.screenshot());
    for (let pixel_row = Math.floor(seam_offset) - 2; pixel_row <= Math.ceil(seam_offset) + 2; pixel_row++) {
      for (const column_fraction of [0.15, 0.5, 0.85]) {
        const pixel_offset = (pixel_row * screen_image.width + Math.floor(screen_image.width * column_fraction)) * 4;
        assert.deepEqual([...screen_image.data.subarray(pixel_offset, pixel_offset + 4)], HEADER_COLOR, 'The join must contain no contrasting seam');
      }
    }
  }
  assert.deepEqual(await screen_color(), HEADER_COLOR);
  await verify_seam();
  await page_instance.locator('.card__scroll-content').evaluate(scroll_element => {
    const scroll_animation = scroll_element.getAnimations()[0];
    scroll_animation.playbackRate = 0;
    scroll_animation.currentTime = scroll_animation.effect.getTiming().duration * 0.5;
  });
  assert.deepEqual(await screen_color(), BODY_COLOR, 'The actual body must scroll beneath the pill');
  assert.equal((await top_locator.getAttribute('viewBox')).split(' ')[1], '0', 'The fill must keep the first source row');
  assert.ok((await top_locator.boundingBox()).y + (await top_locator.boundingBox()).height < (await screen_locator.boundingBox()).y, 'The fill must scroll fully out of the screen');
  assert.deepEqual(await camera_position(), initial_camera, 'The camera must stay fixed');
  await page_instance.locator('.card').hover();
  const paused_bounds = await top_locator.boundingBox();
  await page_instance.waitForTimeout(100);
  assert.deepEqual(await top_locator.boundingBox(), paused_bounds);
  await page_instance.emulateMedia({ reducedMotion: 'reduce' });
  await page_instance.waitForFunction(() => getComputedStyle(document.querySelector('.card__scroll-content')).transform === 'none');
  assert.deepEqual(await screen_color(), HEADER_COLOR, 'Reset restores the initial filled band');
  const media_bounds = await page_instance.locator('.card__frame .card__frame-media').boundingBox();
  await page_instance.mouse.move(media_bounds.x + 80, media_bounds.y + 300);
  await page_instance.mouse.down();
  await page_instance.mouse.move(media_bounds.x + 80, media_bounds.y + 80, { steps: 5 });
  await page_instance.mouse.up();
  assert.deepEqual(await screen_color(), BODY_COLOR, 'Manual dragging must move both the band and screenshot');
  assert.deepEqual(await camera_position(), initial_camera);
  await page_instance.evaluate(() => window.detach_test_cards());
  assert.equal(await page_instance.locator('.card__scroll-content').evaluate(scroll_element => scroll_element.getAnimations().length), 0);
  // Fractional scale previously exposed a one-pixel seam.
  await page_instance.setViewportSize({ width: 391, height: 1100 });
  await verify_seam();
  console.log('Initial fill, seamless join at native/fractional sizes, scrolling surface, fixed camera, hover, reset, reduced-motion drag and detach verified.');
} finally {
  await browser_instance?.close();
  await vite_server.close();
}
