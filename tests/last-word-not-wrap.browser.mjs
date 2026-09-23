import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const script_source = await readFile('src/slice/src/js/last-word-not-wrap.js', 'utf8');
const typing_source = await readFile('src/slice/src/js/heading-typing.js', 'utf8');
const style_source = await readFile('web/themes/custom/jurenites_theme/css/style.min.css', 'utf8');
const browser_instance = await chromium.launch({ headless: true });
const runtime_errors = [];
try {
  const page_instance = await browser_instance.newPage({ viewport: { width: 1000, height: 900 } });
  page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
  await page_instance.setContent(`<html lang="en"><body class="jurenites-theme"><main>
    <h1>Thoughtful digital experiences</h1>
    <h2 id="linked-title"><a href="#target">Read the <em>complete story</em></a><span aria-hidden="true">icon</span></h2>
    <h2 id="split-title">Across <strong>inline</strong> <em>elements</em></h2>
    <h2 id="break-title">First explicit<br>Second line here</h2>
    <h2 id="gap-title">Wonderful experiences</h2>
    <h2 id="edge-title">Wonderful experiences</h2>
    <h2 id="arrow-title" class="article-list-item__title"><a class="article-list-item__title-link" href="#target"><span>Wonderful experiences</span><span class="article-list-item__title-end">&NoBreak;<icon class="icon article-list-item__internal-mark" aria-hidden="true"></icon></span></a></h2>
    <h2 id="long-title">An extraordinarilylongunbrokenwordwithmanycharacters</h2>
    <h2 data-last-word-not-wrap="off">Leave this alone</h2>
    <nav><h2>Navigation stays untouched</h2></nav>
    <h2 class="visually-hidden">Hidden accessible text</h2>
    <p id="target">Target content</p>
  </main></body></html>`);
  await page_instance.addStyleTag({ content: style_source });
  await page_instance.addStyleTag({ content: '#gap-title, #edge-title, #arrow-title { width: 80px; } #edge-title { margin-left: auto; } h2 { font: 20px/32px sans-serif; }' });
  await page_instance.addScriptTag({ content: script_source.replace(/^export /gm, '') });
  await page_instance.addScriptTag({ content: `(() => { ${typing_source.replace(/^export /gm, '')}; window.initialize_heading_typing = initialize_heading_typing; })()` });
  await page_instance.evaluate(async () => { await document.fonts.ready; initialize_last_word_not_wrap(document); });
  assert.match(await page_instance.locator('#linked-title em').textContent(), /complete\u00a0story/);
  assert.match(await page_instance.locator('#split-title').textContent(), /inline\u00a0elements/);
  assert.equal(await page_instance.locator('#break-title br').count(), 1);
  assert.equal(await page_instance.locator('[data-last-word-not-wrap="off"] .last-word-not-wrap__text, nav .last-word-not-wrap__text, .visually-hidden .last-word-not-wrap__text').count(), 0);
  assert.equal(await page_instance.locator('#gap-title').evaluate((heading_element) => heading_element.scrollWidth > heading_element.clientWidth && getComputedStyle(heading_element).overflowX === 'visible'), true, 'Pair may paint into the gap without an internal scroller');
  assert.equal(await page_instance.locator('#edge-title.last-word-not-wrap--constrained').count(), 1, 'Viewport edge enables emergency wrapping');
  const arrow_link = page_instance.locator('#arrow-title a');
  const resting_bounds = await page_instance.locator('#arrow-title').boundingBox();
  for (const interaction_mode of ['hover', 'focus']) {
    if (interaction_mode === 'hover') await arrow_link.hover();
    else {
      await page_instance.mouse.move(900, 800);
      await arrow_link.focus();
    }
    await page_instance.waitForTimeout(400);
    const arrow_state = await arrow_link.evaluate((link_element) => {
      const text_node = link_element.querySelector('.last-word-not-wrap__text').firstChild;
      const text_range = document.createRange();
      text_range.setStart(text_node, text_node.length - 1);
      text_range.setEnd(text_node, text_node.length);
      const glyph_bounds = text_range.getBoundingClientRect();
      const arrow_element = link_element.querySelector('.article-list-item__internal-mark');
      const arrow_bounds = arrow_element.getBoundingClientRect();
      return {
        visible_state: getComputedStyle(arrow_element).visibility,
        inline_distance: arrow_bounds.left - glyph_bounds.right,
        same_line: arrow_bounds.top < glyph_bounds.bottom && arrow_bounds.bottom > glyph_bounds.top,
        overflow_gap: arrow_bounds.right > link_element.closest('h2').getBoundingClientRect().right,
      };
    });
    assert.equal(arrow_state.visible_state, 'visible', `${interaction_mode} reveals arrow`);
    assert(Math.abs(arrow_state.inline_distance) < 1 && arrow_state.same_line, 'Arrow follows final glyph on the same line');
    assert(arrow_state.overflow_gap, 'Arrow may extend into the gap');
    assert.deepEqual(await page_instance.locator('#arrow-title').boundingBox(), resting_bounds, 'Arrow reveal does not change title layout');
  }
  const initial_markup = await page_instance.locator('main').innerHTML();
  await page_instance.evaluate(() => initialize_last_word_not_wrap(document));
  assert.equal(await page_instance.locator('main').innerHTML(), initial_markup, 'Repeated attach is idempotent');
  const original_bounds = await page_instance.locator('h1').boundingBox();
  await page_instance.evaluate(() => initialize_heading_typing(document));
  await page_instance.waitForFunction(() => document.querySelector('.heading-typing'));
  assert.deepEqual(await page_instance.locator('h1').boundingBox(), original_bounds, 'Typing preserves protected title layout');
  await page_instance.waitForFunction(() => !document.querySelector('.heading-typing'));
  assert.match(await page_instance.locator('h1').textContent(), /digital\u00a0experiences/);
  await page_instance.addStyleTag({ content: '#arrow-title { margin-left: auto; }' });
  for (const viewport_width of [320, 360, 768, 1440]) {
    await page_instance.setViewportSize({ width: viewport_width, height: 900 });
    await page_instance.waitForTimeout(100);
    assert(await page_instance.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `No page overflow at ${viewport_width}px`);
  }
  await page_instance.evaluate(() => {
    detach_last_word_not_wrap(document);
    initialize_last_word_not_wrap(document);
    const ajax_heading = document.createElement('h3');
    ajax_heading.id = 'ajax-title';
    ajax_heading.textContent = 'Loaded video title';
    document.querySelector('main').append(ajax_heading);
    initialize_last_word_not_wrap(ajax_heading);
  });
  assert.match(await page_instance.locator('#ajax-title').textContent(), /video\u00a0title/);
  assert.equal(await page_instance.locator('#linked-title a').getAttribute('href'), '#target');
  if (process.env.LIVE_SITE_URL) {
    const live_page = await browser_instance.newPage({ reducedMotion: 'reduce' });
    live_page.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
    for (const route_path of ['/videos', '/blog', '/about', '/']) {
      await live_page.goto(new URL(route_path, process.env.LIVE_SITE_URL).href, { waitUntil: 'networkidle' });
      await live_page.evaluate(() => document.fonts.ready);
      assert(await live_page.locator('.last-word-not-wrap').count() > 0, `${route_path} has enhanced headings`);
      for (const viewport_width of [360, 768, 1440]) {
        await live_page.setViewportSize({ width: viewport_width, height: 1000 });
        await live_page.waitForTimeout(150);
        const overflow_state = await live_page.evaluate(() => ({
          scroll_width: document.documentElement.scrollWidth,
          viewport_width: document.documentElement.clientWidth,
          bad_titles: [...document.querySelectorAll('.last-word-not-wrap')].filter((heading_element) => ['auto', 'scroll', 'hidden'].includes(getComputedStyle(heading_element).overflowX)).map((heading_element) => heading_element.textContent),
        }));
        assert(overflow_state.scroll_width <= overflow_state.viewport_width, `${route_path} overflows at ${viewport_width}px: ${JSON.stringify(overflow_state)}`);
        assert.deepEqual(overflow_state.bad_titles, []);
        const detached_arrows = await live_page.locator('.article-list-item__title-link').evaluateAll((title_links) => title_links.filter((title_link) => {
          const text_range = document.createRange();
          text_range.selectNodeContents(title_link.firstElementChild);
          const line_bounds = [...text_range.getClientRects()].at(-1);
          const arrow_bounds = title_link.querySelector('.article-list-item__internal-mark').getBoundingClientRect();
          return Math.abs(arrow_bounds.left - line_bounds.right) > 1 || arrow_bounds.top >= line_bounds.bottom || arrow_bounds.bottom <= line_bounds.top;
        }).map((title_link) => title_link.textContent));
        assert.deepEqual(detached_arrows, [], `${route_path}: arrows follow the final title line at ${viewport_width}px`);
      }
      console.log(`Live ${route_path}: enhanced headings and no horizontal overflow at 360, 768, 1440px.`);
      if (route_path === '/videos') await live_page.screenshot({ path: '/private/tmp/last-word-videos.png' });
    }
    await live_page.close();
  }
  assert.deepEqual(runtime_errors, []);
  console.log('Last word not wrap: nested links, explicit breaks, gap overflow, viewport fallback, resize, AJAX, typing, exclusions and repeated attach passed.');
} finally {
  await browser_instance.close();
}
