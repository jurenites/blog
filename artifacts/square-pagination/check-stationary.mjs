import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
  const runtime_errors = [];
  page_instance.on('pageerror', page_error => runtime_errors.push(page_error.message));
  await page_instance.goto('http://jurenites.local/', { waitUntil: 'domcontentloaded' });
  const pagination_locator = page_instance.locator('.project-case-slider > .project-case-slider__pagination');
  await pagination_locator.waitFor();
  const close_notice = page_instance.locator('.cookie-policy-notice__close');
  if (await close_notice.isVisible()) await close_notice.click();
  const slider_locator = page_instance.locator('[data-project-slider]');
  for (const viewport_width of [1440, 375]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    await slider_locator.scrollIntoViewIfNeeded();
    await page_instance.locator('[data-project-track]').evaluate(track_node => track_node.scrollTo({ left: 0, behavior: 'instant' }));
    await page_instance.waitForTimeout(100);
    const result_state = await slider_locator.evaluate(async slider_node => {
      const pagination_node = slider_node.querySelector('.project-case-slider__pagination');
      const track_node = slider_node.querySelector('[data-project-track]');
      const start_rect = pagination_node.getBoundingClientRect();
      const frame_states = [];
      pagination_node.querySelectorAll('button')[3].click();
      for (let frame_index = 0; frame_index < 80; frame_index += 1) {
        await new Promise(resolve_frame => requestAnimationFrame(resolve_frame));
        const page_rect = pagination_node.getBoundingClientRect();
        frame_states.push({ left_shift: page_rect.left - start_rect.left, top_shift: page_rect.top - start_rect.top, scroll_left: track_node.scrollLeft });
      }
      const active_copy = track_node.children[3].querySelector('.project-case-preview__copy');
      return {
        position_mode: getComputedStyle(pagination_node).position,
        outside_track: !track_node.contains(pagination_node),
        frame_states,
        expected_scroll: track_node.clientWidth * 3,
        final_scroll: track_node.scrollLeft,
        copy_left: active_copy.getBoundingClientRect().left,
        pagination_left: pagination_node.getBoundingClientRect().left,
        copy_bottom: active_copy.querySelector('p:last-of-type').getBoundingClientRect().bottom,
        pagination_top: pagination_node.getBoundingClientRect().top,
      };
    });
    assert.equal(result_state.position_mode, 'absolute');
    assert(result_state.outside_track);
    assert(result_state.frame_states.every(frame_state => Math.abs(frame_state.left_shift) < 1 && Math.abs(frame_state.top_shift) < 1));
    assert(result_state.frame_states.some(frame_state => frame_state.scroll_left > 0 && frame_state.scroll_left < result_state.expected_scroll));
    assert(Math.abs(result_state.final_scroll - result_state.expected_scroll) < 1);
    assert(Math.abs(result_state.copy_left - result_state.pagination_left) < 1);
    assert(result_state.pagination_top >= result_state.copy_bottom + 15);
    await slider_locator.screenshot({ path: `artifacts/square-pagination/stationary-${viewport_width}.png` });
    console.log(`${viewport_width}px: absolute, outside track, stationary across 80 animation frames, aligned beneath copy`);
  }
  assert.deepEqual(runtime_errors, []);
} finally { await browser_instance.close(); }
