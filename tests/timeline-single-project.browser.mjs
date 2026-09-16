import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));
try {
  for (const route_url of [
    'http://jurenites.local/timeline',
    'http://jurenites.local/ru/timeline',
    'http://localhost:6006/iframe.html?id=organisms-timeline--commercial-projects-timeline&viewMode=story',
  ]) {
    await page_instance.goto(route_url, { waitUntil: 'domcontentloaded' });
    await page_instance.locator('.timeline--synchronized').waitFor();
    const project_cards = page_instance.locator('.timeline__year-detail');
    const project_keys = await project_cards.evaluateAll((card_elements) => card_elements.map((card_element) => card_element.dataset.projectKey));
    assert.equal(new Set(project_keys).size, project_keys.length, 'Every project has one card.');
    const card_ids = await project_cards.evaluateAll((card_elements) => card_elements.map((card_element) => card_element.id));
    assert.equal(new Set(card_ids).size, card_ids.length, 'Project anchors are unique.');
    const scatch_card = project_cards.filter({ has: page_instance.getByRole('heading', { name: 'ScatchApp', exact: true }) });
    assert.equal(await scatch_card.count(), 1);
    assert.equal(await scatch_card.locator('.timeline__summary').count(), 1);
    assert.equal(await scatch_card.locator('.timeline__period').count(), 3);
    const scatch_dates = await scatch_card.locator('time').evaluateAll((time_elements) => time_elements.map((time_element) => time_element.getAttribute('datetime').slice(0, 10)));
    assert.deepEqual(scatch_dates, ['2019-11-01', '2019-12-01', '2021-05-01', '2021-11-01', '2022-06-01', '2022-07-01']);
    assert.equal(await scatch_card.locator('.timeline__store-links a').count(), 2);
    assert.ok(await scatch_card.locator('.timeline__proof-links a').count() >= 2, 'Authored sources remain available.');
    const scatch_key = await scatch_card.getAttribute('data-project-key');
    const scatch_markers = page_instance.locator('.timeline__marker[data-project-key="' + scatch_key + '"]');
    assert.equal(await scatch_markers.count(), 3, 'All three calendar durations remain.');
    for (const marker_element of await scatch_markers.all()) {
      await marker_element.press('Enter');
      assert.equal(await scatch_card.evaluate((card_element) => document.activeElement === card_element), true, 'Each duration focuses the single card.');
    }
    const scatch_anchor = await scatch_card.getAttribute('id');
    await page_instance.evaluate((anchor_value) => { location.hash = anchor_value; }, scatch_anchor);
    assert.equal(await scatch_card.evaluate((card_element) => document.activeElement === card_element), true);
    await page_instance.setViewportSize({ width: 375, height: 812 });
    assert.equal(await scatch_card.locator('.timeline__period').count(), 3);
    await scatch_card.scrollIntoViewIfNeeded();
    if (route_url === 'http://jurenites.local/timeline') {
      await scatch_card.screenshot({ path: '/tmp/timeline-single-scatch-mobile.png' });
    }
    await page_instance.setViewportSize({ width: 1440, height: 1000 });
    console.log(route_url + ': one project card, all periods, links and keyboard marker navigation passed.');
  }
  assert.deepEqual(runtime_errors, []);
}
finally {
  await browser_instance.close();
}
