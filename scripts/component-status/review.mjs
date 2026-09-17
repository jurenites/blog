import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { compare_images } from './images.mjs';
import { source_fingerprint, validate_report } from './report.mjs';

export function validate_review_case(input_data, component_rows) {
  const component_row = component_rows.find((row_item) => row_item.component_id === input_data.component_id);
  if (!component_row) throw new Error('Choose a component from the catalogue.');
  const website_url = new URL(input_data.drupal_url, 'http://jurenites.local');
  if (!['http:', 'https:'].includes(website_url.protocol) || website_url.username || website_url.password) throw new Error('Use an HTTP(S) website URL without credentials.');
  const story_url = new URL(input_data.story_url, 'http://localhost');
  if (story_url.origin !== 'http://localhost' || story_url.pathname !== '/storybook/iframe.html' || !component_row.story_ids.includes(story_url.searchParams.get('id'))) throw new Error('Use this component’s local Storybook iframe URL.');
  for (const selector_key of ['drupal_selector', 'story_selector']) {
    if (typeof input_data[selector_key] !== 'string' || !input_data[selector_key].trim() || input_data[selector_key].length > 1000) throw new Error('Enter a CSS selector for each component region.');
  }
  const viewport_width = Number(input_data.viewport_width);
  const viewport_height = Number(input_data.viewport_height);
  if (![viewport_width, viewport_height].every((pixel_value) => Number.isInteger(pixel_value) && pixel_value >= 320 && pixel_value <= 2560)) throw new Error('Viewport dimensions must be whole pixels between 320 and 2560.');
  const figma_url = String(input_data.figma_url ?? '').trim();
  if (figma_url) {
    const parsed_figma = new URL(figma_url);
    if (parsed_figma.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(parsed_figma.hostname)) throw new Error('Use an HTTPS Figma file/frame link.');
  }
  return { component_id: component_row.component_id, drupal_url: website_url.href, drupal_selector: input_data.drupal_selector.trim(), story_url: `${story_url.pathname}${story_url.search}`, story_selector: input_data.story_selector.trim(), viewport_width, viewport_height, figma_url, inputs_matched: input_data.inputs_matched === true };
}

export function decode_baseline(png_data) {
  if (typeof png_data !== 'string' || !png_data.startsWith('data:image/png;base64,')) throw new Error('Choose a PNG exported at 1×.');
  const image_buffer = Buffer.from(png_data.slice(22), 'base64');
  if (image_buffer.length < 24 || image_buffer.length > 8 * 1024 * 1024 || image_buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('PNG must be valid and no larger than 8 MB.');
  const image_width = image_buffer.readUInt32BE(16), image_height = image_buffer.readUInt32BE(20);
  if (!image_width || !image_height || image_width * image_height > 16000000) throw new Error('PNG must contain at most 16 million pixels.');
  PNG.sync.read(image_buffer);
  return image_buffer;
}

export async function read_review_cases(report_directory) {
  try { return JSON.parse(await readFile(resolve(report_directory, 'review-cases.json'), 'utf8')); }
  catch (read_error) { if (read_error.code === 'ENOENT') return {}; throw read_error; }
}

export async function run_visual_review({ project_root, report_directory, status_origin, review_case, png_data, remove_baseline }) {
  const run_id = `review-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const artifact_directory = resolve(report_directory, 'artifacts', run_id);
  await mkdir(artifact_directory, { recursive: true });
  const saved_cases = await read_review_cases(report_directory);
  const previous_case = saved_cases[review_case.component_id];
  if (!remove_baseline && previous_case?.figma_baseline) review_case.figma_baseline = previous_case.figma_baseline;
  if (png_data) {
    const image_buffer = decode_baseline(png_data);
    const image_name = `${createHash('sha256').update(image_buffer).digest('hex')}.png`;
    await mkdir(resolve(report_directory, 'artifacts/baselines'), { recursive: true });
    await writeFile(resolve(report_directory, 'artifacts/baselines', image_name), image_buffer);
    review_case.figma_baseline = `artifacts/baselines/${image_name}`;
  }
  saved_cases[review_case.component_id] = review_case;
  await writeFile(resolve(report_directory, 'review-cases.json.tmp'), JSON.stringify(saved_cases, null, 2));
  await rename(resolve(report_directory, 'review-cases.json.tmp'), resolve(report_directory, 'review-cases.json'));
  const current_fingerprint = await source_fingerprint(project_root);
  const check_results = [];
  const captured_views = {};
  const capture_details = { ...review_case, device_scale: 1, platform_name: process.platform, locale_name: 'en-US', timezone_name: 'UTC', color_scheme: 'dark', data_mode: 'Live page; content and form values recorded in artifacts' };
  const report_data = { schema_version: 1, source_name: 'manual-review', checked_at: new Date().toISOString(), run_id, source_fingerprint: current_fingerprint, components: [{ component_id: review_case.component_id, checks: check_results }] };
  const artifact_item = (file_name, artifact_label) => ({ artifact_path: `artifacts/${run_id}/${file_name}`, artifact_label });
  let browser_instance;
  try {
    const build_info = JSON.parse(await readFile(resolve(project_root, 'storybook-static/component-status-build.json'), 'utf8'));
    if (build_info.source_fingerprint !== current_fingerprint) throw new Error('Source changed since Storybook was built. Run npm run status:build, then capture again.');
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(project_root, '.cache/ms-playwright');
    const { chromium } = await import('playwright');
    browser_instance = await chromium.launch({ headless: true });
    capture_details.browser_version = browser_instance.version();
    for (const [view_key, page_url, selector_value] of [
      ['drupal', review_case.drupal_url, review_case.drupal_selector],
      ['storybook', `${status_origin}${review_case.story_url}`, review_case.story_selector],
    ]) {
      const browser_context = await browser_instance.newContext({ viewport: { width: review_case.viewport_width, height: review_case.viewport_height }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
      const capture_timer = setTimeout(() => { browser_context.close().catch(() => {}); }, 60000);
      try {
        const page_instance = await browser_context.newPage();
        page_instance.setDefaultTimeout(15000);
        const page_errors = [];
        page_instance.on('pageerror', (page_error) => page_errors.push(page_error.message));
        const page_response = await page_instance.goto(page_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!page_response?.ok()) throw new Error(`Page returned HTTP ${page_response?.status() ?? 'unknown'}.`);
        const component_locator = page_instance.locator(selector_value);
        await component_locator.first().waitFor({ state: 'visible' });
        if (await component_locator.count() !== 1) throw new Error('Selector matches more than one region. Choose a unique CSS selector.');
        await component_locator.scrollIntoViewIfNeeded();
        await page_instance.waitForFunction(() => document.fonts.status === 'loaded');
        await component_locator.evaluate(async (component_element) => { await Promise.all([...component_element.querySelectorAll('img')].map((image_element) => image_element.decode())); });
        await page_instance.waitForFunction((component_element) => [component_element, ...component_element.querySelectorAll('[data-jurenites-font-preview], [data-loading-stage]')].every((child_element) => (!child_element.hasAttribute('data-jurenites-font-preview') || ['ready', 'error'].includes(child_element.dataset.enhancementState)) && (!child_element.hasAttribute('data-loading-stage') || child_element.dataset.loadingStage === 'complete')), await component_locator.elementHandle());
        const content_data = await component_locator.evaluate((component_element) => ({ text_content: component_element.innerText, input_values: [...component_element.querySelectorAll('input, textarea, select')].map((input_element) => input_element.value), image_sources: [...component_element.querySelectorAll('img')].map((image_element) => image_element.currentSrc), enhancement_errors: [component_element, ...component_element.querySelectorAll('[data-enhancement-state]')].filter((child_element) => child_element.dataset.enhancementState === 'error').length }));
        const component_bounds = await component_locator.boundingBox();
        if (component_bounds.width * component_bounds.height > 16000000) throw new Error('Region is too large. Choose a smaller component selector.');
        const image_buffer = await component_locator.screenshot({ animations: 'disabled', timeout: 15000 });
        await writeFile(resolve(artifact_directory, `${view_key}.png`), image_buffer);
        await writeFile(resolve(artifact_directory, `${view_key}-content.json`), JSON.stringify(content_data, null, 2));
        captured_views[view_key] = image_buffer;
        check_results.push({ check_key: view_key, check_label: view_key === 'drupal' ? 'Actual website rendering' : 'Storybook rendering', status: page_errors.length || content_data.enhancement_errors ? 'failed' : 'passed', message: `Captured the selected region on the complete ${view_key === 'drupal' ? 'website page, with its inherited CSS and surrounding layout' : 'Storybook page'}.${page_errors.length || content_data.enhancement_errors ? ' Browser or enhancement errors need review.' : ''}`, details: { ...capture_details, actual_url: page_instance.url(), component_bounds, page_errors, content_data, frame_policy: page_response.headers()['x-frame-options'] ?? '' }, artifacts: [artifact_item(`${view_key}.png`, view_key === 'drupal' ? 'Actual website' : 'Storybook')] });
      } catch (capture_error) {
        check_results.push({ check_key: view_key, check_label: view_key === 'drupal' ? 'Actual website rendering' : 'Storybook rendering', status: 'blocked', message: capture_error.message, details: capture_details });
      } finally { clearTimeout(capture_timer); await browser_context.close(); }
    }
    if (captured_views.drupal && captured_views.storybook) {
      await compare_pair('integration', 'Storybook / website pixels', captured_views.storybook, captured_views.drupal);
    } else {
      check_results.push({ check_key: 'integration', check_label: 'Storybook / website pixels', status: 'blocked', message: 'Both captures are required.' });
    }
    if (review_case.figma_baseline) {
      const figma_buffer = await readFile(resolve(report_directory, review_case.figma_baseline));
      const figma_results = [];
      for (const view_key of ['storybook', 'drupal']) {
        if (captured_views[view_key]) figma_results.push(await compare_pair(`figma-${view_key}`, `Figma / ${view_key} pixels`, figma_buffer, captured_views[view_key], false));
      }
      check_results.push({ check_key: 'figma', check_label: 'Figma design parity', status: figma_results.some((pair_result) => pair_result.status === 'failed') ? 'failed' : figma_results.length === 2 && figma_results.every((pair_result) => pair_result.status === 'passed') ? 'passed' : 'blocked', message: figma_results.map((pair_result) => `${pair_result.check_label}: ${pair_result.message}`).join(' ') || 'Capture an implementation before comparing the Figma PNG.', details: figma_results, artifacts: [{ artifact_path: review_case.figma_baseline, artifact_label: 'Figma · uploaded 1× reference' }, ...figma_results.flatMap((pair_result) => pair_result.artifacts)] });
    }
  } catch (run_error) {
    for (const check_key of ['storybook', 'drupal', 'integration']) if (!check_results.some((check_item) => check_item.check_key === check_key)) check_results.push({ check_key, check_label: check_key, status: 'blocked', message: run_error.message });
  } finally { await browser_instance?.close(); }
  if (!check_results.some((check_item) => check_item.check_key === 'figma')) check_results.push({ check_key: 'figma', check_label: 'Figma design parity', status: review_case.figma_baseline ? 'blocked' : 'missing', message: review_case.figma_baseline ? 'Figma comparison could not run.' : review_case.figma_url ? 'Figma frame linked; exported PNG is missing. Website / Storybook comparison is independent.' : 'No Figma reference yet. Compare the implementations first, then reflect the reviewed design in Figma.', artifacts: [] });
  report_data.checked_at = new Date().toISOString();
  validate_report(report_data);
  const report_path = resolve(report_directory, `report-review-${review_case.component_id}.json`);
  await writeFile(`${report_path}.tmp`, JSON.stringify(report_data, null, 2));
  await rename(`${report_path}.tmp`, report_path);
  return report_data;

  async function compare_pair(check_key, check_label, reference_buffer, actual_buffer, store_result = true) {
    const image_result = compare_images(reference_buffer, actual_buffer);
    const image_artifacts = [];
    if (image_result.difference_buffer) {
      await writeFile(resolve(artifact_directory, `${check_key}-diff.png`), image_result.difference_buffer);
      image_artifacts.push(artifact_item(`${check_key}-diff.png`, `${check_label} · difference`));
    }
    delete image_result.difference_buffer;
    const pair_result = { check_key, check_label, status: review_case.inputs_matched ? image_result.status : 'blocked', message: review_case.inputs_matched ? image_result.message : `Exploratory comparison: confirm matching content, language and state before treating this as a parity result. ${image_result.message}`, details: { ...capture_details, ...image_result }, artifacts: image_artifacts };
    if (store_result) check_results.push(pair_result);
    return pair_result;
  }
}
