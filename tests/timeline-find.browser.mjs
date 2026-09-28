import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ reducedMotion: 'reduce' });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
const settle_scroll = () => page_instance.evaluate(async () => {
  for (let frame_index = 0; frame_index < 6; frame_index += 1) {
    await new Promise(requestAnimationFrame);
  }
});
try {
  await page_instance.goto(process.env.TIMELINE_TEST_URL || 'http://jurenites.local/timeline');
  await page_instance.locator('.timeline__details-window').waitFor();
  await page_instance.evaluate(() => document.fonts.ready);
  await page_instance.waitForFunction(() => !document.body.inert && !document.documentElement.hasAttribute('data-site-intro'));
  for (const viewport_size of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
    await page_instance.setViewportSize(viewport_size);
    await settle_scroll();
    // A single native animated reveal must finish without another Find click.
    // Instant-only tests missed the scrollTop write cancelling its first frame.
    for (const motion_preference of ['no-preference', 'reduce']) {
      await page_instance.emulateMedia({ reducedMotion: motion_preference });
      for (const destination_fraction of [0.85, 0.1, 0.85]) {
        const target_offset = await page_instance.evaluate((destination_fraction) => {
          const project_window = document.querySelector('.timeline__details-window');
          const target_offset = Math.round((project_window.scrollHeight - project_window.clientHeight)
            * destination_fraction);
          project_window.scrollTo({ top: target_offset, behavior: 'smooth' });
          return target_offset;
        }, destination_fraction);
        await page_instance.waitForFunction((target_offset) =>
          Math.abs(document.querySelector('.timeline__details-window').scrollTop - target_offset) <= 2,
        target_offset, { timeout: 4000 });
        await settle_scroll();
        await page_instance.evaluate(() => dispatchEvent(new Event('scroll')));
        await settle_scroll();
        assert.ok(Math.abs(await page_instance.locator('.timeline__details-window')
          .evaluate((project_window) => project_window.scrollTop) - target_offset) <= 2,
        'One browser reveal reaches its destination and survives calendar synchronization.');
      }
    }
    await page_instance.evaluate(() => {
      getSelection().removeAllRanges();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await settle_scroll();
    // window.find exposes ranges but does not reveal nested scrollers like the
    // Find toolbar. Follow it with native scrollIntoView to exercise the same
    // inner/outer scroll event race; center the exact range for paragraphs taller
    // than the mobile viewport. Verify the real toolbar separately.
    for (const search_backwards of [false, true]) {
      for (let match_index = 0; match_index < 30; match_index += 1) {
        assert.ok(await page_instance.evaluate((search_backwards) =>
          {
            const found_match = window.find('design', false, search_backwards, true);
            if (found_match) {
              getSelection().getRangeAt(0).startContainer.parentElement
                .scrollIntoView({ block: 'center', behavior: 'instant' });
              const match_bounds = getSelection().getRangeAt(0).getBoundingClientRect();
              const project_window = document.querySelector('.timeline__details-window');
              const window_bounds = project_window.getBoundingClientRect();
              project_window.scrollBy({
                top: match_bounds.top - window_bounds.top - project_window.clientHeight / 2,
                behavior: 'instant',
              });
            }
            return found_match;
          }, search_backwards));
        await settle_scroll();
        const match_state = await page_instance.evaluate(() => {
          const selected_range = getSelection().getRangeAt(0);
          const match_bounds = selected_range.getBoundingClientRect();
          const project_window = document.querySelector('.timeline__details-window');
          const window_bounds = project_window.getBoundingClientRect();
          return {
            match_text: selected_range.toString().toLowerCase(),
            match_top: match_bounds.top,
            match_bottom: match_bounds.bottom,
            visible_top: Math.max(0, window_bounds.top),
            visible_bottom: Math.min(innerHeight, window_bounds.bottom),
          };
        });
        assert.equal(match_state.match_text, 'design');
        assert.ok(match_state.match_top >= match_state.visible_top - 2
          && match_state.match_bottom <= match_state.visible_bottom + 2, JSON.stringify(match_state));
      }
    }
    console.log(viewport_size.width + ': forward, backward and wrapped browser-revealed matches stay visible.');
  }
  assert.deepEqual(runtime_errors, []);
} finally {
  await browser_instance.close();
}
