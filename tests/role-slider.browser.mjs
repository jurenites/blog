import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
try {
  await page_instance.goto('http://jurenites.local/about', { waitUntil: 'networkidle' });
  const cookie_close = page_instance.locator('.cookie-policy-notice__close');
  if (await cookie_close.isVisible()) await cookie_close.click();
  const role_slider = page_instance.locator('[data-role-slider]');
  console.log('Slider count:', await role_slider.count());
  console.log('Tabs:', await role_slider.locator('.role-slider__tab').allTextContents());
  console.log('Errors:', runtime_errors);
  assert.equal(await page_instance.locator('#block-jurenites-theme-numeric-values .numeric-values__tile').count(), 2);
  assert.equal(await role_slider.getAttribute('data-role-ready'), 'true');
  assert.equal(await role_slider.locator('[role=tab]').count(), 3);
  assert.equal(await role_slider.locator('.role-slider__controls').count(), 0);
  await role_slider.scrollIntoViewIfNeeded();
  const initial_height = await role_slider.evaluate((slider_element) => slider_element.getBoundingClientRect().height);
  await role_slider.locator('.role-slider__tile').nth(1).click({ position: { x: 8, y: 8 } });
  assert.equal(await role_slider.locator('[role=tab]').nth(1).getAttribute('aria-selected'), 'true');
  assert.equal(await role_slider.locator('.role-slider__panel.is-active').getAttribute('aria-hidden'), 'false');
  assert.equal(await role_slider.evaluate((slider_element) => slider_element.getBoundingClientRect().height), initial_height);
  await role_slider.locator('[role=tab]').nth(1).press('End');
  assert.equal(await role_slider.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true');
  await role_slider.locator('[role=tab]').nth(2).press('Home');
  assert.equal(await role_slider.locator('[role=tab]').nth(0).getAttribute('aria-selected'), 'true');
  assert.equal(await role_slider.locator('.role-slider__tile').first().evaluate((tile_element) => getComputedStyle(tile_element).outlineStyle), 'solid');
  await role_slider.locator('.role-slider__number').nth(2).click();
  assert.equal(await role_slider.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true');
  const caption_link = role_slider.locator('.numeric-values__caption-link').first();
  const popup_wait = page_instance.waitForEvent('popup');
  await caption_link.click();
  const tracking_popup = await popup_wait;
  await tracking_popup.close();
  assert.equal(await role_slider.locator('[role=tab]').nth(2).getAttribute('aria-selected'), 'true', 'Tracking links must not select their tile.');
  await page_instance.waitForTimeout(600);
  await role_slider.screenshot({ path: 'artifacts/role-slider/desktop.png' });
  for (const screen_width of [375, 360]) {
    await page_instance.setViewportSize({ width: screen_width, height: 800 });
    await role_slider.scrollIntoViewIfNeeded();
    await role_slider.locator('.role-slider__tile').nth(1).click({ position: { x: 8, y: 8 } });
    assert.equal(await role_slider.locator('[role=tab]').nth(1).getAttribute('aria-selected'), 'true');
    assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth), screen_width);
    await page_instance.waitForTimeout(600);
    await role_slider.screenshot({ path: `artifacts/role-slider/mobile-${screen_width}.png` });
  }
  await page_instance.emulateMedia({ reducedMotion: 'reduce' });
  await role_slider.locator('[role=tab]').nth(0).click();
  assert.equal(await role_slider.locator('.role-slider__panel.is-active').evaluate((panel_element) => panel_element.getAnimations().length), 0);
  await page_instance.setViewportSize({ width: 1440, height: 1000 });
  const login_url = execFileSync('docker', ['exec', 'blog_jurenites_web', 'vendor/bin/drush', 'user:login', '--uid=1', '--uri=http://jurenites.local'], { encoding: 'utf8' }).trim();
  await page_instance.goto(login_url, { waitUntil: 'networkidle' });
  await page_instance.goto('http://jurenites.local/node/add/page', { waitUntil: 'networkidle' });
  await page_instance.waitForFunction(() => Drupal.CKEditor5Instances?.size > 0);
  console.log('Editor loaded.');
  console.log(await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()].map((editor_instance) => ({
    plugins_ready: editor_instance.plugins.has('ExpandingText'), toolbar: [...editor_instance.ui.componentFactory.names()].filter((button_name) => button_name.toLowerCase().includes('expand')),
  }))));
  await page_instance.evaluate(() => {
    const editor_instance = [...Drupal.CKEditor5Instances.values()][0];
    editor_instance.setData('<p>I care about context.</p>');
    editor_instance.model.change((model_writer) => {
      const paragraph_element = editor_instance.model.document.getRoot().getChild(0);
      model_writer.setSelection(model_writer.createRange(
        model_writer.createPositionAt(paragraph_element, 13), model_writer.createPositionAt(paragraph_element, 20),
      ));
    });
    editor_instance.editing.view.focus();
  });
  await page_instance.getByRole('button', { name: 'Expandable term', exact: true }).click();
  await page_instance.keyboard.insertText('the people and the product');
  const first_markup = await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()][0].getData());
  assert(first_markup.includes('expandable-term__label">context</span>'), first_markup);
  assert(first_markup.includes('the people and the product'), first_markup);
  await page_instance.evaluate(() => {
    const editor_instance = [...Drupal.CKEditor5Instances.values()][0];
    editor_instance.model.change((model_writer) => {
      const explanation_element = editor_instance.model.document.getRoot().getChild(0).getChild(1).getChild(1);
      model_writer.setSelection(model_writer.createRange(
        model_writer.createPositionAt(explanation_element, 4), model_writer.createPositionAt(explanation_element, 10),
      ));
    });
    editor_instance.editing.view.focus();
  });
  await page_instance.getByRole('button', { name: 'Expandable term', exact: true }).click();
  await page_instance.keyboard.insertText('people who use it every day');
  const nested_markup = await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()][0].getData());
  assert.equal((nested_markup.match(/class="expandable-term"/g) || []).length, 2, nested_markup);
  assert(nested_markup.includes('people who use it every day'), nested_markup);
  // Data conversion must preserve nesting when a saved field is reopened.
  const reloaded_markup = await page_instance.evaluate((saved_markup) => {
    const editor_instance = [...Drupal.CKEditor5Instances.values()][0];
    editor_instance.setData(saved_markup);
    return editor_instance.getData();
  }, nested_markup);
  assert.equal(reloaded_markup, nested_markup);
  await page_instance.evaluate(() => {
    const editor_instance = [...Drupal.CKEditor5Instances.values()][0];
    editor_instance.model.change((model_writer) => {
      const term_element = editor_instance.model.document.getRoot().getChild(0).getChild(1);
      model_writer.setSelection(term_element, 'on');
    });
  });
  if (!await page_instance.getByRole('button', { name: 'Remove expansion', exact: true }).isVisible()) {
    await page_instance.getByRole('button', { name: 'Show more items', exact: true }).click();
  }
  await page_instance.getByRole('button', { name: 'Remove expansion', exact: true }).click();
  assert.equal(await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()][0].getData().replaceAll('&nbsp;', ' ')), '<p>I care about context.</p>');
  await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()][0].execute('undo'));
  assert.equal(await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()][0].getData()), nested_markup);
  await page_instance.locator('.ck-editor__editable').first().screenshot({ path: 'artifacts/role-slider/editor.png' });
  // Preview nested terms using the real theme behavior without saving draft copy.
  await page_instance.goto('http://jurenites.local/about', { waitUntil: 'networkidle' });
  await page_instance.locator('.role-slider__tab').first().click();
  await page_instance.evaluate((saved_markup) => {
    const story_container = document.querySelector('.role-slider__story');
    story_container.innerHTML = saved_markup;
    Drupal.attachBehaviors(story_container);
  }, nested_markup);
  await page_instance.setViewportSize({ width: 360, height: 800 });
  const collapsed_height = await page_instance.locator('.role-slider__story').first().evaluate((story_element) => story_element.getBoundingClientRect().height);
  const first_term = page_instance.locator('.role-slider__story .expandable-term').first();
  assert.equal(await first_term.locator(':scope > .expandable-term__trigger').textContent(), 'context');
  assert.equal(await first_term.locator(':scope > .expandable-term__trigger').evaluate((button_element) => getComputedStyle(button_element).textDecorationLine), 'none');
  const prior_url = page_instance.url();
  await first_term.locator(':scope > .expandable-term__trigger').press('Enter');
  assert.equal(await first_term.locator(':scope > .expandable-term__explanation').isVisible(), true);
  const nested_term = first_term.locator('.expandable-term').first();
  await nested_term.locator(':scope > .expandable-term__trigger').press('Space');
  assert.equal(await nested_term.locator(':scope > .expandable-term__explanation').isVisible(), true);
  assert.equal(page_instance.url(), prior_url);
  assert(await page_instance.locator('.role-slider__story').first().evaluate((story_element) => story_element.getBoundingClientRect().height) > collapsed_height, 'Expanded text must reflow the paragraph.');
  await page_instance.locator('[data-role-slider]').screenshot({ path: 'artifacts/role-slider/expanded.png' });
  await page_instance.keyboard.press('Escape');
  assert.equal(await nested_term.locator(':scope > .expandable-term__trigger').isVisible(), true);
  assert.equal(await first_term.locator(':scope > .expandable-term__explanation').isVisible(), true);
  await first_term.locator(':scope > .expandable-term__explanation > .expandable-term__collapse').click();
  assert.equal(await first_term.locator(':scope > .expandable-term__trigger').isVisible(), true);
  assert.equal(await first_term.locator(':scope > .expandable-term__trigger').evaluate((button_element) => button_element === document.activeElement), true);
  // Reattachment must not create duplicate controls.
  await page_instance.evaluate(() => Drupal.attachBehaviors(document));
  assert.equal(await first_term.locator(':scope > .expandable-term__trigger').count(), 1);
  const no_script_context = await browser_instance.newContext({ javaScriptEnabled: false });
  const no_script_page = await no_script_context.newPage();
  await no_script_page.goto('http://jurenites.local/about', { waitUntil: 'domcontentloaded' });
  assert.equal(await no_script_page.locator('.role-slider__panel:visible').count(), 3);
  assert(await no_script_page.locator('.role-slider__number').evaluateAll((number_elements) => number_elements.every((number_element) => number_element.scrollWidth <= number_element.clientWidth + 1)), 'Role numbers fit without JavaScript.');
  await no_script_page.evaluate((saved_markup) => { document.querySelector('.role-slider__story').innerHTML = saved_markup; }, nested_markup);
  assert.equal(await no_script_page.locator('.expandable-term__label:visible').count(), 0);
  assert.equal(await no_script_page.locator('.expandable-term__explanation:visible').count(), 2);
  await no_script_page.goto('http://jurenites.local/ru/obo', { waitUntil: 'domcontentloaded' });
  assert.equal(await no_script_page.locator('.role-slider__panel').count(), 3);
  assert.equal(await no_script_page.locator('#block-jurenites-theme-numeric-values .numeric-values__tile').count(), 2);
  assert((await no_script_page.locator('.role-slider__heading').first().textContent()).includes('Веб-разработчик'));
  await no_script_context.close();
  assert.deepEqual(runtime_errors, []);
  console.log('Role browser checks passed.');
} finally { await browser_instance.close(); }
