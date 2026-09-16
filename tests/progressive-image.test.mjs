import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { chromium as chromium_browser } from 'playwright';

const BEHAVIOR_SOURCE = await readFile('web/modules/custom/jurenites_progressive_images/js/progressive-image.js', 'utf8');
const LOADER_STYLES = await readFile('web/modules/custom/jurenites_progressive_images/css/progressive-image.css', 'utf8');
const ONCE_SOURCE = await readFile('web/core/assets/vendor/once/once.min.js', 'utf8');
const PREVIEW_SOURCE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="1"><path fill="rgb(40, 80, 120)" d="M0 0h2v1H0z"/></svg>')}`;

test('failed progressive images retain their color and frame, then recover on successful loads', async (test_context) => {
  const browser_instance = await chromium_browser.launch({ headless: true });
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage();
  await browser_page.route('https://image-fixture.test/**', (route_request) => route_request.fulfill({
    status: 404,
    contentType: 'text/plain',
    body: 'Missing image',
  }));
  await browser_page.setContent(`<html class="js"><head><style>
    :root { --theme-dark-surface-background-elevation-level-1: rgb(20, 20, 20); }
    .image-frame { width: 320px; }
    ${LOADER_STYLES}
    </style></head><body>
    <div class="image-frame"><img id="missing-preview" src="https://image-fixture.test/missing.png"
      alt="Missing preview" data-progressive-image data-progressive-image-width="640" data-progressive-image-height="360"></div>
    <div class="image-frame"><picture><source srcset="https://image-fixture.test/missing-candidate.png">
      <img id="responsive-image" src="${PREVIEW_SOURCE}" alt="Responsive image" data-progressive-image
      data-progressive-image-width="640" data-progressive-image-height="360" data-progressive-image-preview="${PREVIEW_SOURCE}"></picture></div>
    <div class="image-frame"><img id="loaded-image" src="${PREVIEW_SOURCE}" alt="Loaded image" data-progressive-image
      data-progressive-image-width="640" data-progressive-image-height="360" data-progressive-image-preview="${PREVIEW_SOURCE}"></div>
    </body></html>`);
  await browser_page.waitForFunction(() => [...document.images].every((image_element) => image_element.complete));
  assert.equal(await browser_page.locator('#missing-preview').evaluate((image_element) => getComputedStyle(image_element).opacity), '0');
  await browser_page.addScriptTag({ content: ONCE_SOURCE });
  await browser_page.addScriptTag({ content: 'window.Drupal = { behaviors: {} };' });
  await browser_page.addScriptTag({ content: BEHAVIOR_SOURCE });
  await browser_page.evaluate(() => Drupal.behaviors.jurenites_progressive_images.attach(document));
  await browser_page.waitForFunction(() => document.querySelector('#responsive-image').closest('.jurenites-progressive-image').dataset.averageColor);

  async function inspect_image(image_selector) {
    return browser_page.locator(image_selector).evaluate((image_element) => {
      const image_wrapper = image_element.closest('.jurenites-progressive-image');
      const visible_element = image_element.parentElement.tagName === 'PICTURE' ? image_element.parentElement : image_element;
      const preview_element = image_wrapper.querySelector('.jurenites-progressive-image__preview');
      return {
        loading_stage: image_wrapper.dataset.loadingStage,
        busy_state: image_wrapper.getAttribute('aria-busy'),
        image_opacity: getComputedStyle(visible_element).opacity,
        preview_opacity: getComputedStyle(preview_element).opacity,
        preview_color: getComputedStyle(preview_element).backgroundColor,
        shimmer_display: getComputedStyle(preview_element, '::after').display,
        line_opacity: getComputedStyle(image_wrapper.querySelector('.jurenites-progressive-image__loading-line')).opacity,
        frame_height: image_wrapper.getBoundingClientRect().height,
        alternate_text: image_element.alt,
      };
    });
  }

  const missing_state = await inspect_image('#missing-preview');
  assert.deepEqual(missing_state, {
    loading_stage: 'error', busy_state: 'false', image_opacity: '0', preview_opacity: '1',
    preview_color: 'rgb(20, 20, 20)', shimmer_display: 'none', line_opacity: '0',
    frame_height: 180, alternate_text: 'Missing preview',
  });
  assert.equal((await inspect_image('#responsive-image')).preview_color, 'rgb(40, 80, 120)');
  assert.equal((await inspect_image('#responsive-image')).image_opacity, '0');
  assert.equal((await inspect_image('#loaded-image')).image_opacity, '1');

  // A cached successful image must still respond to later failures and retries.
  for (const request_number of [1, 2]) {
    await browser_page.locator('#loaded-image').evaluate((image_element, next_number) => {
      image_element.src = `https://image-fixture.test/later-failure-${next_number}.png`;
    }, request_number);
    await browser_page.waitForFunction(() => document.querySelector('#loaded-image').closest('.jurenites-progressive-image').dataset.loadingStage === 'error');
    const failed_state = await inspect_image('#loaded-image');
    assert.equal(failed_state.image_opacity, '0');
    assert.equal(failed_state.preview_opacity, '1');
    assert.equal(failed_state.preview_color, 'rgb(40, 80, 120)');
    await browser_page.locator('#loaded-image').evaluate((image_element, preview_source) => { image_element.src = preview_source; }, PREVIEW_SOURCE);
    await browser_page.waitForFunction(() => document.querySelector('#loaded-image').closest('.jurenites-progressive-image').dataset.loadingStage === 'complete');
    assert.equal((await inspect_image('#loaded-image')).image_opacity, '1');
  }

  // An error arriving before the scheduled frame must remain terminal.
  await browser_page.evaluate(() => {
    const image_element = document.createElement('img');
    image_element.id = 'pending-image';
    image_element.dataset.progressiveImage = '';
    Object.defineProperty(image_element, 'complete', { value: false });
    document.body.append(image_element);
    Drupal.behaviors.jurenites_progressive_images.attach(document);
    image_element.dispatchEvent(new Event('error'));
  });
  await browser_page.evaluate(() => new Promise((resolve_frame) => { requestAnimationFrame(resolve_frame); }));
  assert.equal((await inspect_image('#pending-image')).loading_stage, 'error');
  assert.equal(await browser_page.locator('#loaded-image').evaluate((image_element) => image_element.closest('.jurenites-progressive-image').parentElement.className), 'image-frame');
});
