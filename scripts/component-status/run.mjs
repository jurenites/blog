import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { create_status_server, PROJECT_ROOT, REPORT_DIRECTORY } from './server.mjs';
import { component_catalogue, source_fingerprint, validate_report } from './report.mjs';
import { compare_images } from './images.mjs';

const requested_component = process.argv[2] ?? 'molecules-blog-article-blog-list-item';
const case_config = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'config/component-status.json'), 'utf8')).components[requested_component];
const story_index = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
const component_record = component_catalogue(story_index).find((component_item) => component_item.component_id === requested_component);
if (!component_record) throw new Error(`Component is absent from the built Storybook index: ${requested_component}`);
const current_fingerprint = await source_fingerprint(PROJECT_ROOT);
const run_id = new Date().toISOString().replace(/[^0-9]/g, '');
const artifact_directory = resolve(REPORT_DIRECTORY, 'artifacts', run_id);
await mkdir(artifact_directory, { recursive: true });
const report_data = {
  schema_version: 1, source_name: 'local', run_id, checked_at: new Date().toISOString(),
  source_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim(),
  source_dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim()),
  source_fingerprint: current_fingerprint,
  components: [{ component_id: requested_component, checks: [] }], pipeline_checks: [],
};
const component_checks = report_data.components[0].checks;
const local_server = create_status_server();
await new Promise((resolve_listen) => { local_server.listen(0, '127.0.0.1', resolve_listen); });
const status_origin = `http://127.0.0.1:${local_server.address().port}`;
let browser_instance;

function check_result(check_key, check_label, status, message, details, artifacts = []) {
  return { check_key, check_label, status, message, details, artifacts };
}
function artifact_reference(file_name, artifact_label) {
  return { artifact_path: `artifacts/${run_id}/${file_name}`, artifact_label };
}
async function settle_component(page_instance, component_locator) {
  await component_locator.waitFor({ state: 'visible', timeout: 15000 });
  await component_locator.scrollIntoViewIfNeeded();
  await page_instance.evaluate(() => document.fonts.ready);
  await component_locator.evaluate(async (component_element) => {
    await Promise.all([...component_element.querySelectorAll('img')].map((image_element) => image_element.decode()));
  });
  await page_instance.waitForFunction((component_element) => [...component_element.querySelectorAll('[data-loading-stage]')].every((image_element) => image_element.dataset.loadingStage === 'complete'), await component_locator.elementHandle(), { timeout: 15000 });
}
async function capture_health(page_instance, component_locator) {
  return component_locator.evaluate((component_element) => {
    const component_bounds = component_element.getBoundingClientRect();
    return {
      component_width: Math.round(component_bounds.width), component_height: Math.round(component_bounds.height),
      horizontal_overflow: document.documentElement.scrollWidth > innerWidth + 1,
      title_text: component_element.querySelector('.article-list-item__title')?.textContent.trim() ?? '',
      excerpt_text: component_element.querySelector('.article-list-item__content')?.textContent.trim() ?? '',
      author_text: component_element.querySelector('.author-identity__name')?.textContent.trim() ?? '',
      images_loaded: [...component_element.querySelectorAll('img')].every((image_element) => image_element.complete && image_element.naturalWidth > 0),
    };
  });
}

try {
  const build_info = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/component-status-build.json'), 'utf8'));
  if (build_info.source_fingerprint !== current_fingerprint) throw new Error('Source changed since the Storybook/dashboard build. Run npm run status:build.');
  browser_instance = await chromium.launch({ headless: true });
  if (!case_config) {
    component_checks.push(check_result('storybook', 'Storybook rendering', 'blocked', 'This component has no configured capture case yet.'));
  } else {
    const story_results = [], drupal_results = [], pixel_results = [];
    const story_artifacts = [], drupal_artifacts = [], pixel_artifacts = [];
    for (const viewport_width of case_config.viewport_widths) {
      const browser_context = await browser_instance.newContext({ viewport: { width: viewport_width, height: case_config.viewport_height }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce' });
      const drupal_page = await browser_context.newPage();
      const story_page = await browser_context.newPage();
      const drupal_errors = [], story_errors = [];
      drupal_page.on('pageerror', (page_error) => drupal_errors.push(page_error.message));
      story_page.on('pageerror', (page_error) => story_errors.push(page_error.message));
      const case_evidence = { viewport_width, viewport_height: case_config.viewport_height, browser_version: browser_instance.version(), platform_name: process.platform, locale_name: 'en-US', timezone_name: 'UTC', device_scale: 1 };
      try {
        const page_response = await drupal_page.goto(case_config.drupal_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!page_response.ok()) throw new Error(`Drupal returned HTTP ${page_response.status()}.`);
        const drupal_article = drupal_page.locator(case_config.drupal_selector).first();
        await settle_component(drupal_page, drupal_article);
        const fixture_data = await drupal_article.evaluate((article_element) => {
          const text_value = (selector_value) => article_element.querySelector(selector_value)?.textContent.trim() ?? '';
          const image_element = article_element.querySelector('.article-list-item__media img');
          const avatar_image = article_element.querySelector('.avatar img');
          const published_element = article_element.querySelector('.author-byline__published time');
          return {
            article_id: article_element.dataset.articleId,
            article_url: article_element.querySelector('.article-list-item__title-link').href,
            teaser_title: text_value('.article-list-item__title'), teaser_excerpt: text_value('.article-list-item__content'),
            thumbnail_url: image_element.currentSrc || image_element.src, thumbnail_alt: image_element.alt,
            byline_label: article_element.querySelector('.author-byline')?.getAttribute('aria-label') ?? 'Article author',
            author_name: text_value('.author-identity__name'), author_url: article_element.querySelector('.author-identity__name a')?.href ?? '',
            avatar_initials: text_value('.avatar__initials'), avatar_image_url: avatar_image?.currentSrc || avatar_image?.src || '',
            avatar_size: article_element.querySelector('.avatar')?.classList.contains('avatar--small') ? 'small' : 'medium',
            published_date: published_element?.getAttribute('datetime') ?? '',
            date_value_kind: published_element?.classList.contains('date-time-value--elapsed-time') ? 'elapsed-time' : 'absolute-date',
            date_display_variant: 'date-day',
            reading_time_minutes: Number(text_value('.author-byline__duration .date-time-value__number')),
            reading_time_label: text_value('.author-byline__duration .date-time-value__label'), topic_list: '',
          };
        });
        const fixture_hash = createHash('sha256').update(JSON.stringify(fixture_data)).digest('hex');
        Object.assign(case_evidence, { article_id: fixture_data.article_id, article_url: fixture_data.article_url, content_hash: fixture_hash, thumbnail_url: fixture_data.thumbnail_url, data_mode: 'live DEV snapshot; render values recorded for this run' });
        await writeFile(resolve(REPORT_DIRECTORY, 'article-list-item.fixture.json'), JSON.stringify(fixture_data));
        await writeFile(resolve(artifact_directory, `${viewport_width}-fixture.json`), JSON.stringify(fixture_data, null, 2));
        const drupal_metrics = await capture_health(drupal_page, drupal_article);
        const drupal_capture = await drupal_article.screenshot({ animations: 'disabled' });
        await writeFile(resolve(artifact_directory, `${viewport_width}-drupal.png`), drupal_capture);
        drupal_artifacts.push(artifact_reference(`${viewport_width}-drupal.png`, `Drupal · ${viewport_width}px`));
        drupal_results.push({ ...case_evidence, ...drupal_metrics, browser_errors: drupal_errors, status: drupal_errors.length || drupal_metrics.horizontal_overflow || !drupal_metrics.images_loaded ? 'failed' : 'passed' });
        await story_page.goto(`${status_origin}/storybook/iframe.html?id=${component_record.story_ids[0]}&viewMode=story&status_fixture=article-list-item`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const story_article = story_page.locator(case_config.story_selector).first();
        await settle_component(story_page, story_article);
        const story_metrics = await capture_health(story_page, story_article);
        const story_capture = await story_article.screenshot({ animations: 'disabled' });
        await writeFile(resolve(artifact_directory, `${viewport_width}-storybook.png`), story_capture);
        story_artifacts.push(artifact_reference(`${viewport_width}-storybook.png`, `Storybook · ${viewport_width}px`));
        story_results.push({ ...case_evidence, ...story_metrics, browser_errors: story_errors, status: story_errors.length || story_metrics.horizontal_overflow || !story_metrics.images_loaded ? 'failed' : 'passed' });
        const same_content = ['title_text', 'excerpt_text', 'author_text'].every((field_name) => story_metrics[field_name] === drupal_metrics[field_name]);
        if (!same_content) {
          pixel_results.push({ ...case_evidence, status: 'blocked', message: 'Rendered title, excerpt, or author differs; pixel inputs are unmatched.' });
        } else {
          const image_result = compare_images(drupal_capture, story_capture);
          if (image_result.difference_buffer) {
            await writeFile(resolve(artifact_directory, `${viewport_width}-diff.png`), image_result.difference_buffer);
            pixel_artifacts.push(artifact_reference(`${viewport_width}-diff.png`, `Pixel difference · ${viewport_width}px`));
          }
          const image_details = { ...image_result };
          delete image_details.difference_buffer;
          pixel_results.push({ ...case_evidence, ...image_details });
        }
      } catch (capture_error) {
        const failed_case = { ...case_evidence, status: 'blocked', message: capture_error.message };
        if (!drupal_results.some((result_item) => result_item.viewport_width === viewport_width)) drupal_results.push(failed_case);
        if (!story_results.some((result_item) => result_item.viewport_width === viewport_width)) story_results.push(failed_case);
        pixel_results.push(failed_case);
      } finally { await browser_context.close(); }
    }
    for (const [check_key, check_label, case_results, artifact_items] of [
      ['storybook', 'Storybook rendering', story_results, story_artifacts],
      ['drupal', 'Drupal with real data', drupal_results, drupal_artifacts],
      ['integration', 'Storybook / Drupal pixels', pixel_results, [...drupal_artifacts, ...story_artifacts, ...pixel_artifacts]],
    ]) {
      const check_status = case_results.some((result_item) => result_item.status === 'failed') ? 'failed' : case_results.every((result_item) => result_item.status === 'passed') ? 'passed' : 'blocked';
      const result_message = check_status === 'passed' ? `${case_results.length} viewport checks passed.` : case_results.filter((result_item) => result_item.status !== 'passed').map((result_item) => `${result_item.viewport_width}px: ${result_item.message ?? 'Rendering check failed.'}`).join(' ');
      component_checks.push(check_result(check_key, check_label, check_status, result_message, case_results, artifact_items));
    }
    component_checks.push(check_result('figma', 'Figma design parity', 'blocked', case_config.figma_blocked_reason ?? 'No exported and content-matched Figma baseline has been configured.', { figma_url: case_config.figma_url, required_next_step: 'Export the specified frame, record its content and scale, then configure a matching baseline.' }));
  }
} catch (run_error) {
  component_checks.push(check_result('storybook', 'Storybook rendering', 'blocked', run_error.message));
} finally {
  await browser_instance?.close();
  await new Promise((resolve_close) => { local_server.close(resolve_close); });
  report_data.checked_at = new Date().toISOString();
  validate_report(report_data);
  const report_path = resolve(REPORT_DIRECTORY, `report-local-${requested_component}.json`);
  await writeFile(`${report_path}.tmp`, JSON.stringify(report_data, null, 2));
  await rename(`${report_path}.tmp`, report_path);
}
console.log(component_checks.map((check_item) => `${check_item.status.toUpperCase()} ${check_item.check_label}: ${check_item.message}`).join('\n'));
process.exitCode = component_checks.some((check_item) => check_item.status === 'failed') ? 1 : component_checks.some((check_item) => check_item.status === 'blocked') ? 2 : 0;
