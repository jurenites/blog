import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';
import { compare_images } from './images.mjs';
import { source_fingerprint, validate_report } from './report.mjs';

export async function run_language_picker({ project_root, report_directory, status_origin }) {
  const case_config = JSON.parse(await readFile(resolve(project_root, 'config/component-status.json'), 'utf8')).components['organisms-top-nav-menu-site-header'];
  const baseline_manifest = JSON.parse(await readFile(resolve(project_root, 'tests/visual-baselines/language-picker/manifest.json'), 'utf8'));
  const run_id = `language-picker-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const artifact_directory = resolve(report_directory, 'artifacts', run_id);
  await mkdir(artifact_directory, { recursive: true });
  const current_fingerprint = await source_fingerprint(project_root);
  const visual_states = [];
  const check_groups = { storybook: [], drupal: [], integration: [], figma: [] };
  const group_artifacts = { storybook: [], drupal: [], integration: [], figma: [] };
  const report_data = {
    schema_version: 1, source_name: 'language-picker', run_id, checked_at: new Date().toISOString(),
    source_fingerprint: current_fingerprint,
    source_commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: project_root, encoding: 'utf8' }).trim(),
    source_dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: project_root, encoding: 'utf8' }).trim()),
    components: [{ component_id: 'organisms-top-nav-menu-site-header', checks: [] }],
  };
  const artifact_path = (file_name) => `artifacts/${run_id}/${file_name}`;
  let browser_instance;
  try {
    const build_info = JSON.parse(await readFile(resolve(project_root, 'storybook-static/component-status-build.json'), 'utf8'));
    if (build_info.source_fingerprint !== current_fingerprint) throw new Error('Source changed since Storybook was built. Run npm run status:build first.');
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(project_root, '.cache/ms-playwright');
    const { chromium } = await import('playwright');
    browser_instance = await chromium.launch({ headless: true });
    const capture_environment = { browser_version: browser_instance.version(), platform_name: process.platform, device_scale: 1, locale_name: 'en-US', timezone_name: 'UTC', color_scheme: 'dark', reduced_motion: 'reduce' };
    for (const state_case of baseline_manifest.states) {
      const baseline_buffer = await readFile(resolve(project_root, 'tests/visual-baselines/language-picker', `${state_case.state_id}.png`));
      if (createHash('sha256').update(baseline_buffer).digest('hex') !== state_case.sha256) throw new Error(`Pinned baseline changed: ${state_case.state_id}. Review and record its provenance before replacing it.`);
      const baseline_image = PNG.sync.read(baseline_buffer);
      if (baseline_image.width !== state_case.width || baseline_image.height !== state_case.height) throw new Error(`Baseline dimensions changed: ${state_case.state_id}.`);
      await writeFile(resolve(artifact_directory, `figma-${state_case.state_id}.png`), baseline_buffer);
      for (const viewport_width of case_config.viewport_widths) {
        const state_record = { state_id: `${state_case.state_id}-${viewport_width}`, state_label: `${state_case.state_label} · ${viewport_width}px viewport`, figma_url: `${baseline_manifest.file_url}?node-id=${state_case.node_id.replace(':', '-')}`, images: { figma: artifact_path(`figma-${state_case.state_id}.png`) }, comparisons: [], capture_environment, viewport_width, viewport_height: case_config.viewport_height };
        visual_states.push(state_record);
        const capture_buffers = {};
        for (const [source_name, page_url] of [['storybook', `${status_origin}${case_config.story_url}`], ['drupal', case_config.drupal_url]]) {
          const browser_context = await browser_instance.newContext({ viewport: { width: viewport_width, height: case_config.viewport_height }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
          const capture_timer = setTimeout(() => { browser_context.close().catch(() => {}); }, 60000);
          try {
            const page_instance = await browser_context.newPage();
            page_instance.setDefaultTimeout(15000);
            const browser_errors = [];
            page_instance.on('pageerror', (page_error) => browser_errors.push(page_error.message));
            const page_response = await page_instance.goto(page_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
            if (!page_response?.ok()) throw new Error(`HTTP ${page_response?.status() ?? 'unknown'}`);
            const region_locator = page_instance.locator(case_config[`${source_name === 'drupal' ? 'drupal' : 'story'}_selector`]);
            await region_locator.first().waitFor({ state: 'visible' });
            if (await region_locator.count() !== 1) throw new Error('Expected exactly one language picker.');
            const trigger_locator = region_locator.locator('.select-input__trigger');
            await trigger_locator.waitFor({ state: 'visible' });
            await page_instance.evaluate(() => document.fonts.ready);
            await page_instance.mouse.move(0, case_config.viewport_height - 1);
            if (await region_locator.locator('.select-input__value').innerText() !== 'Eng') throw new Error('Unmatched content: expected Eng selected.');
            const option_labels = await region_locator.locator('.select-input__option').allTextContents();
            if (JSON.stringify(option_labels) !== JSON.stringify(['Eng', 'Rus'])) throw new Error('Unmatched language options.');
            if (state_case.state_id === 'suffix-hover') await region_locator.locator('.select-input__suffix').hover();
            if (state_case.state_id === 'expanded') {
              await trigger_locator.click();
              await region_locator.locator('.select-input__menu').waitFor({ state: 'visible' });
              await region_locator.locator('.select-input__option').first().hover();
            }
            await region_locator.evaluate(async (region_element) => { await Promise.all(region_element.getAnimations({ subtree: true }).filter((animation_item) => animation_item.effect?.getTiming().iterations !== Infinity).map((animation_item) => animation_item.finished.catch(() => {}))); });
            const capture_bounds = await region_locator.boundingBox();
            if (state_case.state_id === 'expanded') {
              const menu_bounds = await region_locator.locator('.select-input__menu').boundingBox();
              const right_edge = Math.max(capture_bounds.x + capture_bounds.width, menu_bounds.x + menu_bounds.width);
              const bottom_edge = Math.max(capture_bounds.y + capture_bounds.height, menu_bounds.y + menu_bounds.height);
              capture_bounds.x = Math.min(capture_bounds.x, menu_bounds.x);
              capture_bounds.y = Math.min(capture_bounds.y, menu_bounds.y);
              capture_bounds.width = right_edge - capture_bounds.x;
              capture_bounds.height = bottom_edge - capture_bounds.y;
            }
            const capture_buffer = await page_instance.screenshot({ clip: capture_bounds, animations: 'disabled' });
            capture_buffers[source_name] = capture_buffer;
            const image_name = `${state_record.state_id}-${source_name}.png`;
            state_record.images[source_name] = artifact_path(image_name);
            await writeFile(resolve(artifact_directory, image_name), capture_buffer);
            group_artifacts[source_name].push({ artifact_path: artifact_path(image_name), artifact_label: `${state_record.state_label} · ${source_name}` });
            const rendered_metrics = await region_locator.evaluate((region_element) => {
              const region_bounds = region_element.getBoundingClientRect();
              const element_metrics = {};
              for (const class_name of ['select-input__trigger', 'select-input__value', 'select-input__suffix', 'select-input__suffix-icon', 'select-input__menu', 'select-input__option']) {
                const child_element = region_element.querySelector(`.${class_name}`);
                const child_bounds = child_element.getBoundingClientRect();
                const child_style = getComputedStyle(child_element);
                element_metrics[class_name] = { x: child_bounds.x - region_bounds.x, y: child_bounds.y - region_bounds.y, width: child_bounds.width, height: child_bounds.height, color: child_style.color, background_color: child_style.backgroundColor, font: child_style.font, line_height: child_style.lineHeight, transform: child_style.transform };
              }
              element_metrics.suffix_hover_background = getComputedStyle(region_element.querySelector('.select-input__suffix'), '::before').backgroundColor;
              const header_element = region_element.closest('header');
              const header_bounds = header_element.getBoundingClientRect();
              const overlapping_items = [...header_element.querySelectorAll('.site-header__brand, .site-header__navigation, .site-header__menu-toggle')].filter((header_item) => {
                const item_bounds = header_item.getBoundingClientRect();
                return item_bounds.width > 0 && item_bounds.height > 0 && item_bounds.left < region_bounds.right && item_bounds.right > region_bounds.left && item_bounds.top < region_bounds.bottom && item_bounds.bottom > region_bounds.top;
              }).map((header_item) => header_item.className);
              return { element_metrics, overlapping_items, outside_header: region_bounds.left < header_bounds.left || region_bounds.right > header_bounds.right || region_bounds.top < header_bounds.top || region_bounds.bottom > header_bounds.bottom, horizontal_overflow: document.documentElement.scrollWidth > innerWidth + 1, language_values: [...region_element.querySelectorAll('option')].map((option_element) => ({ option_label: option_element.textContent, option_value: option_element.value })), expanded_state: region_element.querySelector('.select-input__trigger').getAttribute('aria-expanded') };
            });
            const expected_expanded = state_case.state_id === 'expanded' ? 'true' : 'false';
            const rendering_failed = browser_errors.length || rendered_metrics.horizontal_overflow || rendered_metrics.outside_header || rendered_metrics.overlapping_items.length || rendered_metrics.expanded_state !== expected_expanded;
            check_groups[source_name].push({ state_id: state_record.state_id, status: rendering_failed ? 'failed' : 'passed', actual_url: page_instance.url(), capture_bounds, browser_errors, ...rendered_metrics });
            const header_image = `${state_record.state_id}-${source_name}-header.png`;
            await page_instance.locator('header').screenshot({ path: resolve(artifact_directory, header_image), animations: 'disabled' });
            group_artifacts[source_name].push({ artifact_path: artifact_path(header_image), artifact_label: `${state_record.state_label} · ${source_name} header context (no full-header Figma assertion)` });
            if (state_case.state_id === 'expanded') {
              await page_instance.keyboard.press('Escape');
              const escape_closed = await trigger_locator.getAttribute('aria-expanded') === 'false';
              await trigger_locator.focus();
              await page_instance.keyboard.press('ArrowDown');
              await region_locator.locator('.select-input__menu').waitFor({ state: 'visible' });
              await page_instance.waitForFunction((option_element) => document.activeElement === option_element, await region_locator.locator('.select-input__option').first().elementHandle());
              await page_instance.keyboard.press('End');
              const last_option_focused = await region_locator.locator('.select-input__option').last().evaluate((option_element) => document.activeElement === option_element);
              await page_instance.keyboard.press('Escape');
              const focus_restored = await trigger_locator.evaluate((trigger_element) => document.activeElement === trigger_element);
              check_groups[source_name].push({ state_id: state_record.state_id, check_scope: 'keyboard', status: escape_closed && last_option_focused && focus_restored ? 'passed' : 'failed', escape_closed, last_option_focused, focus_restored });
            }

          } catch (capture_error) {
            check_groups[source_name].push({ state_id: state_record.state_id, status: 'blocked', message: capture_error.message });
          } finally { clearTimeout(capture_timer); await browser_context.close(); }
        }
        for (const [pair_name, first_name, second_name, group_name] of [['implementation', 'storybook', 'drupal', 'integration'], ['figma-storybook', 'figma', 'storybook', 'figma'], ['figma-drupal', 'figma', 'drupal', 'figma']]) {
          const first_buffer = first_name === 'figma' ? baseline_buffer : capture_buffers[first_name];
          const second_buffer = capture_buffers[second_name];
          const pair_result = first_buffer && second_buffer ? compare_images(first_buffer, second_buffer) : { status: 'blocked', message: 'A required capture is missing.' };
          if (pair_result.difference_buffer) {
            const difference_name = `${state_record.state_id}-${pair_name}-diff.png`;
            await writeFile(resolve(artifact_directory, difference_name), pair_result.difference_buffer);
            group_artifacts[group_name].push({ artifact_path: artifact_path(difference_name), artifact_label: `${state_record.state_label} · ${pair_name} difference` });
            delete pair_result.difference_buffer;
          }
          const pair_details = { state_id: state_record.state_id, pair_name, ...pair_result };
          check_groups[group_name].push(pair_details);
          state_record.comparisons.push(pair_details);
        }
        group_artifacts.figma.push({ artifact_path: state_record.images.figma, artifact_label: `${state_case.state_label} · pinned Figma 1×` });
      }
    }
  } catch (run_error) {
    for (const group_name of Object.keys(check_groups)) check_groups[group_name].push({ status: 'blocked', message: run_error.message });
  } finally { await browser_instance?.close(); }
  for (const [check_key, check_label] of [['storybook', 'Language picker · Storybook rendering / keyboard / header layout'], ['drupal', 'Language picker · Drupal rendering / keyboard / header layout'], ['integration', 'Language picker · Storybook / Drupal pixels'], ['figma', 'Language picker · Figma design parity']]) {
    const result_items = check_groups[check_key];
    const status_value = result_items.some((result_item) => result_item.status === 'failed') ? 'failed' : result_items.length && result_items.every((result_item) => result_item.status === 'passed') ? 'passed' : 'blocked';
    const summary_text = `${result_items.filter((result_item) => result_item.status === 'passed').length}/${result_items.length} checks passed. Scope: language picker only; full-header visual parity is not asserted.`;
    report_data.components[0].checks.push({ check_key, check_label, status: status_value, message: summary_text, details: { result_items, ...(check_key === 'integration' ? { visual_states } : {}) }, artifacts: group_artifacts[check_key] });
  }
  report_data.checked_at = new Date().toISOString();
  validate_report(report_data);
  const report_path = resolve(report_directory, 'report-language-picker.json');
  await writeFile(`${report_path}.tmp`, JSON.stringify(report_data, null, 2));
  await rename(`${report_path}.tmp`, report_path);
  return report_data;
}
