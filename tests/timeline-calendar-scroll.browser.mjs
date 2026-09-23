import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
const settle_scroll = () => page_instance.evaluate(async () => {
  await new Promise(requestAnimationFrame);
  await new Promise(requestAnimationFrame);
});
try {
  for (const route_url of [
    'http://jurenites.local/timeline',
    'http://jurenites.local/ru/timeline',
    'http://storybook.jurenites.local/iframe.html?id=organisms-timeline--commercial-projects-timeline&viewMode=story',
  ].filter((route_url) => !process.env.TIMELINE_TEST_URL || route_url === process.env.TIMELINE_TEST_URL)) {
    await page_instance.goto(route_url, { waitUntil: 'networkidle' });
    await page_instance.locator('.timeline__details-window').waitFor();
    await page_instance.evaluate(() => document.fonts.ready);
    await page_instance.waitForFunction(() => !document.body.inert && !document.documentElement.hasAttribute('data-site-intro'));
    for (const viewport_size of [{ width: 1440, height: 1000 }, { width: 375, height: 812 }]) {
      await page_instance.setViewportSize(viewport_size);
      await settle_scroll();
      const scroll_geometry = await page_instance.evaluate(() => {
        const layout_element = document.querySelector('.timeline__synchronized-layout');
        const project_window = document.querySelector('.timeline__details-window');
        const calendar_element = document.querySelector('.timeline__calendar-rail');
        return {
          starting_offset: scrollY + layout_element.getBoundingClientRect().top - parseFloat(getComputedStyle(project_window).top),
          scroll_distance: calendar_element.offsetHeight - project_window.clientHeight,
          rail_height: calendar_element.offsetHeight,
          text_height: document.querySelector('.timeline__details-column').offsetHeight,
          layout_height: layout_element.offsetHeight,
          card_count: document.querySelectorAll('.timeline__year-detail').length,
        };
      });
      assert.equal(scroll_geometry.layout_height, scroll_geometry.rail_height, 'Calendar height owns document travel.');
      const visible_cards = new Set();
      const scroll_samples = [];
      for (let sample_index = 0; sample_index <= 400; sample_index += 1) {
        await page_instance.evaluate((page_offset) => window.scrollTo({ top: page_offset, behavior: 'instant' }),
          scroll_geometry.starting_offset + scroll_geometry.scroll_distance * sample_index / 400);
        await settle_scroll();
        const sample_state = await page_instance.evaluate(() => {
          const project_window = document.querySelector('.timeline__details-window');
          const window_bounds = project_window.getBoundingClientRect();
          return {
            page_offset: scrollY,
            rail_top: document.querySelector('.timeline__calendar-rail').getBoundingClientRect().top,
            rail_scroll: document.querySelector('.timeline__rail-window').scrollTop,
            text_offset: project_window.scrollTop,
            maximum_text: project_window.scrollHeight - project_window.clientHeight,
            visible_cards: [...document.querySelectorAll('.timeline__year-detail')].filter((card_element) => {
              const card_bounds = card_element.getBoundingClientRect();
              return card_bounds.top < window_bounds.bottom && card_bounds.bottom > window_bounds.top;
            }).map((card_element) => card_element.id),
          };
        });
        for (const card_id of sample_state.visible_cards) visible_cards.add(card_id);
        const previous_sample = scroll_samples.at(-1);
        if (previous_sample) {
          assert.ok(Math.abs((sample_state.rail_top - previous_sample.rail_top)
            + (sample_state.page_offset - previous_sample.page_offset)) < 1, 'Years move exactly with the page.');
          assert.ok(sample_state.text_offset >= previous_sample.text_offset, 'Projects never reverse.');
        }
        assert.equal(sample_state.rail_scroll, 0, 'The calendar has no independent scroll.');
        scroll_samples.push(sample_state);
      }
      assert.equal(scroll_samples[0].text_offset, 0, 'First content is reachable.');
      assert.ok(Math.abs(scroll_samples.at(-1).text_offset - scroll_samples.at(-1).maximum_text) <= 2, 'Last content is reachable.');
      assert.equal(visible_cards.size, scroll_geometry.card_count, 'Every project passes through the viewport.');
      const project_ratios = scroll_samples.slice(1).map((sample_state, sample_index) => Math.round(
        (sample_state.text_offset - scroll_samples[sample_index].text_offset) /
        (sample_state.page_offset - scroll_samples[sample_index].page_offset) * 10));
      if (scroll_geometry.text_height > scroll_geometry.rail_height + 100) {
        assert.ok(new Set(project_ratios).size > 3, 'Dense projects use different scroll ratios.');
      }
      // Reverse travel uses the same mapping.
      await page_instance.evaluate((page_offset) => window.scrollTo({ top: page_offset, behavior: 'instant' }), scroll_samples[150].page_offset);
      await settle_scroll();
      assert.equal(await page_instance.locator('.timeline__details-window').evaluate((window_element) => window_element.scrollTop), scroll_samples[150].text_offset);
      await page_instance.screenshot({ path: '/tmp/timeline-calendar-' + viewport_size.width + '.png' });
      // Marker navigation must resolve through the inverse scroll mapping.
      const marker_results = await page_instance.evaluate(() => {
        const all_markers = [...document.querySelectorAll('.timeline__marker')];
        return [all_markers[0], all_markers[Math.floor(all_markers.length / 2)], all_markers.at(-1)].map((marker_element) => marker_element.dataset.projectKey);
      });
      for (const project_key of marker_results) {
        await page_instance.locator('.timeline__marker[data-project-key="' + project_key + '"]').first().evaluate((marker_element) => marker_element.click());
        await settle_scroll();
        const card_state = await page_instance.locator('.timeline__year-detail[data-project-key="' + project_key + '"]').evaluate((card_element) => ({
          focused_card: document.activeElement === card_element,
          card_top: card_element.getBoundingClientRect().top,
          card_bottom: card_element.getBoundingClientRect().bottom,
          window_top: card_element.closest('.timeline__details-window').getBoundingClientRect().top,
          window_bottom: card_element.closest('.timeline__details-window').getBoundingClientRect().bottom,
        }));
        assert.equal(card_state.focused_card, true);
        assert.ok(card_state.card_top >= card_state.window_top - 2 && card_state.card_top < card_state.window_bottom, JSON.stringify(card_state));
      }
      const fragment_id = await page_instance.locator('.timeline__year-detail').nth(Math.floor(scroll_geometry.card_count / 2)).getAttribute('id');
      await page_instance.evaluate((card_id) => { location.hash = card_id; }, fragment_id);
      await page_instance.waitForFunction((card_id) => document.activeElement.id === card_id, fragment_id);
      await settle_scroll();
      assert.ok(await page_instance.locator('[id="' + fragment_id + '"]').evaluate((card_element) => {
        const card_bounds = card_element.getBoundingClientRect();
        const window_bounds = card_element.closest('.timeline__details-window').getBoundingClientRect();
        return card_bounds.top >= window_bounds.top - 2 && card_bounds.top < window_bounds.bottom;
      }), 'Direct project links resolve to the calendar position.');
      await page_instance.evaluate(() => history.replaceState(null, '', location.pathname + location.search));
      await page_instance.evaluate((page_offset) => window.scrollTo({ top: page_offset, behavior: 'instant' }), scroll_samples[150].page_offset);
      await settle_scroll();
      await page_instance.locator('.timeline__year-detail a').last().focus();
      await settle_scroll();
      const focused_position = await page_instance.evaluate(() => ({
        page_offset: scrollY,
        text_offset: document.querySelector('.timeline__details-window').scrollTop,
        link_top: document.activeElement.getBoundingClientRect().top,
        link_bottom: document.activeElement.getBoundingClientRect().bottom,
        window_top: document.querySelector('.timeline__details-window').getBoundingClientRect().top,
        window_bottom: document.querySelector('.timeline__details-window').getBoundingClientRect().bottom,
      }));
      assert.ok(focused_position.link_top >= focused_position.window_top - 2
        && focused_position.link_bottom <= focused_position.window_bottom + 2, 'Focused links stay visible.');
      await page_instance.evaluate(() => dispatchEvent(new Event('scroll')));
      await settle_scroll();
      assert.equal(await page_instance.locator('.timeline__details-window').evaluate((window_element) => window_element.scrollTop), focused_position.text_offset, 'Focus keeps both columns synchronized.');
      // Wheel input over either side still drives the same native page scroll.
      for (const column_selector of ['.timeline__rail-window', '.timeline__details-window']) {
        await page_instance.evaluate((page_offset) => window.scrollTo({ top: page_offset, behavior: 'instant' }), scroll_samples[150].page_offset);
        await settle_scroll();
        const column_bounds = await page_instance.locator(column_selector).boundingBox();
        await page_instance.mouse.move(column_bounds.x + column_bounds.width / 2, 400);
        const before_offset = await page_instance.evaluate(() => scrollY);
        await page_instance.mouse.wheel(0, 120);
        await page_instance.waitForTimeout(150);
        assert.ok(Math.abs(await page_instance.evaluate(() => scrollY) - before_offset - 120) <= 1, 'Wheel remains native over ' + column_selector);
      }
      console.log(route_url + ' ' + viewport_size.width + ': constant calendar, variable projects, all cards reachable, reverse scroll, markers and wheel passed.');
    }
  }
  assert.deepEqual(runtime_errors, []);
} finally {
  await browser_instance.close();
}
