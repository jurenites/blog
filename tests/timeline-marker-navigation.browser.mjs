import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser_instance = await chromium.launch({ headless: true });
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1000 } });
const runtime_errors = [];
page_instance.on('pageerror', (page_error) => runtime_errors.push(page_error.message));

try {
  for (const route_url of [
    'http://jurenites.local/timeline',
    'http://jurenites.local/ru/timeline',
    'http://storybook.jurenites.local/iframe.html?id=organisms-timeline--commercial-projects-timeline&viewMode=story',
  ]) {
    await page_instance.emulateMedia({ reducedMotion: 'no-preference' });
    await page_instance.goto(route_url, { waitUntil: 'networkidle' });
    await page_instance.locator('.timeline--synchronized').waitFor();
    await page_instance.evaluate(() => document.fonts.ready);
    const first_marker = page_instance.locator('.timeline__marker').first();
    const marker_geometry = await first_marker.evaluate((marker_element) => ({
      hit_width: marker_element.getBoundingClientRect().width,
      line_width: getComputedStyle(marker_element, '::after').width,
      line_color: getComputedStyle(marker_element, '::after').backgroundColor,
    }));
    assert.equal(marker_geometry.hit_width, 16);
    assert.equal(marker_geometry.line_width, '1px');
    await first_marker.hover({ position: { x: 1, y: 8 } });
    await page_instance.waitForTimeout(300);
    const hover_styles = await first_marker.evaluate((marker_element) => ({
      background_color: getComputedStyle(marker_element, '::before').backgroundColor,
      expected_color: getComputedStyle(document.documentElement).getPropertyValue('--theme-dark-action-secondary-hover').trim(),
      line_color: getComputedStyle(marker_element, '::after').backgroundColor,
    }));
    // Resolve the token through a real color property instead of comparing CSS serialization.
    assert.equal(hover_styles.background_color, await page_instance.evaluate((color_value) => {
      const color_probe = document.createElement('span');
      color_probe.style.color = color_value;
      document.body.append(color_probe);
      const resolved_color = getComputedStyle(color_probe).color;
      color_probe.remove();
      return resolved_color;
    }, hover_styles.expected_color));
    assert.equal(hover_styles.line_color, marker_geometry.line_color);
    await first_marker.click({ position: { x: 1, y: 8 } });
    assert.equal(await first_marker.evaluate((marker_element) =>
      document.activeElement.dataset.projectKey === marker_element.dataset.projectKey), true, 'The outer hit area activates the card.');
    await page_instance.waitForTimeout(1800);

    const scroll_samples = await page_instance.evaluate(async () => {
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise(requestAnimationFrame);
      const marker_elements = document.querySelectorAll('.timeline__marker');
      const project_marker = marker_elements[Math.min(20, marker_elements.length - 1)];
      const project_card = [...document.querySelectorAll('.timeline__year-detail')]
        .find((card_element) => card_element.dataset.projectKey === project_marker.dataset.projectKey);
      const starting_time = performance.now();
      project_marker.click();
      const sample_points = [];
      while (performance.now() - starting_time < 1800) {
        await new Promise(requestAnimationFrame);
        sample_points.push({ elapsed_time: performance.now() - starting_time, scroll_offset: window.scrollY });
      }
      return { sample_points, target_offset: window.scrollY,
        card_top: project_card.getBoundingClientRect().top,
        window_top: project_card.closest('.timeline__details-window').getBoundingClientRect().top,
        window_bottom: project_card.closest('.timeline__details-window').getBoundingClientRect().bottom,
      };
    });
    assert.ok(new Set(scroll_samples.sample_points.map((sample_point) => sample_point.scroll_offset)).size > 10, 'Navigation animates through intermediate positions.');
    assert.ok(scroll_samples.sample_points.find((sample_point) => sample_point.elapsed_time >= 200).scroll_offset < scroll_samples.target_offset * 0.2, 'Departure eases in.');
    assert.ok(scroll_samples.card_top >= scroll_samples.window_top - 2
      && scroll_samples.card_top < scroll_samples.window_bottom, 'Description lands inside its sticky viewport.');
    assert.equal(scroll_samples.sample_points.at(-1).scroll_offset, scroll_samples.sample_points.at(-3).scroll_offset, 'Navigation settles.');

    await first_marker.evaluate((marker_element) => marker_element.click());
    await page_instance.waitForTimeout(200);
    await page_instance.mouse.wheel(0, 100);
    await page_instance.waitForTimeout(150);
    const stopped_offset = await page_instance.evaluate(() => window.scrollY);
    await page_instance.waitForTimeout(1700);
    assert.equal(await page_instance.evaluate(() => window.scrollY), stopped_offset, 'Wheel input cancels navigation.');

    await page_instance.emulateMedia({ reducedMotion: 'reduce' });
    await first_marker.evaluate((marker_element) => marker_element.focus({ preventScroll: true }));
    await page_instance.keyboard.press('Enter');
    assert.equal(await first_marker.evaluate((marker_element) =>
      document.activeElement.dataset.projectKey === marker_element.dataset.projectKey), true, 'Keyboard activation focuses the description.');
    const reduced_offset = await page_instance.evaluate(() => window.scrollY);
    await page_instance.waitForTimeout(200);
    assert.equal(await page_instance.evaluate(() => window.scrollY), reduced_offset, 'Reduced motion navigates immediately.');
    await page_instance.setViewportSize({ width: 375, height: 812 });
    assert.equal(await first_marker.evaluate((marker_element) => marker_element.getBoundingClientRect().width), 16);
    assert.equal(await page_instance.locator('.timeline__marker').evaluateAll((marker_elements) =>
      marker_elements.every((marker_element) => marker_element.getBoundingClientRect().right
        <= marker_element.closest('.timeline__rail-window').getBoundingClientRect().right)), true, 'The outer lane hit area is not clipped on mobile.');
    await page_instance.setViewportSize({ width: 1440, height: 1000 });
    assert.equal(await page_instance.locator('.timeline__marker').evaluateAll((marker_elements) =>
      marker_elements.every((marker_element) => marker_element.getBoundingClientRect().right
        <= marker_element.closest('.timeline__rail-window').getBoundingClientRect().right)), true, 'The outer lane hit area is not clipped on desktop.');
    console.log(route_url + ': hit area, thin line, hover, eased navigation, cancellation and reduced motion passed.');
  }
  assert.deepEqual(runtime_errors, []);
} finally {
  await browser_instance.close();
}
