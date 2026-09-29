import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
try {
 const page_instance = await browser_instance.newPage({ reducedMotion: 'reduce' });
 await page_instance.goto('http://jurenites.local/', { waitUntil: 'domcontentloaded' });
 const slider_locator = page_instance.locator('[data-project-slider]');
 const next_button = slider_locator.locator('.project-case-slider__arrow--next');
 const previous_button = slider_locator.locator('.project-case-slider__arrow--previous');
 await next_button.waitFor();
 const close_notice = page_instance.locator('.cookie-policy-notice__close');
 if (await close_notice.isVisible()) await close_notice.click();
 for (const viewport_width of [1440,375]) {
  await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
  await slider_locator.scrollIntoViewIfNeeded();
  await next_button.click();
  await page_instance.waitForFunction(() => document.querySelectorAll('.project-case-slider__pagination .square-pagination__dot')[1].getAttribute('aria-pressed') === 'true');
  await previous_button.focus();
  await page_instance.keyboard.press('Enter');
  await page_instance.waitForFunction(() => document.querySelector('.project-case-slider__pagination .square-pagination__dot').getAttribute('aria-pressed') === 'true');
  const geometry_state = await slider_locator.evaluate(slider_node => {
   const slider_rect = slider_node.getBoundingClientRect();
   return [...slider_node.querySelectorAll('.project-case-slider__arrow')].map(button_node => {
    const button_rect = button_node.getBoundingClientRect();
    return { center_difference: button_rect.top + button_rect.height / 2 - slider_rect.top - slider_rect.height / 2, ghost_button: button_node.classList.contains('button--ghost'), has_chevron: Boolean(button_node.querySelector('svg path')), outside_track: !slider_node.querySelector('[data-project-track]').contains(button_node) };
   });
  });
  assert(geometry_state.every(button_state => Math.abs(button_state.center_difference) < 1 && button_state.ghost_button && button_state.has_chevron && button_state.outside_track));
  if (viewport_width === 375) {
   assert(await slider_locator.evaluate(slider_node => slider_node.querySelector('.project-case-slider__pagination').getBoundingClientRect().top > slider_node.querySelector('.project-case-preview__copy p:last-of-type').getBoundingClientRect().bottom));
  }
  await slider_locator.screenshot({ path: `artifacts/square-pagination/arrows-${viewport_width}.png` });
  console.log(`${viewport_width}px: ghost chevrons, fixed side positions, vertical centering, next click and previous keyboard navigation passed`);
 }
} finally { await browser_instance.close(); }
