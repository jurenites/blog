import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { build as build_bundle } from 'esbuild';
import { chromium as browser_engine } from 'playwright';

const THEME_SOURCE = await readFile('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8');
const BUNDLE_RESULT = await build_bundle({
  entryPoints: ['src/slice/src/js/card-loading.js'], bundle: true, write: false,
  format: 'iife', globalName: 'card_runtime',
});
const RUNTIME_SOURCE = BUNDLE_RESULT.outputFiles[0].text;
const LONG_HEADING = 'A detailed project describing responsive layouts and accessible interfaces '.repeat(8);

function card_markup(card_kind, heading_text = 'Example card') {
  const component_class = { 'article-list': 'article-list-item', 'news-list': 'news-list-item' }[card_kind] || card_kind;
  const heading_class = card_kind === 'project-card' ? 'text-link' : `${component_class}__title`;
  return `<article class="${component_class}" data-card-loading="${card_kind}" style="min-height:160px">
    <div class="${component_class}__media"><img src="/missing-photo.webp" alt="" loading="lazy"></div>
    <div class="${component_class}__body"><h2 class="${heading_class}"><a href="/example">${heading_text}</a></h2></div>
  </article>`;
}

async function create_fixture(test_context, { viewport_width = 900, reduced_motion = 'no-preference' } = {}) {
  const browser_instance = await browser_engine.launch({ headless: true, channel: 'chrome' });
  const browser_page = await browser_instance.newPage({
    viewport: { width: viewport_width, height: 900 }, reducedMotion: reduced_motion,
  });
  const page_errors = [];
  browser_page.on('pageerror', (page_error) => page_errors.push(page_error.message));
  await browser_page.route('**/*', (route_context) => route_context.abort());
  await browser_page.setContent(`<html><head><style>${THEME_SOURCE}</style></head>
    <body class="jurenites-theme"><main></main><div id="following-block">Following content</div></body></html>`);
  await browser_page.addScriptTag({ content: RUNTIME_SOURCE });
  await browser_page.evaluate(() => {
    let release_fonts;
    const pending_fonts = new Promise((resolve_fonts) => { release_fonts = resolve_fonts; });
    Object.defineProperty(document.fonts, 'ready', { configurable: true, get: () => pending_fonts });
    window.release_card_fonts = release_fonts;
    card_runtime.install_card_loading();
  });
  test_context.after(async () => {
    await browser_instance.close();
    assert.deepEqual(page_errors, []);
  });
  return browser_page;
}

async function insert_card(browser_page, markup_source) {
  await browser_page.evaluate((card_source) => { document.querySelector('main').innerHTML = card_source; }, markup_source);
  await browser_page.waitForSelector('[data-card-loading-pending]');
  return browser_page.locator('article').first();
}

test('whole cards reserve space, grow/shrink through intermediate heights and hand control back to CSS', async (test_context) => {
  for (const heading_text of ['Short title', LONG_HEADING]) {
    const browser_page = await create_fixture(test_context);
    const card_element = await insert_card(browser_page, card_markup('article-list', heading_text));
    const initial_height = (await card_element.boundingBox()).height;
    const initial_following = await browser_page.locator('#following-block').boundingBox();
    assert(initial_height > 0);
    await browser_page.evaluate(() => window.release_card_fonts());
    await browser_page.waitForFunction(() => document.querySelector('article').getAnimations().some(
      (animation_item) => animation_item.effect.getKeyframes().some((frame_item) => frame_item.height),
    ));
    const animation_metrics = await card_element.evaluate((card_node) => {
      const height_animation = card_node.getAnimations().find(
        (animation_item) => animation_item.effect.getKeyframes().some((frame_item) => frame_item.height),
      );
      height_animation.pause();
      const duration_ms = height_animation.effect.getTiming().duration;
      height_animation.currentTime = duration_ms / 2;
      const key_frames = height_animation.effect.getKeyframes();
      return {
        duration_ms,
        start_height: parseFloat(key_frames[0].height),
        end_height: parseFloat(key_frames.at(-1).height),
        middle_height: card_node.getBoundingClientRect().height,
      };
    });
    assert.equal(animation_metrics.duration_ms, 200);
    const lower_height = Math.min(animation_metrics.start_height, animation_metrics.end_height);
    const upper_height = Math.max(animation_metrics.start_height, animation_metrics.end_height);
    assert(animation_metrics.middle_height > lower_height && animation_metrics.middle_height < upper_height);
    if (heading_text === LONG_HEADING) assert(animation_metrics.end_height > initial_height);
    else assert(animation_metrics.end_height < initial_height);
    const middle_following = await browser_page.locator('#following-block').boundingBox();
    assert(Math.abs(middle_following.y - initial_following.y - (animation_metrics.middle_height - initial_height)) < 1);
    await card_element.evaluate((card_node) => card_node.getAnimations().forEach((animation_item) => animation_item.finish()));
    await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'));
    assert.equal(await card_element.getAttribute('style'), null);
    assert(Math.abs((await card_element.boundingBox()).height - animation_metrics.end_height) < 1);
    await browser_page.setViewportSize({ width: 375, height: 900 });
    assert.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth), 375);
    assert.equal(await card_element.getAttribute('style'), null);
  }
});

test('responsive estimates cover articles, teaser cards, news, video grids and portfolio cards without distorting media', async (test_context) => {
  for (const viewport_width of [375, 1440]) {
    const browser_page = await create_fixture(test_context, { viewport_width });
    const page_markup = ['article-list', 'article-teaser', 'news-list', 'project-card'].map((card_kind) => card_markup(card_kind)).join('')
      + `<div class="video-grid"><div class="video-grid__item">${card_markup('article-list')}</div></div>`;
    await insert_card(browser_page, page_markup);
    const pending_metrics = await browser_page.locator('article').evaluateAll((card_nodes) => card_nodes.map((card_node) => {
      const media_node = card_node.querySelector('[class$="__media"]');
      const media_bounds = media_node.getBoundingClientRect();
      return { card_height: card_node.getBoundingClientRect().height, media_width: media_bounds.width, media_height: media_bounds.height };
    }));
    assert.equal(pending_metrics.length, 5);
    for (const card_metrics of pending_metrics) {
      assert(card_metrics.card_height > 0);
      assert(Math.abs(card_metrics.media_height - card_metrics.media_width * 9 / 16) < 1);
    }
    await browser_page.evaluate(() => window.release_card_fonts());
    await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'));
    assert.equal(await browser_page.locator('article[style]').count(), 0);
    assert.equal(await browser_page.evaluate(() => document.documentElement.scrollWidth), viewport_width);
  }
});

test('reduced motion skips the height animation and preserves unrelated inline properties', async (test_context) => {
  const browser_page = await create_fixture(test_context, { reduced_motion: 'reduce' });
  const card_element = await insert_card(browser_page, card_markup('article-list', LONG_HEADING));
  await card_element.evaluate((card_node) => { card_node.style.outlineOffset = '2px'; });
  await browser_page.evaluate(() => window.release_card_fonts());
  await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'));
  assert.equal(await card_element.evaluate((card_node) => card_node.getAnimations().length), 0);
  assert.equal(await card_element.getAttribute('style'), 'outline-offset: 2px;');
});

test('stalled readiness recovers, detached cards clean up and subsequently inserted cards initialize', async (test_context) => {
  const browser_page = await create_fixture(test_context);
  const card_element = await insert_card(browser_page, card_markup('project-card'));
  await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'), null, { timeout: 3500 });
  assert.equal(await card_element.getAttribute('style'), null);
  await insert_card(browser_page, card_markup('news-list'));
  const detached_handle = await browser_page.evaluateHandle(() => {
    const card_node = document.querySelector('article');
    card_node.remove();
    return card_node;
  });
  assert.equal(await detached_handle.evaluate((card_node) => card_node.getAttribute('style')), null);
  assert.equal(await detached_handle.evaluate((card_node) => card_node.hasAttribute('data-card-loading')), false);
  await insert_card(browser_page, `<div class="video-grid"><div class="video-grid__item">${card_markup('article-list')}</div></div>`);
  await browser_page.evaluate(() => window.release_card_fonts());
  await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'));
  assert.equal(await browser_page.locator('article[style]').count(), 0);
});

test('a width change during handover releases stale pixel dimensions', async (test_context) => {
  const browser_page = await create_fixture(test_context);
  const card_element = await insert_card(browser_page, card_markup('article-list', LONG_HEADING));
  await browser_page.evaluate(() => window.release_card_fonts());
  await browser_page.waitForFunction(() => document.querySelector('article').getAnimations().length > 0);
  await card_element.evaluate((card_node) => card_node.getAnimations().forEach((animation_item) => animation_item.pause()));
  await browser_page.setViewportSize({ width: 375, height: 900 });
  await browser_page.waitForFunction(() => !document.querySelector('[data-card-loading]'));
  assert.equal(await card_element.getAttribute('style'), null);
});

test('keyboard entry reveals all card content immediately while fonts are still pending', async (test_context) => {
  const browser_page = await create_fixture(test_context);
  const card_element = await insert_card(browser_page, card_markup('article-list', LONG_HEADING));
  await card_element.locator('a').focus();
  assert.equal(await card_element.getAttribute('data-card-loading'), null);
  assert.equal(await card_element.getAttribute('style'), null);
  assert.equal(await card_element.evaluate((card_node) => card_node.getAnimations().length), 0);
  assert((await card_element.boundingBox()).height > 160);
});

test('server estimates without JavaScript never clip long content', async (test_context) => {
  const browser_instance = await browser_engine.launch({ headless: true, channel: 'chrome' });
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  await browser_page.setContent(`<style>${THEME_SOURCE}</style>${card_markup('article-list', LONG_HEADING)}`);
  const card_element = browser_page.locator('article');
  assert((await card_element.boundingBox()).height > 160);
  assert.equal(await card_element.evaluate((card_node) => getComputedStyle(card_node).overflow), 'visible');
});
