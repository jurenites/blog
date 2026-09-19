import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const BRAND_COLORS = [
  ['social-linkedin', 'rgb(40, 103, 178)'],
  ['social-facebook', 'rgb(24, 119, 242)'],
  ['social-vk', 'rgb(0, 119, 255)'],
  ['social-youtube', 'rgb(255, 0, 51)'],
  ['social-soundcloud', 'rgb(255, 85, 0)'],
  ['social-steam', 'rgb(102, 192, 244)'],
  ['brand-telegram', 'rgb(42, 171, 238)'],
  ['brand-gmail', 'rgb(234, 67, 53)'],
  ['brand-yandex-mail', 'rgb(255, 204, 0)'],
  ['brand-github', 'rgb(15, 191, 62)'],
  ['brand-storybook', 'rgb(255, 71, 133)'],
  ['brand-hh', 'rgb(255, 0, 2)'],
];
const STORYBOOK_URL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6017';
const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage();

async function check_link_color(link_node, color_value) {
  await page_instance.mouse.move(0, 0);
  await page_instance.evaluate(() => document.activeElement?.blur());
  const prefix_icon = link_node.locator('.icon--link-prefix');
  const has_active_icon = await prefix_icon.locator('.icon__svg--active').count();
  if (!has_active_icon) {
    assert.equal(await prefix_icon.locator('path:not(mask path, defs path, clipPath path)').first().evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(255, 255, 255)');
  }
  await link_node.hover();
  await page_instance.waitForFunction(({ selector_text, expected_color }) =>
    getComputedStyle(document.querySelector(selector_text)).color === expected_color,
  { selector_text: await link_node.evaluate((element_node) => `[${element_node.hasAttribute('data-footer-icon') ? 'data-footer-icon' : 'data-social-icon'}="${element_node.getAttribute('data-footer-icon') || element_node.getAttribute('data-social-icon')}"]`), expected_color: color_value });
  if (!has_active_icon) {
    assert.equal(await prefix_icon.locator('path:not(mask path, defs path, clipPath path)').first().evaluate((path_node) => getComputedStyle(path_node).fill), color_value);
  }
  for (const mask_path of await prefix_icon.locator('mask path').all()) {
    assert.equal(await mask_path.evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(255, 255, 255)');
  }
  await page_instance.mouse.move(0, 0);
  await link_node.focus();
  await page_instance.keyboard.press('Tab');
  await page_instance.keyboard.press('Shift+Tab');
  assert.equal(await link_node.evaluate((element_node) => element_node.matches(':focus-visible')), true);
  await page_instance.waitForFunction(({ element_node, expected_color }) =>
    getComputedStyle(element_node).color === expected_color,
  { element_node: await link_node.elementHandle(), expected_color: color_value });
  assert.equal(await link_node.evaluate((element_node) => getComputedStyle(element_node).color), color_value);
}

async function check_prefix_geometry() {
  for (const prefix_icon of await page_instance.locator('.footer-navigation .icon--link-prefix').all()) {
    const icon_bounds = await prefix_icon.boundingBox();
    assert.equal(icon_bounds.width, 16);
    assert.equal(icon_bounds.height, 16);
    for (const svg_node of await prefix_icon.locator(':scope > svg').all()) {
      assert.equal(await svg_node.getAttribute('viewBox'), '0 0 16 16');
      assert.equal(await svg_node.getAttribute('width'), null);
      assert.equal(await svg_node.getAttribute('height'), null);
      if (await svg_node.isVisible()) {
        const svg_bounds = await svg_node.boundingBox();
        assert.deepEqual(svg_bounds, icon_bounds);
      }
    }
  }
  // Trailing link marks keep their shared Icon dimensions.
  const trailing_icon = page_instance.locator('.footer-navigation__external-mark').first();
  assert.equal(await trailing_icon.evaluate((icon_node) => getComputedStyle(icon_node).width), '24px');
}

async function check_artwork(icon_attribute, messenger_prefix) {
  for (const icon_name of ['brand-figma', 'brand-gmail', 'brand-yandex-mail']) {
    const prefix_name = icon_name === 'brand-figma' ? '' : messenger_prefix;
    const brand_link = page_instance.locator(`[${icon_attribute}="${prefix_name}${icon_name}"]`);
    const default_icon = brand_link.locator('.icon--link-prefix > .icon__svg--default');
    const active_icon = brand_link.locator('.icon--link-prefix > .icon__svg--active');
    await page_instance.mouse.move(0, 0);
    await page_instance.evaluate(() => document.activeElement?.blur());
    assert.equal(await default_icon.evaluate((svg_node) => getComputedStyle(svg_node).display), 'block');
    assert.equal(await active_icon.evaluate((svg_node) => getComputedStyle(svg_node).display), 'none');
    assert.equal(await default_icon.locator('path').first().evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(255, 255, 255)');
    await brand_link.hover();
    assert.equal(await default_icon.evaluate((svg_node) => getComputedStyle(svg_node).display), 'none');
    assert.equal(await active_icon.evaluate((svg_node) => getComputedStyle(svg_node).display), 'block');
    if (icon_name === 'brand-figma') {
      assert.equal(await active_icon.locator('path').first().evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(10, 207, 131)');
    } else if (icon_name === 'brand-gmail') {
      assert.equal(await active_icon.locator('path').nth(1).evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(252, 65, 61)');
      assert.equal(await active_icon.locator('stop').first().evaluate((stop_node) => getComputedStyle(stop_node).stopColor), 'rgb(96, 214, 115)');
    } else {
      // The supplied active envelope retains white underlay paths before its color layers.
      assert.equal(await active_icon.locator('path[fill="#FFDA3E"]').evaluate((path_node) => getComputedStyle(path_node).fill), 'rgb(255, 218, 62)');
    }
    await page_instance.mouse.move(0, 0);
    await brand_link.focus();
    await page_instance.keyboard.press('Tab');
    await page_instance.keyboard.press('Shift+Tab');
    assert.equal(await brand_link.evaluate((link_node) => link_node.matches(':focus-visible')), true);
    assert.equal(await active_icon.evaluate((svg_node) => getComputedStyle(svg_node).display), 'block');
    await check_prefix_geometry();
    if (icon_name !== 'brand-figma') assert.equal(await brand_link.getAttribute('target'), null);
  }
}

try {
  for (const viewport_width of [1280, 390]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 1000 });
    for (const language_path of ['/', '/ru']) {
      await page_instance.goto(`http://jurenites.local${language_path}`, { waitUntil: 'networkidle' });
      const notice_dismiss = page_instance.locator('[data-jurenites-cookie-policy-dismiss]');
      if (await notice_dismiss.isVisible()) await notice_dismiss.click();
      for (const [icon_name, color_value] of BRAND_COLORS) {
        await check_link_color(page_instance.locator(`[data-footer-icon="${icon_name}"]`), color_value);
      }
      await check_artwork('data-footer-icon', '');
      assert.equal(await page_instance.locator('.footer-navigation [style]').count(), 0);
      assert.ok(await page_instance.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    }
  }
  await page_instance.goto(`${STORYBOOK_URL}/iframe.html?id=organisms-footer-navigation--default-story&viewMode=story`, { waitUntil: 'networkidle' });
  await page_instance.locator('.footer-navigation--demo').waitFor();
  for (const [icon_name, color_value] of BRAND_COLORS.filter(([icon_name]) => ['social-youtube', 'brand-telegram', 'brand-gmail', 'brand-yandex-mail', 'brand-github', 'brand-storybook'].includes(icon_name))) {
    const messenger_prefix = ['brand-telegram', 'brand-gmail', 'brand-yandex-mail'].includes(icon_name) ? 'messenger-' : '';
    await check_link_color(page_instance.locator(`[data-social-icon="${messenger_prefix}${icon_name}"]`), color_value);
  }
  await check_artwork('data-social-icon', 'messenger-');
  const figma_link = page_instance.locator('[data-social-icon="brand-figma"]');
  await figma_link.hover();
  assert.match(await figma_link.locator('.footer-navigation__resource-label-text--hover > span').evaluate((text_node) => getComputedStyle(text_node).backgroundImage), /^linear-gradient/);
  console.log('PASS: all local brand hover/focus colors, EN/RU desktop/mobile, 16px prefix viewports, separate active artwork, preserved white defaults, mail behavior, Storybook demo paint and gradient.');
}
finally {
  await browser_instance.close();
}
