import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser_instance = await chromium.launch();
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const runtime_errors = [];
  page_instance.on('pageerror', page_error => runtime_errors.push(page_error.message));
  await page_instance.goto('http://jurenites.local/', { waitUntil: 'domcontentloaded' });
  await page_instance.locator('.project-case-slider__pagination-slot .square-pagination').waitFor();
  const close_notice = page_instance.locator('.cookie-policy-notice__close');
  if (await close_notice.isVisible()) await close_notice.click();
  const slider_element = page_instance.locator('[data-project-slider]');
  await slider_element.scrollIntoViewIfNeeded();
  const dot_elements = slider_element.locator('.square-pagination__dot');
  assert.equal(await dot_elements.count(), 4);
  assert.equal(await slider_element.locator('[data-project-previous], [data-project-next], [data-project-count]').count(), 0);
  await dot_elements.nth(2).click();
  await page_instance.waitForFunction(() => document.querySelectorAll('[data-project-slider] .square-pagination__dot')[2].getAttribute('aria-pressed') === 'true');
  const track_element = slider_element.locator('[data-project-track]');
  await track_element.focus();
  await page_instance.keyboard.press('Home');
  await page_instance.waitForFunction(() => document.querySelector('[data-project-slider] .square-pagination__dot').getAttribute('aria-pressed') === 'true');
  await page_instance.waitForTimeout(300);
  console.log(await track_element.evaluate(track_node => ({ scroll_left: track_node.scrollLeft, track_width: track_node.clientWidth, projects: [...track_node.children].map(slide_node => ({ project_name: slide_node.querySelector('h2').textContent, left_edge: slide_node.getBoundingClientRect().left - track_node.getBoundingClientRect().left })) })));
  async function verify_placement() {
    const placement_state = await slider_element.evaluate(slider_node => {
      const pagination_node = slider_node.querySelector('.square-pagination');
      const copy_node = pagination_node.closest('.project-case-preview__copy');
      const last_paragraph = copy_node.querySelector('p:last-of-type');
      return {
        copy_left: copy_node.getBoundingClientRect().left,
        pagination_left: pagination_node.getBoundingClientRect().left,
        paragraph_bottom: last_paragraph.getBoundingClientRect().bottom,
        pagination_top: pagination_node.getBoundingClientRect().top,
      };
    });
    assert(Math.abs(placement_state.copy_left - placement_state.pagination_left) < 1);
    assert(placement_state.pagination_top >= placement_state.paragraph_bottom + 15);
  }
  await verify_placement();
  await slider_element.screenshot({ path: 'artifacts/square-pagination/home-desktop.png' });
  await page_instance.setViewportSize({ width: 375, height: 900 });
  await dot_elements.nth(3).click();
  await page_instance.waitForFunction(() => document.querySelectorAll('[data-project-slider] .square-pagination__dot')[3].getAttribute('aria-pressed') === 'true');
  await verify_placement();
  assert(await dot_elements.nth(3).evaluate(dot_node => document.activeElement === dot_node), 'Selection must preserve keyboard focus');
  await slider_element.screenshot({ path: 'artifacts/square-pagination/home-mobile.png' });
  await track_element.evaluate(track_node => track_node.scrollTo({ left: track_node.clientWidth, behavior: 'instant' }));
  await page_instance.waitForFunction(() => document.querySelectorAll('[data-project-slider] .square-pagination__dot')[1].getAttribute('aria-pressed') === 'true');
  await page_instance.emulateMedia({ reducedMotion: 'no-preference' });
  await dot_elements.nth(0).click();
  await page_instance.waitForFunction(() => document.querySelector('[data-project-track]').scrollLeft < 1);
  await verify_placement();
  assert(await dot_elements.nth(0).evaluate(dot_node => document.activeElement === dot_node));
  assert.deepEqual(runtime_errors, []);
  console.log('Home square pagination: four markers, direct selection, keyboard, scroll synchronization, desktop/mobile, no runtime errors: passed');
} finally { await browser_instance.close(); }
