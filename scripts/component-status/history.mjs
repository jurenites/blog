import { mkdir, readFile, writeFile, readdir, rename, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PNG } from 'pngjs';

export const HISTORY_DIRECTORY = 'visual-history';
const ID_PATTERN = /^[a-z][a-z0-9-]{1,70}$/;
const bounded_text = (text_value, maximum_length = 4000) => String(text_value ?? '').trim().slice(0, maximum_length);

export function validate_history_capture(input_data) {
  const target_id = bounded_text(input_data.target_id, 80);
  if (!ID_PATTERN.test(target_id)) throw new Error('Use a target ID such as homepage or site-header.');
  if (!['page', 'organism'].includes(input_data.target_scope)) throw new Error('Milestones are for pages and organisms.');
  const page_url = new URL(input_data.page_url, 'http://jurenites.local');
  if (!['http:', 'https:'].includes(page_url.protocol) || page_url.username || page_url.password) throw new Error('Use an HTTP(S) source without credentials.');
  if (!['development', 'production', 'preview'].includes(input_data.environment_name)) throw new Error('Choose the source environment.');
  const viewport_width = Number(input_data.viewport_width ?? 1280);
  const viewport_height = Number(input_data.viewport_height ?? 900);
  if (![viewport_width, viewport_height].every((pixel_value) => Number.isInteger(pixel_value) && pixel_value >= 320 && pixel_value <= 2560)) throw new Error('Viewport dimensions must be 320–2560 whole pixels.');
  const layer_rows = input_data.layer_rows ?? [];
  if (!Array.isArray(layer_rows) || layer_rows.length > 40) throw new Error('Use at most 40 logical layers.');
  const layer_ids = new Set();
  const normalized_layers = layer_rows.map((layer_row) => {
    if (!ID_PATTERN.test(layer_row.layer_id) || layer_ids.has(layer_row.layer_id)) throw new Error('Logical layer IDs must be unique and stable across versions.');
    layer_ids.add(layer_row.layer_id);
    if (!String(layer_row.selector_text ?? '').trim() || layer_row.selector_text.length > 1000) throw new Error('Each layer needs a CSS selector.');
    const depth_level = Number(layer_row.depth_level ?? 1);
    if (!Number.isInteger(depth_level) || depth_level < 0 || depth_level > 12) throw new Error('Layer depth must be 0–12.');
    return { layer_id: layer_row.layer_id, layer_label: bounded_text(layer_row.layer_label || layer_row.layer_id, 160), selector_text: layer_row.selector_text.trim(), depth_level, reason_text: bounded_text(layer_row.reason_text) };
  });
  return { target_id, target_scope: input_data.target_scope, target_label: bounded_text(input_data.target_label || target_id, 160), page_url: page_url.href, root_selector: bounded_text(input_data.root_selector || 'body', 1000), environment_name: input_data.environment_name, milestone_title: bounded_text(input_data.milestone_title, 160), what_changed: bounded_text(input_data.what_changed), why_changed: bounded_text(input_data.why_changed), viewport_width, viewport_height, layer_rows: normalized_layers };
}

export function validate_history_notes(input_data) {
  if (!ID_PATTERN.test(input_data.milestone_id)) throw new Error('Invalid milestone ID.');
  if (!Number.isInteger(input_data.revision_number) || input_data.revision_number < 1) throw new Error('Load the current notes before saving.');
  const layer_notes = Object.fromEntries(Object.entries(input_data.layer_notes ?? {}).map(([layer_id, reason_text]) => {
    if (!ID_PATTERN.test(layer_id)) throw new Error('Invalid logical layer ID.');
    return [layer_id, bounded_text(reason_text)];
  }));
  const comparison_notes = Object.fromEntries(Object.entries(input_data.comparison_notes ?? {}).map(([before_id, reason_rows]) => {
    if (!ID_PATTERN.test(before_id)) throw new Error('Invalid comparison milestone ID.');
    return [before_id, Object.fromEntries(Object.entries(reason_rows).map(([layer_id, reason_text]) => {
      if (!ID_PATTERN.test(layer_id)) throw new Error('Invalid comparison layer ID.');
      return [layer_id, bounded_text(reason_text)];
    }))];
  }));
  return { milestone_id: input_data.milestone_id, revision_number: input_data.revision_number, milestone_title: bounded_text(input_data.milestone_title, 160), what_changed: bounded_text(input_data.what_changed), why_changed: bounded_text(input_data.why_changed), layer_notes, comparison_notes };
}

export async function read_history(project_root) {
  const history_root = resolve(project_root, HISTORY_DIRECTORY);
  const entry_names = await readdir(history_root).catch((read_error) => { if (read_error.code === 'ENOENT') return []; throw read_error; });
  const milestone_rows = [];
  const history_errors = [];
  for (const entry_name of entry_names.filter((entry_name) => ID_PATTERN.test(entry_name))) {
    try {
      const capture_data = JSON.parse(await readFile(resolve(history_root, entry_name, 'capture.json'), 'utf8'));
      const notes_data = JSON.parse(await readFile(resolve(history_root, entry_name, 'notes.json'), 'utf8'));
      milestone_rows.push({ ...capture_data, notes_data });
    } catch (read_error) { if (read_error.code !== 'ENOTDIR') history_errors.push(`${entry_name}: milestone could not be read.`); }
  }
  return { milestone_rows: milestone_rows.sort((first_row, second_row) => first_row.captured_at.localeCompare(second_row.captured_at)), history_errors };
}

export async function save_history_notes(project_root, input_data) {
  const notes_data = validate_history_notes(input_data);
  const notes_path = resolve(project_root, HISTORY_DIRECTORY, notes_data.milestone_id, 'notes.json');
  const previous_notes = JSON.parse(await readFile(notes_path, 'utf8'));
  if (previous_notes.revision_number !== notes_data.revision_number) throw new Error('Notes changed in another window. Reload before saving.');
  const next_notes = { ...notes_data, revision_number: previous_notes.revision_number + 1, edited_at: new Date().toISOString() };
  await writeFile(`${notes_path}.tmp`, `${JSON.stringify(next_notes, null, 2)}\n`);
  await rename(`${notes_path}.tmp`, notes_path);
  return next_notes;
}

function git_value(project_root, argument_list) {
  try { return execFileSync('git', argument_list, { cwd: project_root, encoding: 'utf8', timeout: 5000, stdio: ['ignore', 'pipe', 'pipe'] }).trim(); } catch { return ''; }
}

export async function capture_history({ project_root, input_data }) {
  const capture_case = validate_history_capture(input_data);
  const milestone_id = `milestone-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const history_root = resolve(project_root, HISTORY_DIRECTORY);
  const temporary_path = resolve(history_root, `.${milestone_id}`);
  await mkdir(temporary_path, { recursive: true });
  let browser_instance;
  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(project_root, '.cache/ms-playwright');
    const { chromium } = await import('playwright');
    browser_instance = await chromium.launch({ headless: true });
    const browser_context = await browser_instance.newContext({ viewport: { width: capture_case.viewport_width, height: capture_case.viewport_height }, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', serviceWorkers: 'block' });
    const page_instance = await browser_context.newPage();
    page_instance.setDefaultTimeout(15000);
    await page_instance.addInitScript(() => document.addEventListener('play', (play_event) => { if (play_event.target instanceof HTMLMediaElement) play_event.target.muted = true; }, true));
    const page_response = await page_instance.goto(capture_case.page_url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    if (!page_response?.ok()) throw new Error(`Source returned HTTP ${page_response?.status()}.`);
    const source_region = page_instance.locator(capture_case.root_selector);
    if (await source_region.count() !== 1) throw new Error('The root selector must identify exactly one region.');
    await source_region.waitFor({ state: 'visible' });
    const full_page = capture_case.target_scope === 'page';
    if (full_page && capture_case.root_selector !== 'body') throw new Error('Page captures use body; use organism for a smaller root selector.');
    if (full_page) {
      const page_height = await page_instance.evaluate(() => document.documentElement.scrollHeight);
      if (page_height * capture_case.viewport_width > 24000000) throw new Error('Page exceeds 24 million pixels. Capture an organism or smaller viewport.');
      for (let scroll_offset = 0; scroll_offset < page_height; scroll_offset += capture_case.viewport_height) {
        await page_instance.evaluate((scroll_value) => { window.scrollTo({ top: scroll_value, behavior: 'instant' }); }, scroll_offset);
        await page_instance.waitForTimeout(60);
      }
      await page_instance.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); });
    } else await source_region.scrollIntoViewIfNeeded();
    await page_instance.waitForFunction(() => document.fonts.status === 'loaded');
    await source_region.evaluate(async (root_element) => { await Promise.allSettled([...root_element.querySelectorAll('img')].map((image_element) => image_element.decode())); });
    await page_instance.waitForFunction((root_element) => [root_element, ...root_element.querySelectorAll('[data-loading-stage]')].every((child_element) => !child_element.hasAttribute('data-loading-stage') || child_element.dataset.loadingStage === 'complete'), await source_region.elementHandle());
    await page_instance.mouse.move(-10, -10);
    const source_identity = await page_instance.evaluate(() => ({ rendered_version: document.querySelector('.version-watermark__number')?.textContent.trim() ?? globalThis.STORYBOOK_BUILD_INFO?.project_version ?? '', commit_url: document.querySelector('.version-git-hash')?.href ?? globalThis.STORYBOOK_BUILD_INFO?.commit_url ?? '', commit_hash: document.querySelector('.version-git-hash')?.textContent.trim() ?? globalThis.STORYBOOK_BUILD_INFO?.commit_hash ?? '', page_title: document.title }));
    const release_response = await browser_context.request.get(new URL('/themes/custom/jurenites_theme/release-info.json', capture_case.page_url).href, { timeout: 10000 }).catch(() => null);
    const release_data = release_response?.ok() ? await release_response.json().catch(() => ({})) : {};
    const region_bounds = full_page ? { x: 0, y: 0 } : await source_region.boundingBox();
    const captured_layers = [];
    const capture_warnings = [];
    for (const layer_row of capture_case.layer_rows) {
      const layer_locator = source_region.locator(layer_row.selector_text);
      if (await layer_locator.count() !== 1 || !await layer_locator.isVisible()) { capture_warnings.push(`${layer_row.layer_label}: selector missing, hidden, or ambiguous; whole-image fade will cover it.`); continue; }
      const layer_bounds = await layer_locator.boundingBox();
      const shape_data = await layer_locator.evaluate((layer_element) => { const layer_style = getComputedStyle(layer_element); return { corner_radius: layer_style.borderTopLeftRadius, role_name: layer_element.getAttribute('role') || layer_element.tagName.toLowerCase(), text_content: (layer_element.innerText ?? '').trim().slice(0, 300) }; });
      captured_layers.push({ ...layer_row, ...shape_data, bounds_data: { x: Math.round(layer_bounds.x - region_bounds.x), y: Math.round(layer_bounds.y - region_bounds.y), width: Math.ceil(layer_bounds.width), height: Math.ceil(layer_bounds.height) } });
    }
    const full_buffer = full_page ? await page_instance.screenshot({ fullPage: true, animations: 'disabled' }) : await source_region.screenshot({ animations: 'disabled' });
    const full_image = PNG.sync.read(full_buffer);
    if (full_image.width * full_image.height > 24000000) throw new Error('Capture exceeds 24 million pixels.');
    await writeFile(resolve(temporary_path, 'full.png'), full_buffer);
    const intersection_area = (first_bounds, second_bounds) => Math.max(0, Math.min(first_bounds.x + first_bounds.width, second_bounds.x + second_bounds.width) - Math.max(first_bounds.x, second_bounds.x)) * Math.max(0, Math.min(first_bounds.y + first_bounds.height, second_bounds.y + second_bounds.height) - Math.max(first_bounds.y, second_bounds.y));
    const motion_layers = captured_layers.filter((layer_row) => {
      const layer_bounds = layer_row.bounds_data;
      const within_capture = layer_bounds.width > 0 && layer_bounds.height > 0 && layer_bounds.x >= 0 && layer_bounds.y >= 0 && layer_bounds.x + layer_bounds.width <= full_image.width && layer_bounds.y + layer_bounds.height <= full_image.height;
      // Only disjoint leaves animate as raster patches. Parent shapes remain inspectable.
      const has_overlap = captured_layers.some((other_row) => other_row !== layer_row && intersection_area(layer_bounds, other_row.bounds_data) > 0 && (intersection_area(layer_bounds, other_row.bounds_data) !== layer_bounds.width * layer_bounds.height || JSON.stringify(layer_bounds) === JSON.stringify(other_row.bounds_data)));
      layer_row.motion_enabled = within_capture && !has_overlap;
      return layer_row.motion_enabled;
    });
    for (const layer_row of motion_layers) await source_region.locator(layer_row.selector_text).evaluate((layer_element) => layer_element.setAttribute('data-history-capture-hidden', ''));
    const hide_style = motion_layers.length ? await page_instance.addStyleTag({ content: '[data-history-capture-hidden] { visibility: hidden !important; }' }) : null;
    const base_buffer = full_page ? await page_instance.screenshot({ fullPage: true, animations: 'disabled' }) : await source_region.screenshot({ animations: 'disabled' });
    await hide_style?.evaluate((style_element) => style_element.remove());
    await writeFile(resolve(temporary_path, 'base.png'), base_buffer);
    const base_image = PNG.sync.read(base_buffer);
    for (const layer_row of motion_layers) {
      const layer_bounds = layer_row.bounds_data;
      const layer_image = new PNG({ width: layer_bounds.width, height: layer_bounds.height });
      PNG.bitblt(full_image, layer_image, layer_bounds.x, layer_bounds.y, layer_bounds.width, layer_bounds.height, 0, 0);
      // Keep only pixels changed by hiding this leaf. Background pixels must not
      // travel with text or controls and leave rectangular trails mid-transition.
      for (let pixel_y = 0; pixel_y < layer_bounds.height; pixel_y += 1) {
        for (let pixel_x = 0; pixel_x < layer_bounds.width; pixel_x += 1) {
          const patch_offset = (pixel_y * layer_bounds.width + pixel_x) * 4;
          const base_offset = ((layer_bounds.y + pixel_y) * base_image.width + layer_bounds.x + pixel_x) * 4;
          if ([0, 1, 2].every((channel_index) => Math.abs(layer_image.data[patch_offset + channel_index] - base_image.data[base_offset + channel_index]) <= 2)) layer_image.data[patch_offset + 3] = 0;
        }
      }
      await writeFile(resolve(temporary_path, `${layer_row.layer_id}.png`), PNG.sync.write(layer_image));
      layer_row.image_url = `/history-assets/${milestone_id}/${layer_row.layer_id}.png`;
    }

    const local_source = ['jurenites.local', 'localhost', '127.0.0.1', 'test.jurenites.local'].includes(new URL(capture_case.page_url).hostname);
    const observed_hash = /^[a-f0-9]{7,40}$/i.test(source_identity.commit_hash) ? source_identity.commit_hash : '';
    const capture_data = { schema_version: 1, milestone_id, target_id: capture_case.target_id, target_scope: capture_case.target_scope, target_label: capture_case.target_label, captured_at: new Date().toISOString(), page_url: page_instance.url(), root_selector: capture_case.root_selector, environment_name: capture_case.environment_name, environment_evidence: 'Source environment selected by the reviewer; this capture does not establish deployment time.', version_number: source_identity.rendered_version || release_data.project_version || 'unrecorded', source_identity, release_version: release_data.project_version ?? '', commit_hash: observed_hash, commit_url: /^https:\/\/github\.com\/jurenites\/blog\/commit\/[a-f0-9]{7,40}$/i.test(source_identity.commit_url) ? source_identity.commit_url : '', commit_subject: observed_hash ? git_value(project_root, ['show', '-s', '--format=%s', observed_hash]) : '', branch_name: local_source ? git_value(project_root, ['branch', '--show-current']) : '', branch_evidence: local_source ? 'Local checkout at capture time; served build may differ.' : 'Remote branch was not exposed by the served build.', checkout_commit: local_source ? git_value(project_root, ['rev-parse', 'HEAD']) : '', working_changes: local_source ? Boolean(git_value(project_root, ['status', '--porcelain', '--untracked-files=no'])) : null, viewport_width: capture_case.viewport_width, viewport_height: capture_case.viewport_height, image_width: full_image.width, image_height: full_image.height, browser_version: browser_instance.version(), device_scale: 1, locale_name: 'en-US', timezone_name: 'UTC', image_sha256: createHash('sha256').update(full_buffer).digest('hex'), full_image_url: `/history-assets/${milestone_id}/full.png`, base_image_url: `/history-assets/${milestone_id}/base.png`, layer_rows: captured_layers, capture_warnings };
    const notes_data = { milestone_id, revision_number: 1, milestone_title: capture_case.milestone_title || `${capture_case.target_label} · ${capture_case.environment_name}`, what_changed: capture_case.what_changed, why_changed: capture_case.why_changed, layer_notes: Object.fromEntries(captured_layers.map((layer_row) => [layer_row.layer_id, layer_row.reason_text])), edited_at: new Date().toISOString() };
    await writeFile(resolve(temporary_path, 'capture.json'), `${JSON.stringify(capture_data, null, 2)}\n`);
    await writeFile(resolve(temporary_path, 'notes.json'), `${JSON.stringify(notes_data, null, 2)}\n`);
    await rename(temporary_path, resolve(history_root, milestone_id));
    return { ...capture_data, notes_data };
  } catch (capture_error) { await rm(temporary_path, { recursive: true, force: true }); throw capture_error; }
  finally { await browser_instance?.close(); }
}
