import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true, channel: 'chrome' });
const browser_context = await browser_instance.newContext({ viewport: { width: 1440, height: 1000 } });
browser_context.setDefaultTimeout(15000);
const page_instance = await browser_context.newPage();
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
await mkdir('artifacts/technology-stack', { recursive: true });

async function visible_panel(technology_tile) {
  const tooltip_panel = technology_tile.locator('.technology-stack__tooltip');
  await tooltip_panel.waitFor({ state: 'visible' });
  const tile_bounds = await technology_tile.boundingBox();
  const panel_bounds = await tooltip_panel.boundingBox();
  assert(panel_bounds.y >= tile_bounds.y + tile_bounds.height + 7
    || panel_bounds.y + panel_bounds.height <= tile_bounds.y - 7, 'Panel stays outside its tile.');
  assert(panel_bounds.x >= 0 && panel_bounds.x + panel_bounds.width <= page_instance.viewportSize().width, 'Panel stays inside viewport.');
  return tooltip_panel;
}

try {
  await page_instance.goto('http://jurenites.local/about', { waitUntil: 'domcontentloaded' });
  const cookie_close = page_instance.locator('.cookie-policy-notice__close');
  if (await cookie_close.isVisible()) await cookie_close.click();
  const stack_element = page_instance.locator('[data-technology-stack]');
  const technology_tiles = stack_element.locator('.technology-stack__tile');
  await stack_element.scrollIntoViewIfNeeded();
  assert.equal(await technology_tiles.count(), 15);
  await page_instance.waitForFunction(() => document.querySelector('[data-technology-ready]'));
  assert.equal(await stack_element.locator('a.technology-stack__tile').count(), 0);
  assert.equal(await stack_element.locator('.technology-stack__tooltip > a.technology-stack__link').count(), 15);
  assert.deepEqual(await stack_element.locator('.technology-stack__item').evaluateAll(tile_nodes =>
    [...new Set(tile_nodes.map(tile_node => getComputedStyle(tile_node).backgroundColor))]), ['rgb(15, 23, 43)']);
  assert.equal(await stack_element.locator('[style], img[width], img[height]').count(), 0);
  assert.equal((await stack_element.boundingBox()).width, 960);
  assert.equal((await technology_tiles.first().boundingBox()).width, 160);
  console.log('Desktop grid:', await stack_element.evaluate(stack_node => ({
    width: stack_node.getBoundingClientRect().width,
    columns: getComputedStyle(stack_node.querySelector('ul')).gridTemplateColumns,
    ancestors: [stack_node.parentElement.id, stack_node.parentElement.parentElement.className],
  })));
  const first_tile = technology_tiles.nth(0);
  await first_tile.hover();
  assert.equal(await first_tile.locator('.technology-stack__tooltip').isVisible(), false, 'Hover waits before showing the panel.');
  const first_panel = await visible_panel(first_tile);
  const first_bounds = await first_tile.boundingBox();
  assert(Math.abs(first_bounds.width - first_bounds.height) < 1);
  const panel_bounds = await first_panel.boundingBox();
  await page_instance.mouse.move(panel_bounds.x + panel_bounds.width / 2, panel_bounds.y + panel_bounds.height / 2, { steps: 12 });
  assert(await first_panel.isVisible(), 'Pointer can enter the panel without closing it.');
  await page_instance.waitForTimeout(1200);
  assert(await first_panel.isVisible(), 'Holding the pointer inside the tooltip cancels closure.');
  for (const [horizontal_fraction, vertical_fraction] of [[0.05, 0.05], [0.95, 0.95], [0.5, 0.75]]) {
    await page_instance.mouse.move(panel_bounds.x + panel_bounds.width * horizontal_fraction, panel_bounds.y + panel_bounds.height * vertical_fraction, { steps: 12 });
    await page_instance.waitForTimeout(400);
    assert(await first_panel.isVisible(), 'Tooltip padding, text and link retain hover.');
    assert(await first_tile.evaluate(tile_node => tile_node.classList.contains('is-active')));
  }
  await page_instance.mouse.move(0, 0);
  await first_panel.waitFor({ state: 'hidden' });
  await first_tile.hover();
  await visible_panel(first_tile);
  const hovered_colors = await first_tile.evaluate(link_element => ({
    surface: getComputedStyle(link_element.querySelector('.technology-stack__highlight')).backgroundColor,
    logo: getComputedStyle(link_element.querySelector('.technology-stack__logo--color')).visibility,
    name: getComputedStyle(link_element.querySelector('.technology-stack__name')).color,
  }));
  assert.equal(hovered_colors.surface, 'rgb(248, 250, 252)');
  assert.equal(hovered_colors.logo, 'visible');
  assert.equal(hovered_colors.name, 'rgb(102, 255, 255)');
  await first_tile.press('Escape');
  assert.equal(await first_panel.isVisible(), false);
  await page_instance.mouse.move(0, 0);
  await first_tile.press('Tab');
  await visible_panel(technology_tiles.nth(1));
  assert.equal(await technology_tiles.nth(1).evaluate(link_element => getComputedStyle(link_element.querySelector('.technology-stack__highlight')).backgroundColor), 'rgb(248, 250, 252)');
  await technology_tiles.nth(1).press('Tab');
  assert(await technology_tiles.nth(1).locator('.technology-stack__link').evaluate(link_node => link_node === document.activeElement));
  await technology_tiles.nth(1).locator('.technology-stack__link').press('Escape');
  assert(await technology_tiles.nth(1).evaluate(tile_node => tile_node === document.activeElement));
  await technology_tiles.nth(5).hover();
  await visible_panel(technology_tiles.nth(5));
  await stack_element.screenshot({ path: 'artifacts/technology-stack/desktop.png' });
  await page_instance.emulateMedia({ reducedMotion: 'reduce' });
  await technology_tiles.nth(6).focus();
  assert.equal(await stack_element.locator('.technology-stack__highlight').evaluate(highlight_node => highlight_node.getAnimations().length), 0);
  for (const viewport_width of [960, 640, 375, 360]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 800 });
    await technology_tiles.nth(0).hover();
    await visible_panel(technology_tiles.nth(0));
    assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth), viewport_width);
    await technology_tiles.nth(viewport_width <= 400 ? 1 : viewport_width <= 640 ? 2 : 5).hover();
    await visible_panel(technology_tiles.nth(viewport_width <= 400 ? 1 : viewport_width <= 640 ? 2 : 5));
  }
  await stack_element.screenshot({ path: 'artifacts/technology-stack/mobile.png' });
  await page_instance.setViewportSize({ width: 1440, height: 700 });
  await first_tile.evaluate(link_element => window.scrollBy(0, link_element.getBoundingClientRect().bottom - window.innerHeight + 20));
  await first_tile.hover();
  await visible_panel(first_tile);
  assert.equal(await first_tile.getAttribute('data-panel-position'), 'top');
  await page_instance.setViewportSize({ width: 1440, height: 1000 });
  const last_tile = technology_tiles.last();
  await last_tile.evaluate(tile_node => window.scrollBy(0, tile_node.getBoundingClientRect().bottom - window.innerHeight + 200));
  await last_tile.hover();
  const last_panel = await visible_panel(last_tile);
  assert.equal(await last_tile.getAttribute('data-panel-position'), 'bottom');
  const overlap_result = await last_panel.evaluate(panel_node => {
    const panel_bounds = panel_node.getBoundingClientRect();
    const skills_bounds = document.querySelector('#block-jurenites-theme-about-skills').getBoundingClientRect();
    const overlap_left = Math.max(panel_bounds.left, skills_bounds.left);
    const overlap_right = Math.min(panel_bounds.right, skills_bounds.right);
    const overlap_top = Math.max(panel_bounds.top, skills_bounds.top);
    const overlap_bottom = Math.min(panel_bounds.bottom, skills_bounds.bottom);
    return {
      has_overlap: overlap_right > overlap_left && overlap_bottom > overlap_top,
      panel_on_top: panel_node.contains(document.elementFromPoint((overlap_left + overlap_right) / 2, (overlap_top + overlap_bottom) / 2)),
    };
  });
  assert(overlap_result.has_overlap, 'Exercise the panel overlapping the following skills block.');
  assert(overlap_result.panel_on_top, 'Tooltip must receive pointer events above the skills block.');
  await last_tile.click();
  await last_tile.click();
  assert.equal(page_instance.url(), 'http://jurenites.local/about', 'Tile clicks never navigate.');
  await page_instance.route('https://www.capcut.com/**', route_context => route_context.fulfill({ body: 'Technology destination' }));
  await last_tile.locator('.technology-stack__link').click();
  await page_instance.waitForURL('https://www.capcut.com/');
  await page_instance.goto('http://jurenites.local/obo', { waitUntil: 'domcontentloaded' });
  assert.equal(await page_instance.locator('[data-technology-ready] .technology-stack__tile').count(), 15);

  const touch_context = await browser_instance.newContext({ viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true });
  const touch_page = await touch_context.newPage();
  await touch_page.goto('http://jurenites.local/about', { waitUntil: 'domcontentloaded' });
  const touch_tile = touch_page.locator('.technology-stack__tile').first();
  await touch_tile.tap();
  assert.equal(touch_page.url(), 'http://jurenites.local/about');
  await touch_tile.locator('.technology-stack__tooltip').waitFor({ state: 'visible', timeout: 1000 });
  await touch_page.route('https://html.spec.whatwg.org/**', route_context => route_context.fulfill({ body: 'Technology destination' }));
  await touch_tile.tap();
  assert.equal(touch_page.url(), 'http://jurenites.local/about', 'Repeated tile taps never navigate.');
  await touch_tile.locator('.technology-stack__link').tap();
  await touch_page.waitForURL('https://html.spec.whatwg.org/');
  await touch_context.close();

  const fallback_context = await browser_instance.newContext({ javaScriptEnabled: false });
  const fallback_page = await fallback_context.newPage();
  await fallback_page.goto('http://jurenites.local/about');
  // The site's intentional no-JS intro displays branding only. Verify the
  // unenhanced server-rendered component independently of that page overlay.
  const fallback_markup = await fallback_page.locator('.technology-stack').evaluate(stack_node => stack_node.outerHTML);
  await fallback_page.setContent(`<html><head><link rel="stylesheet" href="http://jurenites.local/themes/custom/jurenites_theme/css/style.min.css"></head><body class="jurenites-theme">${fallback_markup}</body></html>`);
  const fallback_tile = fallback_page.locator('.technology-stack__tile').first();
  await fallback_tile.hover();
  await fallback_tile.locator('.technology-stack__tooltip').waitFor({ state: 'visible' });
  assert.equal(await fallback_page.locator('.technology-stack__tile').count(), 15);
  await fallback_context.close();
  await page_instance.goto('http://storybook.jurenites.local/iframe.html?id=organisms-technology-stack--default-stack&viewMode=story', { waitUntil: 'domcontentloaded' });
  const story_stack = page_instance.locator('[data-technology-ready]');
  await story_stack.waitFor();
  assert.equal(await story_stack.locator('.technology-stack__tile').count(), 15);
  await story_stack.locator('.technology-stack__tile').nth(10).hover();
  await visible_panel(story_stack.locator('.technology-stack__tile').nth(10));
  assert.equal(await story_stack.locator('[style], img[width], img[height]').count(), 0);
  assert.deepEqual(runtime_errors, []);
  console.log('Technology tiles: desktop/mobile, inversion, delayed hover, panel bridge/placement, Escape, keyboard, touch link, Russian route, reduced motion, isolated no-JS component and Storybook passed.');
} finally {
  await browser_instance.close();
}
