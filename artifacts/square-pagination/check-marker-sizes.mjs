import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await page_instance.goto('http://jurenites.local/', { waitUntil: 'domcontentloaded' });
  const paginator_locator = page_instance.locator('.project-case-slider__pagination');
  await paginator_locator.waitFor();
  const close_notice = page_instance.locator('.cookie-policy-notice__close');
  if (await close_notice.isVisible()) await close_notice.click();
  for (const viewport_width of [1440,375]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    await paginator_locator.scrollIntoViewIfNeeded();
    const marker_states = await paginator_locator.locator('button').evaluateAll(button_nodes => button_nodes.map(button_node => {
      const marker_style = getComputedStyle(button_node, '::after');
      const button_style = getComputedStyle(button_node);
      return { width_value: parseFloat(marker_style.width), height_value: parseFloat(marker_style.height), alignment_value: button_style.alignItems, bottom_edge: button_node.getBoundingClientRect().bottom - parseFloat(button_style.paddingBottom) };
    }));
    assert.deepEqual(marker_states.map(marker_state => marker_state.width_value), [8,4,3,2]);
    assert(marker_states.every(marker_state => marker_state.width_value === marker_state.height_value && marker_state.alignment_value === 'end' && marker_state.bottom_edge === marker_states[0].bottom_edge));
    await paginator_locator.locator('button').nth(2).hover();
    const outline_state = await paginator_locator.locator('button').nth(2).evaluate(button_node => {
      const marker_style = getComputedStyle(button_node, '::after');
      return [marker_style.outlineWidth, marker_style.outlineStyle];
    });
    assert.deepEqual(outline_state, ['1px', 'solid']);
    await paginator_locator.screenshot({ path: `artifacts/square-pagination/markers-${viewport_width}.png` });
    console.log(`${viewport_width}px: 8x8, 4x4, 3x3, 2x2; common bottom edge; 1px solid hover outline`);
  }
} finally { await browser_instance.close(); }
