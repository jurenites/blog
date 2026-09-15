import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const storybook_directory = resolve('storybook-static');
const artifact_directory = resolve('artifacts/vertical-rhythm');
const content_types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server_instance = createServer(async (http_request, http_response) => {
  const file_path = resolve(storybook_directory, `.${decodeURIComponent(new URL(http_request.url, 'http://localhost').pathname)}`);
  if (!file_path.startsWith(`${storybook_directory}${sep}`)) {
    http_response.writeHead(403).end();
    return;
  }
  try {
    const file_body = await readFile(file_path);
    http_response.writeHead(200, { 'content-type': content_types[extname(file_path)] || 'application/octet-stream' }).end(file_body);
  } catch {
    http_response.writeHead(404).end();
  }
});
await new Promise(resolve_listen => { server_instance.listen(0, '127.0.0.1', resolve_listen); });
const base_url = `http://127.0.0.1:${server_instance.address().port}`;
const index_data = JSON.parse(await readFile(resolve(storybook_directory, 'index.json'), 'utf8'));
const story_entries = Object.values(index_data.entries).filter(story_entry => story_entry.type === 'story' && /^(Atoms|Molecules|Organisms|Foundations)\//.test(story_entry.title));
const audit_results = [];
const header_results = [];
const browser_instance = await chromium.launch({headless: true});

async function open_story(page_instance, story_id) {
  await page_instance.goto(`${base_url}/iframe.html?id=${story_id}&viewMode=story`, {waitUntil: 'load'});
  await page_instance.locator('#storybook-root > *').first().waitFor();
  await page_instance.evaluate(() => document.fonts.ready);
}

try {
  // Each story/viewport is a separate rendered check; inspect text line boxes,
  // including inline text, without confusing glyph bounds with layout heights.
  const audit_jobs = story_entries.flatMap(story_entry => [360, 768, 1280, 1440, 1920].map(viewport_width => ({story_entry, viewport_width})));
  await Promise.all(Array.from({length: 4}, async () => {
    const page_instance = await browser_instance.newPage();
    while (audit_jobs.length) {
      const {story_entry, viewport_width} = audit_jobs.shift();
      await page_instance.setViewportSize({width: viewport_width, height: 900});
      await open_story(page_instance, story_entry.id);
      const text_issues = await page_instance.evaluate(() => [...document.querySelectorAll('#storybook-root *')].flatMap(page_element => {
        const element_rect = page_element.getBoundingClientRect();
        const computed_style = getComputedStyle(page_element);
        const has_text = [...page_element.childNodes].some(child_node => child_node.nodeType === Node.TEXT_NODE && child_node.textContent.trim());
        // Replaced media does not render its fallback text in this browser.
        if (!has_text || !element_rect.width || !element_rect.height || computed_style.visibility === 'hidden' || computed_style.display === 'none' || computed_style.clipPath === 'inset(50%)' || computed_style.clip === 'rect(0px, 0px, 0px, 0px)' || page_element.closest('svg, canvas, video, audio, iframe, object')) return [];
        const line_height = Number.parseFloat(computed_style.lineHeight);
        const aligned_line = Number.isFinite(line_height) && Math.abs(line_height / 2 - Math.round(line_height / 2)) < 0.001;
        const uneven_box = computed_style.display !== 'inline' && Math.abs(element_rect.height / 2 - Math.round(element_rect.height / 2)) > 0.001;
        let transformed_box = false;
        for (let ancestor_element = page_element; ancestor_element; ancestor_element = ancestor_element.parentElement) {
          if (getComputedStyle(ancestor_element).transform !== 'none') transformed_box = true;
        }
        if (aligned_line && (!uneven_box || transformed_box)) return [];
        return [{element_name: page_element.tagName, class_name: page_element.className, font_size: computed_style.fontSize, line_height: computed_style.lineHeight, box_height: element_rect.height}];
      }));
      audit_results.push({story_id: story_entry.id, viewport_width, text_issues});
      if (audit_results.length % 100 === 0) console.log(`Audited ${audit_results.length} story/viewports`);
    }
    await page_instance.close();
  }));

  const header_story = story_entries.find(story_entry => story_entry.id.includes('site-header--default-story'));
  assert(header_story, 'Site Header story must exist');
  const page_instance = await browser_instance.newPage();
  for (const viewport_width of [768, 1280, 1440, 1920]) {
    await page_instance.setViewportSize({width: viewport_width, height: 900});
    for (const interaction_name of ['hover', 'focus', 'reduced-motion']) {
      await page_instance.emulateMedia({reducedMotion: interaction_name === 'reduced-motion' ? 'reduce' : 'no-preference'});
      await open_story(page_instance, header_story.id);
      await page_instance.evaluate(() => {
        const content_marker = document.createElement('p');
        content_marker.id = 'following-content-marker';
        content_marker.textContent = 'Following content';
        document.querySelector('.site-header').after(content_marker);
        window.rhythm_samples = [];
        window.rhythm_sampling = true;
        function sample_geometry() {
          window.rhythm_samples.push(Object.fromEntries(['.site-header', '.site-header__brand-name', '#following-content-marker'].map(selector_text => {
            const element_rect = document.querySelector(selector_text).getBoundingClientRect();
            return [selector_text, {top: element_rect.top, height: element_rect.height}];
          })));
          if (window.rhythm_sampling) requestAnimationFrame(sample_geometry);
        }
        sample_geometry();
      });
      const brand_locator = page_instance.locator('.site-header__brand');
      if (interaction_name === 'focus') await brand_locator.focus();
      else await brand_locator.hover();
      await page_instance.waitForTimeout(750);
      if (interaction_name === 'focus') await brand_locator.blur();
      else await page_instance.mouse.move(viewport_width - 1, 899);
      await page_instance.waitForTimeout(2450);
      const geometry_samples = await page_instance.evaluate(() => {
        window.rhythm_sampling = false;
        return window.rhythm_samples;
      });
      const initial_geometry = geometry_samples[0];
      assert.equal(initial_geometry['.site-header__brand-name'].height, 48);
      assert.equal(initial_geometry['.site-header'].height % 8, 0);
      for (const geometry_sample of geometry_samples) assert.deepEqual(geometry_sample, initial_geometry, `${viewport_width}px ${interaction_name}: header/content moved during reveal or collapse`);
      assert.equal(await brand_locator.evaluate(brand_element => brand_element.classList.contains('is-brand-revealed')), false);
      header_results.push({viewport_width, interaction_name, sample_count: geometry_samples.length, geometry: initial_geometry});
    }
  }
} finally {
  await mkdir(artifact_directory, {recursive: true});
  await writeFile(resolve(artifact_directory, 'browser-audit.json'), JSON.stringify({audit_results, header_results}, null, 2));
  await browser_instance.close();
  server_instance.close();
}
const failed_results = audit_results.filter(audit_result => audit_result.text_issues.length);
console.log(JSON.stringify(failed_results, null, 2));
assert.equal(failed_results.length, 0, 'Visible text line boxes and untransformed non-inline text containers must have even whole pixel heights');
console.log(`PASS: ${story_entries.length} stories, ${audit_results.length} story/viewports, ${header_results.length} complete header interaction cycles.`);
