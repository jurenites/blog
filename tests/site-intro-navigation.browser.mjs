import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage();
await page_instance.addInitScript(() => {
  localStorage.setItem('jurenites.site-intro', JSON.stringify({ loading: true, shown_at: Date.now() }));
});

try {
  for (const route_path of ['/videos', '/']) {
    await page_instance.goto(`http://jurenites.local${route_path}`, { waitUntil: 'load' });
    await page_instance.evaluate(() => document.fonts.ready);
    for (const viewport_width of [375, 768, 1280, 1440, 1920]) {
      await page_instance.setViewportSize({ width: viewport_width, height: 900 });
      const layout_samples = await page_instance.evaluate(() => {
        const root_element = document.documentElement;
        const sampled_selectors = ['.site-header', '#site-header-primary-navigation', '.site-header__language', '.site-header__menu-toggle'];
        function read_header_positions() {
          return sampled_selectors.map((target_selector) => {
            const target_bounds = document.querySelector(target_selector).getBoundingClientRect();
            return { target_selector, position_x: target_bounds.x, position_y: target_bounds.y, box_width: target_bounds.width, box_height: target_bounds.height };
          });
        }
        const settled_positions = read_header_positions();
        root_element.setAttribute('data-site-intro', 'running');
        const intro_animations = document.getAnimations().filter((animation_item) => animation_item.animationName?.startsWith('site-intro-'));
        const sampled_positions = [0, 700, 1700, 1900].map((elapsed_duration) => {
          for (const animation_item of intro_animations) {
            animation_item.pause();
            animation_item.currentTime = elapsed_duration;
          }
          return { elapsed_duration, header_positions: read_header_positions() };
        });
        root_element.removeAttribute('data-site-intro');
        return { settled_positions, sampled_positions, restored_positions: read_header_positions() };
      });
      for (const layout_sample of layout_samples.sampled_positions) {
        assert.deepEqual(layout_sample.header_positions, layout_samples.settled_positions,
          `${route_path} at ${viewport_width}px: header moved at ${layout_sample.elapsed_duration}ms`);
      }
      assert.deepEqual(layout_samples.restored_positions, layout_samples.settled_positions);
      console.log(`${route_path} ${viewport_width}px: navigation, language picker, and header stay in their final positions.`);
    }
  }
} finally {
  await browser_instance.close();
}
