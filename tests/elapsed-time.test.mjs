import assert from 'node:assert/strict';
import test from 'node:test';
import { build as bundle_script } from 'esbuild';
import { chromium as chromium_browser } from 'playwright';
import { formatted_time_since } from '../src/slice/src/js/elapsed-time-format.js';

test('elapsed values retain publication time across day, month and leap-year boundaries', () => {
  assert.equal(formatted_time_since('2026-09-18T15:28:51Z', {}, '2026-09-19T12:07:51Z'), '20 hours 39 minutes');
  assert.equal(formatted_time_since('2026-09-18T15:28:51Z', {}, '2026-09-20T12:07:51Z'), '1 day');
  assert.equal(formatted_time_since('2026-01-31T12:00:00Z', {}, '2026-02-28T12:00:00Z'), '1 month');
  assert.equal(formatted_time_since('2024-02-29T12:00:00Z', {}, '2025-02-28T12:00:00Z'), '1 year');
  assert.equal(formatted_time_since('2026-09-20', {}, '2026-09-19'), '0 minutes');
  assert.equal(formatted_time_since('2026-09-15', {}, '2026-09-19'), '4 days');
  assert.equal(formatted_time_since('2026-09-15', {}, '2026-09-19', 'ru'), '4 дня');
});

test('news and video clocks update, resume after sleep, and attach to appended items', async (test_context) => {
  const browser_instance = await chromium_browser.launch({ headless: true });
  test_context.after(() => browser_instance.close());
  const browser_page = await browser_instance.newPage();
  await browser_page.clock.install({ time: new Date('2026-09-19T12:07:51Z') });
  await browser_page.setContent(`<html lang="en"><body>
    <div class="news-list-item__date"><time class="date-time-value--elapsed-time" datetime="2026-09-18T15:28:51Z" title="Exact date" data-time-suffix="ago">Cached news</time></div>
    <span class="author-byline__published"><time class="date-time-value--elapsed-time" datetime="2026-09-15">Cached video</time></span>
    <span class="author-byline__published"><time class="date-time-value--absolute-date" datetime="2026-09-15">15 September</time></span>
    <span class="news-list-item__date"><time class="date-time-value--elapsed-time" datetime="invalid">Keep fallback</time></span>
    <time class="date-time-value--elapsed-time" datetime="2026-09-15">Comment untouched</time>
  </body></html>`);
  const bundled_source = await bundle_script({
    entryPoints: ['src/slice/src/js/elapsed-time.js'], bundle: true, write: false,
    format: 'iife', globalName: 'elapsed_api',
  });
  await browser_page.addScriptTag({ content: bundled_source.outputFiles[0].text });
  await browser_page.evaluate(() => {
    window.elapsed_api.initialize_elapsed_times(document);
    window.elapsed_api.initialize_elapsed_times(document);
  });
  const news_element = browser_page.locator('.news-list-item__date time').first();
  const video_element = browser_page.locator('.author-byline__published time').first();
  assert.equal(await news_element.textContent(), '20 hours 39 minutes ago');
  assert.equal(await video_element.textContent(), '4 days');
  await browser_page.clock.runFor(60000);
  assert.equal(await news_element.textContent(), '20 hours 40 minutes ago');
  await browser_page.clock.setSystemTime(new Date('2026-09-21T16:00:00Z'));
  await browser_page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await news_element.textContent(), '3 days ago');
  assert.equal(await video_element.textContent(), '6 days');
  assert.equal(await news_element.getAttribute('datetime'), '2026-09-18T15:28:51Z');
  assert.equal(await news_element.getAttribute('title'), 'Exact date');
  assert.equal(await browser_page.locator('.date-time-value--absolute-date').textContent(), '15 September');
  assert.equal(await browser_page.locator('[datetime="invalid"]').textContent(), 'Keep fallback');
  assert.equal(await browser_page.locator('body > time').textContent(), 'Comment untouched');
  await browser_page.evaluate(() => {
    const appended_item = document.createElement('span');
    appended_item.className = 'author-byline__published';
    appended_item.lang = 'ru';
    appended_item.innerHTML = '<time class="date-time-value--elapsed-time" datetime="2026-09-17">Cached appended item</time>';
    document.body.append(appended_item);
    window.elapsed_api.initialize_elapsed_times(appended_item);
  });
  assert.equal(await browser_page.locator('[lang="ru"] time').textContent(), '4 дня');
  await browser_page.evaluate(() => window.elapsed_api.detach_elapsed_times(document));
  await browser_page.clock.setSystemTime(new Date('2026-09-22T16:00:00Z'));
  await browser_page.clock.runFor(1000);
  assert.equal(await video_element.textContent(), '6 days');
  await browser_page.evaluate(() => window.elapsed_api.initialize_elapsed_times(document));
  assert.equal(await video_element.textContent(), '7 days');
  await browser_page.clock.setSystemTime(new Date('2026-09-23T16:00:00Z'));
  await browser_page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
  assert.equal(await video_element.textContent(), '8 days');
});
