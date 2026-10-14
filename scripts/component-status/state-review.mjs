import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { current_build_fingerprint, validate_report } from './report.mjs';
import { compare_images } from './images.mjs';
import { read_component_appearance, compare_appearance, figma_appearance } from './appearance.mjs';

const STATE_LABELS = { default: 'Default', hover: 'Hover', focus: 'Keyboard focus', active: 'Pressed', checked: 'Checked' };
const result_status = (result_rows) => result_rows.some((result_row) => result_row.status === 'failed') ? 'failed' : result_rows.length && result_rows.every((result_row) => result_row.status === 'passed') ? 'passed' : 'blocked';

export async function run_state_review({ project_root, report_directory, status_origin, review_case, png_data, remove_baseline }) {
  const current_fingerprint = await current_build_fingerprint(project_root);
  const run_id = `states-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const artifact_directory = resolve(report_directory, 'artifacts', run_id);
  await mkdir(artifact_directory, { recursive: true });
  const saved_cases = await readFile(resolve(report_directory, 'review-cases.json'), 'utf8').then(JSON.parse).catch((read_error) => { if (read_error.code === 'ENOENT') return {}; throw read_error; });
  const previous_case = saved_cases[review_case.component_id];
  if (!remove_baseline && previous_case?.figma_url === review_case.figma_url) review_case.figma_baseline = previous_case.figma_baseline;
  if (png_data) {
    const { decode_baseline } = await import('./review.mjs');
    const baseline_buffer = decode_baseline(png_data);
    const image_hash = createHash('sha256').update(baseline_buffer).digest('hex');
    await mkdir(resolve(report_directory, 'artifacts/baselines'), { recursive: true });
    review_case.figma_baseline = `artifacts/baselines/${image_hash}.png`;
    await writeFile(resolve(report_directory, review_case.figma_baseline), baseline_buffer);
  }
  saved_cases[review_case.component_id] = review_case;
  await writeFile(resolve(report_directory, 'review-cases.json.tmp'), JSON.stringify(saved_cases, null, 2));
  await rename(resolve(report_directory, 'review-cases.json.tmp'), resolve(report_directory, 'review-cases.json'));
  const config_data = JSON.parse(await readFile(resolve(project_root, 'config/component-status.json'), 'utf8'));
  const component_config = config_data.components[review_case.component_id] ?? {};
  const appearance_data = JSON.parse(await readFile(resolve(project_root, 'tests/visual-baselines/manual-atoms/appearance.json'), 'utf8'));
  const capture_states = review_case.capture_states ?? ['default'];
  const website_examples = review_case.website_examples?.length ? review_case.website_examples : review_case.drupal_url ? [{ example_id: 'website', example_label: 'Website', page_url: review_case.drupal_url, component_selector: review_case.drupal_selector }] : [];
  const capture_results = [];
  const visual_states = [];
  const interaction_results = [];
  const check_results = [];
  const report_data = { schema_version: 1, source_name: 'manual-review', checked_at: new Date().toISOString(), run_id, source_fingerprint: current_fingerprint, components: [{ component_id: review_case.component_id, checks: check_results }] };
  const artifact_item = (artifact_path, artifact_label) => ({ artifact_path, artifact_label });
  let browser_instance;
  try {
    process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve(project_root, '.cache/ms-playwright');
    const { chromium } = await import('playwright');
    browser_instance = await chromium.launch({ headless: true });
    const source_rows = [{ source_id: 'storybook', page_url: `${status_origin}${review_case.story_url}`, component_selector: review_case.story_selector, interaction_selector: review_case.story_interaction_selector, reveal_selector: review_case.story_hover_selector }, ...website_examples.map((example_row) => ({ ...example_row, source_id: example_row.example_id }))];
    for (const source_row of source_rows) {
      const browser_context = await browser_instance.newContext({ viewport: { width: review_case.viewport_width, height: review_case.viewport_height }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', colorScheme: 'dark', reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page_instance = await browser_context.newPage();
      page_instance.setDefaultTimeout(12000);
      const browser_errors = [];
      page_instance.on('pageerror', (page_error) => browser_errors.push(page_error.message));
      await page_instance.addInitScript(() => document.addEventListener('play', (play_event) => { if (play_event.target instanceof HTMLMediaElement) play_event.target.muted = true; }, true));
      try {
        const page_response = await page_instance.goto(source_row.page_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!page_response?.ok()) throw new Error(`HTTP ${page_response?.status()}`);
        if (source_row.reveal_selector) await page_instance.locator(source_row.reveal_selector).hover();
        const component_locator = page_instance.locator(source_row.component_selector);
        await component_locator.waitFor({ state: 'visible' });
        if (await component_locator.count() !== 1) throw new Error('Selector must match exactly one component.');
        await component_locator.scrollIntoViewIfNeeded();
        await page_instance.evaluate(() => document.fonts.ready);
        await component_locator.evaluate(async (component_element) => { await Promise.all([...component_element.querySelectorAll('img')].map((image_element) => image_element.decode())); });
        await page_instance.waitForFunction((component_element) => [component_element, ...component_element.querySelectorAll('[data-loading-stage]')].every((child_element) => !child_element.hasAttribute('data-loading-stage') || child_element.dataset.loadingStage === 'complete'), await component_locator.elementHandle());
        const interactive_selector = 'a[href],button,input,select,textarea,[tabindex]';
        const control_locator = source_row.interaction_selector ? page_instance.locator(source_row.interaction_selector) : await component_locator.evaluate((component_element, selector_value) => component_element.matches(selector_value), interactive_selector) ? component_locator : component_locator.locator(interactive_selector).first();
        let default_capture;
        for (const state_key of capture_states) {
          const state_result = { viewport_width: review_case.viewport_width, viewport_height: review_case.viewport_height, device_scale: 1, browser_version: browser_instance.version(), locale_name: 'en-US', timezone_name: 'UTC', source_id: source_row.source_id, state_key, page_url: page_instance.url(), component_selector: source_row.component_selector, status: 'blocked' };
          try {
            await page_instance.mouse.move(-10, -10);
            await page_instance.mouse.up();
            await page_instance.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
            if (source_row.reveal_selector) await page_instance.locator(source_row.reveal_selector).hover();
            if (state_key !== 'default') {
              if (await control_locator.count() !== 1 || !await control_locator.isEnabled()) throw new Error('No enabled interactive target for this state.');
              if (state_key === 'hover' || state_key === 'active') await control_locator.hover();
              if (state_key === 'focus') { await page_instance.keyboard.press('Tab'); await control_locator.focus(); }
              if (state_key === 'active') await page_instance.mouse.down();
              if (state_key === 'checked') {
                if (!await control_locator.evaluate((control_element) => control_element.matches('input[type="checkbox"],input[type="radio"]'))) throw new Error('Checked capture requires a native checkbox or radio control.');
                await control_locator.check();
              }
            }
            await component_locator.evaluate(async (component_element) => {
              const finite_animations = component_element.getAnimations({ subtree: true }).filter((animation_item) => animation_item.effect?.getComputedTiming().iterations !== Infinity);
              await Promise.race([Promise.allSettled(finite_animations.map((animation_item) => animation_item.finished)), new Promise((resolve_wait) => { setTimeout(resolve_wait, 2000); })]);
            });
            const appearance_values = await component_locator.evaluate(read_component_appearance);
            const component_bounds = await component_locator.boundingBox();
            if (component_bounds.width * component_bounds.height > 16000000) throw new Error('Component capture exceeds 16 million pixels.');
            const image_buffer = await page_instance.screenshot({ clip: { x: Math.round(component_bounds.x), y: Math.round(component_bounds.y), width: Math.ceil(component_bounds.width), height: Math.ceil(component_bounds.height) }, animations: 'disabled' });
            const image_path = `artifacts/${run_id}/${source_row.source_id}-${state_key}.png`;
            await writeFile(resolve(report_directory, image_path), image_buffer);
            Object.assign(state_result, { status: browser_errors.length ? 'failed' : 'passed', message: browser_errors.length ? browser_errors.join('; ') : 'Captured at one image pixel per CSS pixel.', image_path, image_buffer, appearance_values });
            if (state_key === 'default') default_capture = state_result;
            else {
              const active_state = await control_locator.evaluate((control_element, selected_state) => selected_state === 'focus' ? control_element.matches(':focus-visible') : selected_state === 'checked' ? control_element.matches(':checked') : control_element.matches(selected_state === 'active' ? ':active' : ':hover'), state_key);
              const state_pixels = default_capture ? compare_images(default_capture.image_buffer, image_buffer) : undefined;
              const visible_feedback = state_pixels?.status === 'failed' || (default_capture && compare_appearance(default_capture.appearance_values, appearance_values).status === 'failed');
              const feedback_required = ['hover', 'focus'].includes(state_key);
              interaction_results.push({ source_id: source_row.source_id, state_key, status: !active_state ? 'failed' : feedback_required && !default_capture ? 'blocked' : feedback_required && !visible_feedback ? 'failed' : 'passed', message: !active_state ? 'Requested native state was not reached.' : feedback_required && !visible_feedback ? 'Native state reached, but the captured region shows no visible feedback.' : feedback_required ? 'Native state reached; visible feedback recorded.' : 'Native state reached. Link/form activation is not tested.', visible_feedback, active_state });
            }
          } catch (state_error) { state_result.message = state_error.message; interaction_results.push({ source_id: source_row.source_id, state_key, status: 'blocked', message: state_error.message }); }
          finally { await page_instance.mouse.move(-10, -10).catch(() => {}); await page_instance.mouse.up().catch(() => {}); }
          capture_results.push(state_result);
        }
      } catch (capture_error) { for (const state_key of capture_states) capture_results.push({ source_id: source_row.source_id, state_key, status: 'blocked', message: capture_error.message }); }
      finally { await browser_context.close(); }
    }
    const reference_rows = component_config.figma_states ?? { default: { figma_url: component_config.figma_url, node_id: component_config.figma_node_id } };
    for (const example_row of website_examples.length ? website_examples : [{ example_id: 'none', example_label: 'Storybook only' }]) {
      for (const state_key of capture_states) {
        const story_capture = capture_results.find((capture_row) => capture_row.source_id === 'storybook' && capture_row.state_key === state_key);
        const website_capture = capture_results.find((capture_row) => capture_row.source_id === example_row.example_id && capture_row.state_key === state_key);
        const figma_reference = reference_rows[state_key];
        const figma_node = appearance_data.node_properties.find((node_row) => node_row.node_id === figma_reference?.node_id);
        let figma_path = state_key === 'default' ? review_case.figma_baseline : undefined;
        if (state_key !== 'default' && figma_reference?.reference_path) {
          const baseline_buffer = await readFile(resolve(project_root, figma_reference.reference_path));
          figma_path = `artifacts/${run_id}/figma-${state_key}.png`;
          await writeFile(resolve(report_directory, figma_path), baseline_buffer);
        }
        const state_comparisons = [];
        const expected_path = state_key === 'default' ? component_config.figma_reference_path : figma_reference?.reference_path;
        const trusted_figma = figma_node && component_config.figma_url === review_case.figma_url && figma_path && expected_path && (await readFile(resolve(project_root, expected_path))).equals(await readFile(resolve(report_directory, figma_path)));
        for (const [pair_name, reference_capture, actual_capture] of [['implementation', story_capture, website_capture], ['figma-storybook', undefined, story_capture], ['figma-drupal', undefined, website_capture]]) {
          let pair_result;
          if (!actual_capture?.appearance_values || (pair_name === 'implementation' && !reference_capture?.appearance_values)) pair_result = { status: 'blocked', message: 'Capture or website mapping is missing.' };
          else if (review_case.comparison_mode === 'component') {
            if (pair_name !== 'implementation' && !trusted_figma) pair_result = { status: 'missing', message: 'No verified Figma appearance reference for this state. Default-state pixels are not reused.' };
            else pair_result = compare_appearance(pair_name === 'implementation' ? reference_capture.appearance_values : figma_appearance(figma_node), actual_capture.appearance_values);
          } else {
            const reference_buffer = pair_name === 'implementation' ? reference_capture?.image_buffer : figma_path ? await readFile(resolve(report_directory, figma_path)) : undefined;
            pair_result = reference_buffer ? compare_images(reference_buffer, actual_capture.image_buffer) : { status: 'missing', message: 'No Figma image for this state.' };
            delete pair_result.difference_buffer;
            if (!review_case.inputs_matched && pair_result.status !== 'missing') { pair_result.status = 'blocked'; pair_result.message = `Exploratory pixel comparison. ${pair_result.message}`; }
          }
          state_comparisons.push({ pair_name, ...pair_result });
        }
        visual_states.push({ state_key, state_label: `${example_row.example_label} · ${STATE_LABELS[state_key]}`, example_id: example_row.example_id, example_label: example_row.example_label, figma_url: figma_reference?.figma_url ?? '', website_url: example_row.page_url ?? '', comparison_mode: review_case.comparison_mode, images: { figma: figma_path ?? '', storybook: story_capture?.image_path ?? '', drupal: website_capture?.image_path ?? '' }, comparisons: state_comparisons, content: { figma: figma_node ? figma_appearance(figma_node).text_content : '', storybook: story_capture?.appearance_values?.text_content ?? '', drupal: website_capture?.appearance_values?.text_content ?? '' }, interactions: interaction_results.filter((interaction_row) => interaction_row.state_key === state_key && ['storybook', example_row.example_id].includes(interaction_row.source_id)) });
      }
    }
    for (const [check_key, check_label] of [['storybook', 'Storybook rendering'], ['drupal', 'Website examples']]) {
      const selected_captures = capture_results.filter((capture_row) => check_key === 'storybook' ? capture_row.source_id === 'storybook' : capture_row.source_id !== 'storybook');
      check_results.push({ check_key, check_label, status: selected_captures.length ? result_status(selected_captures) : 'not_checked', message: `${selected_captures.filter((capture_row) => capture_row.status === 'passed').length} of ${selected_captures.length} state captures rendered.`, details: selected_captures.map(({ image_buffer: _image_buffer, ...capture_row }) => capture_row), artifacts: selected_captures.filter((capture_row) => capture_row.image_path).map((capture_row) => artifact_item(capture_row.image_path, `${capture_row.source_id} · ${STATE_LABELS[capture_row.state_key]}`)) });
    }
    for (const [check_key, check_label, pair_names] of [['integration', 'Storybook / website appearance', ['implementation']], ['figma', 'Figma appearance', ['figma-storybook', ...(website_examples.length ? ['figma-drupal'] : [])]]]) {
      const selected_pairs = visual_states.flatMap((state_row) => state_row.comparisons.filter((pair_row) => pair_names.includes(pair_row.pair_name)));
      check_results.push({ check_key, check_label, status: check_key === 'integration' && !website_examples.length ? 'not_checked' : result_status(selected_pairs), message: `${selected_pairs.filter((pair_row) => pair_row.status === 'passed').length} passed · ${selected_pairs.filter((pair_row) => pair_row.status === 'failed').length} differ · ${selected_pairs.filter((pair_row) => ['missing', 'blocked'].includes(pair_row.status)).length} incomplete. ${review_case.comparison_mode === 'component' ? 'Copy and content-driven widths do not affect appearance results.' : 'Exact pixels require matching content.'}`, details: check_key === 'integration' ? { visual_states } : selected_pairs, artifacts: [] });
    }
    check_results.push({ check_key: 'interaction', check_label: 'Interaction feedback', status: interaction_results.length ? result_status(interaction_results) : 'not_checked', message: interaction_results.length ? `${interaction_results.filter((result_row) => result_row.status === 'passed').length} of ${interaction_results.length} native interaction checks passed.` : 'Only the default state was requested.', details: interaction_results, artifacts: [] });
  } catch (run_error) {
    check_results.length = 0;
    for (const [check_key, check_label] of [['storybook', 'Storybook rendering'], ['drupal', 'Website examples'], ['integration', 'Implementation comparison'], ['figma', 'Figma appearance']]) check_results.push({ check_key, check_label, status: 'blocked', message: run_error.message });
  } finally { await browser_instance?.close(); }
  report_data.checked_at = new Date().toISOString();
  validate_report(report_data);
  const report_path = resolve(report_directory, `report-review-${review_case.component_id}.json`);
  await writeFile(`${report_path}.tmp`, JSON.stringify(report_data, null, 2));
  await rename(`${report_path}.tmp`, report_path);
  return report_data;
}
