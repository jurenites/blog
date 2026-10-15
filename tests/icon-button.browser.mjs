import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const status_origin = 'http://test.jurenites.local';
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
  page_instance.setDefaultTimeout(30000);
  async function verify_geometry(button_locator) {
    const button_geometry = await button_locator.evaluate(button_element => {
      const button_bounds = button_element.getBoundingClientRect();
      const icon_element = [...button_element.querySelectorAll('icon')].find(icon_item => getComputedStyle(icon_item).display !== 'none');
      const icon_bounds = icon_element.querySelector('svg').getBoundingClientRect();
      return {
        uses_atom: button_element.classList.contains('icon-button'),
        uses_prefix: button_element.classList.contains('button--with-prefix-icon'),
        button_size: [button_bounds.width, button_bounds.height],
        icon_size: [icon_bounds.width, icon_bounds.height],
        edge_spacing: [icon_bounds.left - button_bounds.left, icon_bounds.top - button_bounds.top, button_bounds.right - icon_bounds.right, button_bounds.bottom - icon_bounds.bottom],
        corner_radius: getComputedStyle(button_element).borderRadius,
        accessible_label: button_element.getAttribute('aria-label'),
      };
    });
    assert.equal(button_geometry.uses_atom, true);
    assert.equal(button_geometry.uses_prefix, false);
    assert.deepEqual(button_geometry.button_size, [40, 40]);
    assert.ok(button_geometry.icon_size.every(pixel_value => Math.abs(pixel_value - 24) < 0.05));
    assert.ok(button_geometry.edge_spacing.every(pixel_value => Math.abs(pixel_value - 8) < 0.05), JSON.stringify(button_geometry));
    assert.equal(button_geometry.corner_radius, '0px');
    assert.ok(button_geometry.accessible_label);
  }
  for (const story_args of ['icon_name:cross-big;button_style:text', 'icon_name:trash-can;button_style:secondary', 'icon_name:plus;button_style:primary', 'icon_name:cross-big;is_disabled:true']) {
    await page_instance.goto(`${status_origin}/storybook/iframe.html?id=atoms-icon-button--default-story&viewMode=story&args=${encodeURIComponent(story_args)}`);
    const icon_button = page_instance.locator('#storybook-root .icon-button');
    await icon_button.waitFor();
    await verify_geometry(icon_button);
    const default_background = await icon_button.evaluate(button_element => getComputedStyle(button_element).backgroundColor);
    await icon_button.hover();
    if (story_args.includes('is_disabled:true')) {
      assert.equal(await icon_button.isDisabled(), true);
      assert.equal(await icon_button.evaluate(button_element => getComputedStyle(button_element).backgroundColor), default_background);
    } else {
      await page_instance.waitForFunction(previous_color => getComputedStyle(document.querySelector('#storybook-root .icon-button')).backgroundColor !== previous_color, default_background);
      await icon_button.focus();
      assert.equal(await icon_button.evaluate(button_element => button_element.matches(':focus-visible') && getComputedStyle(button_element).outlineStyle === 'solid'), true);
      await verify_geometry(icon_button);
    }
  }
  for (const [story_id, control_selector] of [
    ['organisms-footer-cookie-policy-notice--default-story', '.cookie-policy-notice__close'],
    ['organisms-blog-game-of-life--default-story', '.game-of-life__pause-button'],
    ['organisms-blog-font-preview-4pixel--interactive-preview', '.font-preview__path-toggle'],
  ]) {
    await page_instance.goto(`${status_origin}/storybook/iframe.html?id=${story_id}&viewMode=story`);
    if (story_id.includes('font-preview')) await page_instance.locator('.font-preview__glyph-tile').first().click();
    const control_button = page_instance.locator(control_selector);
    await control_button.waitFor({ state: 'visible' });
    await verify_geometry(control_button);
    if (story_id.includes('game-of-life')) {
      await control_button.click();
      await verify_geometry(control_button);
    }
  }
  await page_instance.route('**/api/status', async route_context => {
    const status_response = await route_context.fetch();
    const status_payload = await status_response.json();
    await route_context.fulfill({ response: status_response, json: { ...status_payload, workspaces: {} } });
  });
  await page_instance.route('**/api/workspace', route_context => route_context.fulfill({ json: route_context.request().postDataJSON().workspace_patch }));
  await page_instance.goto(`${status_origin}/#atoms-button`);
  await page_instance.locator('[data-remove-figma-png]').waitFor({ state: 'attached' });
  await page_instance.locator('[data-image-source="figma"] .visual-review__reference').hover();
  const reference_button = page_instance.locator('[data-remove-figma-png]');
  await verify_geometry(reference_button);
  await reference_button.focus();
  assert.equal(await reference_button.evaluate(button_element => getComputedStyle(button_element).clipPath), 'none');
  for (const icon_button of await page_instance.locator('.visual-review .icon-button').all()) await verify_geometry(icon_button);
  await page_instance.setViewportSize({ width: 390, height: 900 });
  for (const icon_button of await page_instance.locator('.visual-review .icon-button').all()) await verify_geometry(icon_button);
  const normal_button = page_instance.locator('[data-obtain-figma-png]');
  assert.equal(await normal_button.evaluate(button_element => button_element.classList.contains('icon-button')), false);
  assert.ok((await normal_button.boundingBox()).width >= 80);
  console.log('Icon-button: shared Storybook styles, all dashboard icon controls, 40/24/8px geometry, hover/focus, disabled and mobile layout passed.');
} finally {
  await browser_instance.close();
}
