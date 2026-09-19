import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const browser_context = await browser_instance.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const page_instance = await browser_context.newPage();
try {
  for (const page_path of ['/', '/ru']) {
    await page_instance.goto(`http://jurenites.local${page_path}`, { waitUntil: 'load' });
    const figma_link = page_instance.locator('.footer-navigation a[data-footer-icon="brand-figma"]');
    const hover_text = figma_link.locator('.footer-navigation__hover-text');
    await figma_link.hover();
    assert.match(await hover_text.evaluate((text_node) => getComputedStyle(text_node).backgroundImage), /^linear-gradient\(90deg,/);
    assert.equal(await hover_text.evaluate((text_node) => getComputedStyle(text_node).backgroundClip), 'text');
    assert.equal(await hover_text.evaluate((text_node) => getComputedStyle(text_node).color), 'rgba(0, 0, 0, 0)');
    assert.equal(await figma_link.locator('[style]').count(), 0);
    assert.equal(await figma_link.getAttribute('style'), null);
    assert.equal(await figma_link.locator('.footer-navigation__external-mark').evaluate((icon_node) => getComputedStyle(icon_node).backgroundImage), 'none');
    await mkdir('artifacts/footer-menu', { recursive: true });
    await figma_link.screenshot({ path: `artifacts/footer-menu/figma-gradient${page_path === '/ru' ? '-ru' : ''}.png` });
    await page_instance.mouse.move(0, 0);
    await figma_link.focus();
    await page_instance.keyboard.press('Tab');
    await page_instance.keyboard.press('Shift+Tab');
    assert.equal(await figma_link.evaluate((link_node) => link_node.matches(':focus-visible')), true);
    assert.equal(await figma_link.locator('.footer-navigation__social-label-text--hover').evaluate((text_node) => getComputedStyle(text_node).visibility), 'visible');
    await page_instance.emulateMedia({ forcedColors: 'active' });
    assert.equal(await hover_text.evaluate((text_node) => getComputedStyle(text_node).backgroundImage), 'none');
    assert.notEqual(await hover_text.evaluate((text_node) => getComputedStyle(text_node).color), 'rgba(0, 0, 0, 0)');
    await page_instance.emulateMedia({ forcedColors: 'none' });
    // The site's existing no-JS intro intentionally shows only branding. Test
    // this component independently using its actual server-rendered markup/CSS.
    const footer_document = await page_instance.evaluate(() => '<!doctype html><html><head><base href="http://jurenites.local/">' + [...document.head.querySelectorAll('link[rel="stylesheet"], style')].map((style_node) => style_node.outerHTML).join('') + '</head><body class="jurenites-theme">' + document.querySelector('.footer-navigation').outerHTML + '</body></html>');
    const no_script_context = await browser_instance.newContext({ javaScriptEnabled: false });
    const no_script_page = await no_script_context.newPage();
    await no_script_page.setContent(footer_document, { waitUntil: 'load' });
    const no_script_link = no_script_page.locator('[data-footer-icon="brand-figma"]');
    await no_script_link.hover();
    assert.match(await no_script_link.locator('.footer-navigation__hover-text').evaluate((text_node) => getComputedStyle(text_node).backgroundImage), /^linear-gradient/);
    assert.equal(await no_script_link.locator('.icon__svg--active').isVisible(), true);
    assert.equal(await no_script_link.locator('.icon__svg--default').isVisible(), false);
    assert.equal((await no_script_link.locator('.icon--link-prefix').boundingBox()).width, 16);
    assert.equal((await no_script_link.locator('.icon--link-prefix').boundingBox()).height, 16);
    await no_script_context.close();
  }
  console.log('PASS: actual Figma gradient in EN/RU, isolated server-rendered component without JavaScript, text-only clipping, keyboard focus, forced-colors fallback.');
} finally {
  await browser_instance.close();
}
