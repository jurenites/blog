import { escape_html } from '../stories/template.js';
import { enable_custom_select } from '../slice/src/js/script.js';
import { initialize_file_inputs } from '../slice/src/js/file-input.js';
import { file_input_markup } from '../stories/molecules/file-input/file-input.markup.js';
import { checkbox_markup } from '../stories/atoms/checkbox/checkbox.markup.js';

function image_reference(component_row, check_key, image_label) {
  const check_result = component_row.checks.find((check_item) => check_item.check_key === check_key);
  return check_result?.artifacts?.find((artifact_item) => artifact_item.artifact_label === image_label)?.artifact_path ?? '';
}

function recorded_states(component_row) {
  return component_row.checks.find((check_item) => check_item.check_key === 'integration')?.details?.visual_states ?? [];
}

export function review_panel_markup(component_row, case_config, saved_case) {
  const review_case = saved_case ?? {};
  const story_url = review_case.story_url ?? case_config.story_url ?? `/storybook/iframe.html?id=${encodeURIComponent(component_row.story_ids[0])}&viewMode=story`;
  const field_value = (field_name, fallback_value = '') => escape_html(String(review_case[field_name] ?? case_config[field_name] ?? fallback_value));
  const visual_states = recorded_states(component_row);
  const selected_images = visual_states[0]?.images ?? {};
  const official_suite = case_config.review_suite === 'language-picker';
  const website_image = selected_images.drupal ?? image_reference(component_row, 'drupal', 'Actual website');
  const story_image = selected_images.storybook ?? image_reference(component_row, 'storybook', 'Storybook');
  const figma_image = selected_images.figma ?? review_case.figma_baseline ?? '';
  const check_result = component_row.checks.find((check_item) => check_item.check_key === 'integration');
  const source_link = (link_value) => {
    if (!link_value) return '';
    try {
      const parsed_url = new URL(link_value, window.location.origin);
      return ['http:', 'https:'].includes(parsed_url.protocol) ? escape_html(parsed_url.href) : '';
    } catch { return ''; }
  };
  const figma_url = source_link(visual_states[0]?.figma_url ?? review_case.figma_url ?? case_config.figma_url);
  const website_url = source_link(review_case.drupal_url ?? case_config.drupal_url);
  const figure_markup = (figure_title, artifact_path, missing_text, source_name, source_url) => `<figure class="visual-review__figure" data-image-source="${source_name}"><figcaption>${source_url ? `<a ${source_name === 'figma' ? 'id="review-state-source"' : ''} href="${source_url}" target="_blank" rel="noopener">${figure_title}</a>` : figure_title}</figcaption>${artifact_path ? `<a class="visual-review__capture" href="/${escape_html(artifact_path)}" target="_blank" rel="noopener"><img class="visual-review__image" src="/${escape_html(artifact_path)}" alt="${figure_title}"></a>` : `<p class="visual-review__empty">${missing_text}</p>`}</figure>`;
  const capture_controls = official_suite ? `<form id="visual-review-form" data-review-suite="language-picker"><div class="visual-review__actions"><button class="status-dashboard__refresh" type="submit">Run language-picker tests</button><span id="visual-review-message" role="status"></span></div></form>` : `<details class="visual-review__setup" ${!story_image && !website_image ? 'open' : ''}><summary>Source mapping &amp; capture settings</summary><p>Choose the website page and component selectors. Match content, language and state across the references.</p>
    <form id="visual-review-form" class="visual-review__form">
      <label class="visual-review__field">Website URL or path<input class="text-input__control" name="drupal_url" required value="${field_value('drupal_url')}" placeholder="/portfolio/4pixel"></label>
      <label class="visual-review__field">Website component selector<input class="text-input__control" name="drupal_selector" required value="${field_value('drupal_selector')}" placeholder=".font-preview--4pixel"></label>
      <label class="visual-review__field">Storybook URL / args<input class="text-input__control" name="story_url" required value="${escape_html(story_url)}"></label>
      <label class="visual-review__field">Storybook component selector<input class="text-input__control" name="story_selector" required value="${field_value('story_selector')}" placeholder=".font-preview--4pixel"></label>
      <div class="visual-review__field"><label class="input-text__label" for="review-viewport-width">Viewport width</label><select class="select-input__native" id="review-viewport-width" name="viewport_width" data-jurenites-select>${[360, 768, 1280, 1920].map((pixel_width) => `<option value="${pixel_width}" ${pixel_width === Number(review_case.viewport_width ?? case_config.viewport_widths?.[0] ?? 1280) ? 'selected' : ''}>${pixel_width}px</option>`).join('')}</select></div>
      <label class="visual-review__field">Viewport height<input class="text-input__control" name="viewport_height" type="number" min="320" max="2560" step="1" required value="${field_value('viewport_height', 900)}"></label>
      <label class="visual-review__field">Figma frame link (optional)<input class="text-input__control" name="figma_url" type="url" value="${field_value('figma_url')}" placeholder="https://www.figma.com/design/…"></label>
      ${file_input_markup({ field_id: 'review-figma-png', field_name: 'figma_png', field_label: 'Figma reference PNG (optional, 1×)', accepted_types: 'image/png', drop_label: 'Drop a PNG here', hint_text: figma_image ? 'Saved reference available. A new file replaces it.' : 'Missing is fine: website / Storybook comparison works without Figma.' })}
      ${figma_image ? `<div class="visual-review__checkbox">${checkbox_markup({ field_id: 'review-remove-baseline', field_name: 'remove_baseline', field_value: 'on', field_label: 'Remove saved Figma reference' })}</div>` : ''}
      <div class="visual-review__checkbox">${checkbox_markup({ field_id: 'review-inputs-matched', field_name: 'inputs_matched', field_value: 'on', field_label: 'I checked that content, language, and state match across the selected references.', checkbox_state: review_case.inputs_matched ? 'filled' : 'empty' })}</div>
      <div class="visual-review__actions"><button class="status-dashboard__refresh" type="submit">Capture and compare</button><span id="visual-review-message" role="status">Captures use a fresh browser session. Unchecked content matching produces an exploratory diff.</span></div>
    </form>
    </details>`;
  return `<section class="visual-review" aria-label="Visual comparison">
    <h3>${official_suite ? 'Test case: Language picker' : 'Component comparison'}</h3>
    ${official_suite ? '<p class="status-dashboard__meta">3 states · 2 viewports · Picker only; full-header parity is not tested.</p>' + capture_controls : ''}
    ${visual_states.length ? `<label class="visual-review__field visual-review__state">State &amp; viewport<select id="review-state">${visual_states.map((state_item, state_index) => `<option value="${state_index}">${escape_html(state_item.state_label)}</option>`).join('')}</select></label>` : ''}
    <p class="status-dashboard__meta">100% size · <span id="capture-layout-label">Automatic layout</span>${check_result?.checked_at ? ` · ${escape_html(new Date(check_result.checked_at).toLocaleString())}${check_result.is_stale ? ' · Stale: capture again' : ''}` : ' · Not captured'}</p>
    <div class="visual-review__three-up">${figure_markup('Figma', figma_image, figma_url ? 'Frame linked. PNG missing.' : 'Missing reference.', 'figma', figma_url)}${figure_markup('Storybook', story_image, 'Linked. Not captured.', 'storybook', source_link(story_url))}${figure_markup('Website', website_image, website_url ? 'Page linked. Not captured.' : 'Missing page mapping.', 'drupal', website_url)}</div>
    ${visual_states.length ? '<p id="review-state-results" class="status-dashboard__meta" role="status"></p>' : ''}
    ${!official_suite ? capture_controls : ''}
    ${visual_states.length || (story_image && website_image) ? `<details class="visual-review__comparison"><summary>Overlay and differences</summary><div class="visual-review__actions"><label class="visual-review__field">Compare<select id="comparison-pair"><option value="implementation">Storybook / website</option>${figma_image ? '<option value="figma-story">Figma / Storybook</option><option value="figma-web">Figma / website</option>' : ''}</select></label><label class="visual-review__field">View<select id="comparison-mode"><option value="overlay">Overlay</option><option value="wipe">Wipe</option><option value="difference">Pixel difference</option></select></label><label class="visual-review__field">Layer balance<input id="comparison-balance" type="range" min="0" max="100" value="50"></label><button id="comparison-toggle" class="status-dashboard__refresh" type="button">Toggle layer</button></div><p id="comparison-message" role="status"></p><div class="visual-review__canvas-scroll"><canvas id="comparison-canvas" class="visual-review__canvas" aria-label="Aligned visual comparison"></canvas></div></details>` : ''}
    <details class="visual-review__live"><summary>How captures work</summary><p>Playwright loads the complete Storybook and website pages with their CSS and content, applies the selected state, then crops the component at one image pixel per CSS pixel. The HTML stays in its original layout. Figma uses a pinned 1× PNG export. Missing mappings are not synchronized automatically.</p></details>
    <details class="visual-review__live"><summary>Live HTML views</summary><p>Storybook is interactive below. Open Live Figma reference to inspect the Figma frame, or Open real website to view the full page. Each live view has its own viewport and zoom; use the captures above for a 100% comparison.</p><nav class="status-dashboard__source-links"><a id="live-story-link" href="${escape_html(story_url)}" target="_blank" rel="noopener">Open Storybook ↗</a><a id="live-website-link" href="${field_value('drupal_url', 'http://jurenites.local')}" target="_blank" rel="noopener">Open real website ↗</a></nav><p>The live preview uses the URL above; edits to the capture form apply on the next capture. Its viewport width matches the selected preset; it scrolls rather than shrinking the component.</p><div class="visual-review__frame-scroll"><iframe class="visual-review__frame visual-review__frame--${review_case.viewport_width ?? case_config.viewport_widths?.[0] ?? 1280}" src="${escape_html(story_url)}" title="${escape_html(component_row.component_name)} live Storybook" loading="lazy"></iframe></div></details>
  </section>`;
}

export function connect_review_panel({ component_row, saved_case, review_token, refresh_results, set_busy }) {
  const review_form = document.querySelector('#visual-review-form');
  initialize_file_inputs(review_form);
  const viewport_select = review_form.querySelector('[name="viewport_width"]');
  if (viewport_select) enable_custom_select(viewport_select);
  review_form.addEventListener('submit', async (submit_event) => {
    submit_event.preventDefault();
    const message_element = document.querySelector('#visual-review-message');
    const submit_button = review_form.querySelector('button[type="submit"]');
    const form_data = new FormData(review_form);
    const input_data = Object.fromEntries(form_data.entries());
    input_data.component_id = component_row.component_id;
    input_data.inputs_matched = form_data.has('inputs_matched');
    input_data.remove_baseline = form_data.has('remove_baseline');
    delete input_data.figma_png;
    set_busy(true);
    submit_button.disabled = true;
    message_element.textContent = 'Loading the complete website and Storybook pages, waiting for fonts and images, then comparing…';
    try {
      const image_file = form_data.get('figma_png');
      if (image_file?.size) {
        if (image_file.size > 8 * 1024 * 1024) throw new Error('Choose a PNG under 8 MB.');
        input_data.png_data = await new Promise((resolve_file, reject_file) => {
          const file_reader = new FileReader();
          file_reader.onload = () => resolve_file(file_reader.result);
          file_reader.onerror = () => reject_file(new Error('Could not read the PNG.'));
          file_reader.readAsDataURL(image_file);
        });
      }
      const response_data = await fetch(review_form.dataset.reviewSuite === 'language-picker' ? '/api/language-picker' : '/api/review', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': review_token }, body: JSON.stringify(input_data) });
      const report_data = await response_data.json();
      if (!response_data.ok) throw new Error(report_data.error ?? 'Capture could not run.');
      set_busy(false);
      await refresh_results(true);
      const next_message = document.querySelector('#visual-review-message');
      if (next_message) next_message.textContent = 'Capture finished. Review the images and individual results below.';
    } catch (request_error) {
      message_element.textContent = request_error.message;
    } finally { set_busy(false); submit_button.disabled = false; }
  });
  const capture_grid = document.querySelector('.visual-review__three-up');
  function update_capture_layout() {
    const grid_style = getComputedStyle(capture_grid);
    const gap_width = parseFloat(grid_style.columnGap) || 0;
    const required_width = [...capture_grid.children].reduce((total_width, figure_element) => {
      const image_width = figure_element.querySelector('img')?.naturalWidth ?? 0;
      const figure_style = getComputedStyle(figure_element);
      const minimum_width = parseFloat(figure_style.minWidth);
      const border_width = parseFloat(figure_style.borderLeftWidth) * 2;
      return total_width + Math.max(minimum_width, image_width + border_width);
    }, gap_width * (capture_grid.children.length - 1));
    const stacked_layout = required_width > capture_grid.clientWidth;
    capture_grid.classList.toggle('visual-review__three-up--stacked', stacked_layout);
    document.querySelector('#capture-layout-label').textContent = stacked_layout ? 'Stacked rows' : 'Side by side';
  }
  const layout_observer = new ResizeObserver(update_capture_layout);
  layout_observer.observe(capture_grid);
  capture_grid.addEventListener('load', update_capture_layout, true);
  const disconnect_layout = () => layout_observer.disconnect();
  update_capture_layout();
  const canvas_element = document.querySelector('#comparison-canvas');
  if (!canvas_element) return disconnect_layout;
  const visual_states = recorded_states(component_row);
  const state_select = document.querySelector('#review-state');
  function selected_image_sources() {
    const selected_images = visual_states[Number(state_select?.value ?? 0)]?.images ?? { storybook: image_reference(component_row, 'storybook', 'Storybook'), drupal: image_reference(component_row, 'drupal', 'Actual website'), figma: saved_case?.figma_baseline };
    return { implementation: [selected_images.storybook, selected_images.drupal], 'figma-story': [selected_images.figma, selected_images.storybook], 'figma-web': [selected_images.figma, selected_images.drupal] };
  }
  let image_pair = [], render_sequence = 0;
  const pair_select = document.querySelector('#comparison-pair');
  const mode_select = document.querySelector('#comparison-mode');
  const balance_input = document.querySelector('#comparison-balance');
  const comparison_message = document.querySelector('#comparison-message');
  let pixel_compare;
  async function draw_comparison() {
    if (image_pair.length !== 2) return;
    const [first_image, second_image] = image_pair;
    canvas_element.width = Math.max(first_image.naturalWidth, second_image.naturalWidth);
    canvas_element.height = Math.max(first_image.naturalHeight, second_image.naturalHeight);
    const canvas_context = canvas_element.getContext('2d');
    canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
    const same_bounds = first_image.naturalWidth === second_image.naturalWidth && first_image.naturalHeight === second_image.naturalHeight;
    comparison_message.textContent = `${first_image.naturalWidth} × ${first_image.naturalHeight} vs ${second_image.naturalWidth} × ${second_image.naturalHeight}. ${same_bounds ? 'Aligned at 1:1 pixels.' : 'Different dimensions; images are aligned at the top left without resizing.'}`;
    canvas_context.drawImage(first_image, 0, 0);
    if (mode_select.value === 'difference') {
      if (!same_bounds) { comparison_message.textContent += ' Pixel difference requires equal bounds.'; return; }
      const reference_data = canvas_context.getImageData(0, 0, canvas_element.width, canvas_element.height);
      canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
      canvas_context.drawImage(second_image, 0, 0);
      const actual_data = canvas_context.getImageData(0, 0, canvas_element.width, canvas_element.height);
      const difference_data = canvas_context.createImageData(canvas_element.width, canvas_element.height);
      pixel_compare ??= (await import('pixelmatch')).default;
      const different_pixels = pixel_compare(reference_data.data, actual_data.data, difference_data.data, canvas_element.width, canvas_element.height, { threshold: 0, includeAA: true });
      canvas_context.putImageData(difference_data, 0, 0);
      comparison_message.textContent += ` ${different_pixels.toLocaleString()} pixels differ. This view does not approve a baseline.`;
    } else {
      canvas_context.save();
      if (mode_select.value === 'wipe') { canvas_context.beginPath(); canvas_context.rect(0, 0, canvas_element.width * Number(balance_input.value) / 100, canvas_element.height); canvas_context.clip(); }
      else canvas_context.globalAlpha = Number(balance_input.value) / 100;
      canvas_context.drawImage(second_image, 0, 0);
      canvas_context.restore();
    }
  }
  async function load_pair() {
    const request_sequence = ++render_sequence;
    image_pair = [];
    comparison_message.textContent = 'Loading comparison images…';
    canvas_element.getContext('2d').clearRect(0, 0, canvas_element.width, canvas_element.height);
    try {
      const loaded_pair = await Promise.all(selected_image_sources()[pair_select.value].map(async (image_path) => {
        if (!image_path) throw new Error('Capture missing.');
        const image_element = new Image();
        image_element.src = `/${image_path}`;
        await image_element.decode();
        return image_element;
      }));
      if (request_sequence !== render_sequence) return;
      image_pair = loaded_pair;
      await draw_comparison();
    } catch { image_pair = []; canvas_element.getContext('2d').clearRect(0, 0, canvas_element.width, canvas_element.height); comparison_message.textContent = 'Comparison images could not be loaded; check whether this state was captured.'; }
  }
  function select_recorded_state() {
    const selected_state = visual_states[Number(state_select?.value ?? 0)];
    if (!selected_state) return;
    for (const source_name of ['figma', 'storybook', 'drupal']) {
      const figure_element = document.querySelector(`[data-image-source="${source_name}"]`);
      figure_element.querySelector('.visual-review__capture')?.remove();
      figure_element.querySelector('.visual-review__empty')?.remove();
      const image_path = selected_state.images[source_name];
      if (image_path) {
        const image_link = document.createElement('a');
        image_link.className = 'visual-review__capture';
        image_link.href = `/${image_path}`;
        image_link.target = '_blank';
        image_link.rel = 'noopener';
        const image_element = document.createElement('img');
        image_element.className = 'visual-review__image';
        image_element.src = `/${image_path}`;
        image_element.alt = `${selected_state.state_label} · ${source_name}`;
        image_link.append(image_element);
        figure_element.append(image_link);
      } else {
        const missing_message = document.createElement('p');
        missing_message.className = 'visual-review__empty';
        missing_message.textContent = 'Capture unavailable for this state.';
        figure_element.append(missing_message);
      }
    }
    document.querySelector('#review-state-source').href = selected_state.figma_url;
    const pair_labels = { implementation: 'Storybook / website', 'figma-storybook': 'Figma / Storybook', 'figma-drupal': 'Figma / website' };
    document.querySelector('#review-state-results').textContent = selected_state.comparisons.map((pair_result) => `${pair_labels[pair_result.pair_name]}: ${pair_result.status}${pair_result.message.match(/^([\d,]+) pixels differ/) ? ` (${pair_result.message.match(/^([\d,]+) pixels differ/)[1]} px)` : ''}`).join(' · ');
    update_capture_layout();
    void load_pair();
  }
  state_select?.addEventListener('change', select_recorded_state);
  pair_select.addEventListener('change', load_pair);
  mode_select.addEventListener('change', draw_comparison);
  balance_input.addEventListener('input', draw_comparison);
  document.querySelector('#comparison-toggle').addEventListener('click', () => { mode_select.value = 'overlay'; balance_input.value = Number(balance_input.value) === 0 ? '100' : '0'; draw_comparison(); });
  if (visual_states.length) select_recorded_state();
  else load_pair();
  return disconnect_layout;
}
