import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

const storybook_origin = process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6006';
const drupal_origin = process.env.DRUPAL_URL ?? 'http://jurenites.local';
const browser_instance = await chromium.launch({ headless: true });
const artifact_directory = '.cache/component-status/artifacts/checkbox';
await mkdir(artifact_directory, { recursive: true });
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1280, height: 800 } });
  const page_errors = [];
  page_instance.on('pageerror', (page_error) => page_errors.push(page_error.message));
  async function open_story(story_name, story_args = '') {
    await page_instance.goto(`${storybook_origin}/iframe.html?id=atoms-checkbox--${story_name}&viewMode=story&args=${story_args}`);
    await page_instance.locator('.checkbox__input').waitFor();
  }
  async function input_style(style_property) {
    return page_instance.locator('.checkbox__input').evaluate((input_element, style_property) => getComputedStyle(input_element)[style_property], style_property);
  }
  for (const state_name of ['empty', 'filled', 'partially']) {
    await open_story(`${state_name}-state`);
    const input_control = page_instance.locator('.checkbox__input');
    if (state_name === 'partially') await page_instance.waitForFunction(() => document.querySelector('.checkbox__input').indeterminate);
    const input_bounds = await input_control.boundingBox();
    const label_bounds = await page_instance.locator('.checkbox__label').boundingBox();
    assert.equal(input_bounds.width, 24);
    assert.equal(input_bounds.height, 24);
    assert.equal(label_bounds.x - input_bounds.x - input_bounds.width, 8);
    const wrapper_bounds = await page_instance.locator('.checkbox__control').boundingBox();
    assert.equal(wrapper_bounds.width, 32);
    assert.equal(wrapper_bounds.height, 40);
    assert.equal(input_bounds.x, wrapper_bounds.x);
    assert.equal(input_bounds.y - wrapper_bounds.y, 8);
    assert.equal(await input_style('cursor'), 'pointer');
    assert.equal(await input_style('borderRadius'), '0px');
    assert.equal(await input_style('backgroundSize'), '24px auto');
    assert.match(await input_style('backgroundImage'), new RegExp(`checkbox-${state_name}\\.svg`));
    assert.equal(await input_control.isChecked(), state_name === 'filled');
    const asset_response = await page_instance.request.get(`${storybook_origin}/assets/images/checkbox/checkbox-${state_name}.svg`);
    assert.equal(asset_response.status(), 200);
    assert.equal(await asset_response.text(), await readFile(`src/public/assets/images/checkbox/checkbox-${state_name}.svg`, 'utf8'));
    await page_instance.locator('.checkbox').screenshot({ path: `${artifact_directory}/${state_name}.png` });
  }
  await page_instance.locator('.checkbox__input').press('Space');
  assert.equal(await page_instance.locator('.checkbox__input').evaluate(input_element => input_element.indeterminate), false);
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), true);
  assert.notEqual(await input_style('outlineStyle'), 'none');
  await page_instance.locator('.checkbox__label').click();
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), false);
  // Only the native 24px square is clickable; layout padding is inert.
  await page_instance.locator('.checkbox__input').click({ position: { x: 1, y: 1 } });
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), true);
  await page_instance.waitForFunction(() => {
    const input_control = document.querySelector('.checkbox__input');
    const expected_color = document.createElement('span');
    expected_color.style.backgroundColor = 'var(--theme-dark-action-secondary-hover)';
    document.body.append(expected_color);
    const matches_color = getComputedStyle(input_control).backgroundColor === getComputedStyle(expected_color).backgroundColor;
    expected_color.remove();
    return matches_color;
  });
  await page_instance.locator('.checkbox').screenshot({ path: `${artifact_directory}/hover.png` });
  await open_story('without-label');
  assert.equal(await page_instance.getByRole('checkbox', { name: 'Include this option' }).count(), 1);
  const standalone_wrapper = page_instance.locator('.checkbox__control');
  const standalone_bounds = await standalone_wrapper.boundingBox();
  const standalone_input = await page_instance.locator('.checkbox__input').boundingBox();
  assert.equal(standalone_bounds.width, 40);
  assert.equal(standalone_bounds.height, 40);
  assert.equal(standalone_input.x - standalone_bounds.x, 8);
  assert.equal(standalone_input.y - standalone_bounds.y, 8);
  await standalone_wrapper.click({ position: { x: 2, y: 2 } });
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), false);
  assert.equal(await input_style('backgroundColor'), 'rgba(0, 0, 0, 0)');
  assert.equal(await standalone_wrapper.evaluate(wrapper_element => getComputedStyle(wrapper_element).cursor), 'default');
  await open_story('empty-state');
  await page_instance.locator('.checkbox__control').click({ position: { x: 28, y: 20 } });
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), false);
  assert.equal(await input_style('backgroundColor'), 'rgba(0, 0, 0, 0)');
  await open_story('disabled-state');
  assert.equal(await page_instance.locator('.checkbox__input').isDisabled(), true);
  await page_instance.locator('.checkbox__label').click({ force: true });
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), false);
  assert.equal(await input_style('backgroundColor'), 'rgba(0, 0, 0, 0)');
  await open_story('empty-state', 'is_required:true');
  assert.equal(await page_instance.locator('.checkbox__input').evaluate(input_element => input_element.checkValidity()), false);
  await page_instance.locator('.checkbox__input').check();
  assert.equal(await page_instance.locator('.checkbox__input').evaluate(input_element => input_element.checkValidity()), true);
  await page_instance.locator('.checkbox').evaluate(checkbox_element => {
    const form_element = document.createElement('form');
    checkbox_element.before(form_element);
    form_element.append(checkbox_element);
  });
  assert.equal(await page_instance.locator('form').evaluate(form_element => new FormData(form_element).get('checkbox_option')), 'yes');
  await page_instance.locator('form').evaluate(form_element => form_element.reset());
  assert.equal(await page_instance.locator('.checkbox__input').isChecked(), false);
  await page_instance.setViewportSize({ width: 360, height: 780 });
  await open_story('empty-state');
  await page_instance.locator('.checkbox__label').evaluate(label_element => {
    label_element.textContent = 'An optional label after the square can wrap across several lines on a small screen without reducing the clickable area.';
  });
  assert.equal((await page_instance.locator('.checkbox__input').boundingBox()).width, 24);
  assert.ok((await page_instance.locator('.checkbox__label').boundingBox()).height > 40);
  assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page_instance.locator('.checkbox').screenshot({ path: `${artifact_directory}/mobile.png` });
  for (const control_name of ['single-checkbox', 'checkbox-group', 'radio-group']) {
    await page_instance.goto(`${storybook_origin}/iframe.html?id=molecules-input-fields-input-text--default-story&viewMode=story&args=field_control:${control_name}`);
    const choice_control = page_instance.locator(control_name === 'radio-group' ? 'input[type="radio"]' : '.checkbox__input').first();
    await choice_control.waitFor();
    assert.equal((await choice_control.boundingBox()).width, control_name === 'radio-group' ? 16 : 24);
  }
  assert.deepEqual(page_errors, []);

  // Rendered Drupal Form API fixture, with the actual served theme CSS and JS.
  const drupal_markup = await readFile(`${artifact_directory}/drupal-form.html`, 'utf8');
  const drupal_page = await browser_instance.newPage();
  await drupal_page.goto(`${drupal_origin}/user/login`);
  await drupal_page.locator('body').evaluate((body_element, drupal_markup) => {
    const fixture_element = document.createElement('form');
    fixture_element.id = 'checkbox-verification';
    fixture_element.innerHTML = drupal_markup;
    body_element.prepend(fixture_element);
    Drupal.attachBehaviors(fixture_element);
  }, drupal_markup);
  const drupal_control = drupal_page.locator('#checkbox-verification .form-checkbox');
  assert.equal((await drupal_control.boundingBox()).width, 24);
  assert.equal((await drupal_control.boundingBox()).height, 24);
  const drupal_wrapper = drupal_page.locator('#checkbox-verification .checkbox__control');
  assert.equal((await drupal_wrapper.boundingBox()).width, 32);
  assert.equal((await drupal_wrapper.boundingBox()).height, 40);
  await drupal_wrapper.click({ position: { x: 28, y: 20 } });
  assert.equal(await drupal_control.isChecked(), false);
  assert.equal(await drupal_control.evaluate(input_element => input_element.indeterminate), true);
  assert.match(await drupal_control.evaluate(input_element => getComputedStyle(input_element).backgroundImage), /checkbox-partially\.svg/);
  await drupal_page.locator('#checkbox-verification label').click();
  assert.equal(await drupal_control.isChecked(), true);
  await drupal_page.evaluate(() => Drupal.attachBehaviors(document));
  assert.equal(await drupal_control.evaluate(input_element => input_element.indeterminate), false);
  assert.equal(await drupal_page.locator('#checkbox-verification').evaluate(form_element => new FormData(form_element).get('checkbox_fixture')), 'yes');
  const drupal_asset = await drupal_page.request.get(`${drupal_origin}/themes/custom/jurenites_theme/assets/images/checkbox/checkbox-filled.svg`);
  assert.equal(drupal_asset.status(), 200);
  await drupal_page.locator('#checkbox-verification').screenshot({ path: `${artifact_directory}/drupal.png` });
  await drupal_page.emulateMedia({ forcedColors: 'active' });
  assert.equal(await drupal_control.evaluate(input_element => getComputedStyle(input_element).appearance), 'auto');
  assert.equal(await drupal_control.evaluate(input_element => getComputedStyle(input_element).backgroundImage), 'none');
  const no_script_page = await browser_instance.newPage({ javaScriptEnabled: false });
  await no_script_page.goto(`${drupal_origin}/user/login`);
  await no_script_page.setContent(`<link rel="stylesheet" href="${drupal_origin}/themes/custom/jurenites_theme/css/style.min.css">${drupal_markup}`);
  await no_script_page.locator('.form-checkbox').check();
  assert.equal(await no_script_page.locator('.form-checkbox').isChecked(), true);
  assert.equal((await no_script_page.locator('.form-checkbox').boundingBox()).width, 24);
  console.log('Checkbox passed: all SVG states, 24px target, inert 40px wrapper, compact labeled spacing, hover, pointer, labels, keyboard, required/disabled, submission/reset, mobile wrapping, grouped controls/radio isolation, Drupal behavior reattach, forced colors and no-JS.');
} finally {
  await browser_instance.close();
}
