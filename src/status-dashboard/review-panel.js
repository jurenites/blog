import { create_auto_capture } from './auto-capture.js';
import { browser_layout_preferences } from './layout-preferences.js';
import { button_preview_url } from './storybook-preview.js';
import { figma_overview_reference } from './figma-overview.js';
import { combination_list, combination_label } from './button-combinations.js';
import { monospace_numbers } from './testing-ui.js';
import { escape_html } from '../stories/template.js';
import { recorded_button_combination, recorded_story_url } from './button-coverage.js';
import { enable_custom_select, initialize_tooltips } from '../slice/src/js/script.js';
import { initialize_file_inputs } from '../slice/src/js/file-input.js';
import { icon_markup } from '../stories/atoms/icon/icon.markup.js';
import { icon_button_markup } from '../stories/atoms/icon-button/icon-button.markup.js';
import { inline_code_markup } from '../stories/atoms/inline-code/inline-code.markup.js';
import { button_markup } from '../stories/atoms/button/button.markup.js';
import { checkbox_markup } from '../stories/atoms/checkbox/checkbox.markup.js';
import { range_slider_markup } from '../stories/atoms/range-slider/range-slider.markup.js';
import { status_label_markup, REVIEW_STATUS_LABELS } from './status-mark.js';

function figma_embed_url(reference_url) {
  try {
    const parsed_url = new URL(reference_url);
    if (!['www.figma.com', 'figma.com'].includes(parsed_url.hostname) || !parsed_url.pathname.startsWith('/design/') || !parsed_url.searchParams.get('node-id')) return '';
    parsed_url.hostname = 'embed.figma.com';
    parsed_url.searchParams.set('embed-host', 'jurenites-component-status');
    parsed_url.searchParams.set('viewport-controls', 'true');
    parsed_url.searchParams.set('page-selector', 'false');
    parsed_url.searchParams.set('footer', 'true');
    return parsed_url.href;
  } catch { return ''; }
}

function image_reference(component_row, check_key, image_label) {
  const check_result = component_row.checks.find((check_item) => check_item.check_key === check_key);
  return check_result?.artifacts?.find((artifact_item) => artifact_item.artifact_label === image_label)?.artifact_path ?? '';
}

function recorded_states(component_row) {
  return component_row.checks.find((check_item) => check_item.check_key === 'integration')?.details?.visual_states ?? [];
}

const SOURCE_LABELS = { figma: 'Figma', storybook: 'Storybook', drupal: 'Website' };
const VIEWPORT_WIDTHS = [360, 768, 1280, 1920];
const VIEWPORT_HEIGHTS = [640, 720, 900, 1080, 1440, 2160];

function nearest_preset_index(preset_values, pixel_value) {
  return preset_values.reduce((best_index, preset_value, preset_index) => Math.abs(preset_value - pixel_value) < Math.abs(preset_values[best_index] - pixel_value) ? preset_index : best_index, 0);
}

function example_fields(example_row, example_index, viewport_width = 1280) {
  const hidden_field_markup = field_key => `<input type="hidden" form="visual-review-form" data-example-field="${field_key}" value="${escape_html(example_row[field_key] ?? '')}">`;
  const field_markup = (field_key, field_label, placeholder_value = '') => `<label class="visual-review__field"><span class="${['page_url', 'component_selector'].includes(field_key) ? 'form-required' : ''}" data-example-field-label="${field_key}">${field_label}</span><input form="visual-review-form" class="text-input__control" data-example-field="${field_key}" value="${escape_html(example_row[field_key] ?? '')}" placeholder="${placeholder_value}" ${['page_url', 'component_selector'].includes(field_key) ? 'required' : ''}></label>`;
  const remove_button = icon_button_markup({ button_accessible_label: `Remove website example ${example_index + 1}`, button_type: 'button', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'cross-big', class_name: 'visual-review__remove-icon' }), additional_class_names: 'visual-review__remove-example' }).replace('<button', '<button data-remove-example');
  return `<fieldset class="visual-review__example" data-example-id="${escape_html(example_row.example_id ?? `example-${example_index + 1}`)}"><legend class="visually-hidden">Website example ${example_index + 1}</legend>${hidden_field_markup('example_label')}<div class="visual-review__example-url-row">${field_markup('page_url', `Example URL ${example_index + 1}`, '/contact')}${remove_button}</div>${field_markup('component_selector', 'Component selector', '.hero-section__action')}${hidden_field_markup('interaction_selector')}${hidden_field_markup('reveal_selector')}<section class="visual-review__web-live" aria-label="Live web"><h5 class="visual-review__web-heading visually-hidden">Live web</h5><p class="status-dashboard__meta" data-web-preview-message role="status"></p><div class="visual-review__web-viewport" data-web-preview-columns="40" data-web-preview-rows="16" hidden><iframe class="visual-review__web-frame visual-review__frame--${viewport_width}" title="Website example ${example_index + 1} live preview" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div></section></fieldset>`;
}

export function review_panel_markup(component_row, case_config, saved_case, extra_markup = '') {
  const review_case = { ...case_config, ...saved_case };
  const story_url = review_case.story_url ?? `/storybook/iframe.html?id=${encodeURIComponent(component_row.story_ids[0])}&viewMode=story`;
  const field_value = (field_name, fallback_value = '') => escape_html(String(review_case[field_name] ?? fallback_value));
  const visual_states = recorded_states(component_row);
  const selected_images = visual_states[0]?.images ?? {};
  const official_suite = case_config.review_suite === 'language-picker';
  const website_examples = review_case.website_examples ?? (review_case.drupal_url ? [{ example_id: 'website', example_label: 'Website', page_url: review_case.drupal_url, component_selector: review_case.drupal_selector }] : []);
  const website_image = selected_images.drupal ?? image_reference(component_row, 'drupal', 'Actual website');
  const story_image = review_case.storybook_capture ?? selected_images.storybook ?? image_reference(component_row, 'storybook', 'Storybook');
  const figma_image = review_case.remove_baseline ? '' : review_case.figma_baseline ?? selected_images.figma ?? '';
  const source_link = (link_value) => {
    if (!link_value) return '';
    try { const parsed_url = new URL(link_value, window.location.origin); return ['http:', 'https:'].includes(parsed_url.protocol) ? parsed_url.href : ''; } catch { return ''; }
  };
  const story_reference_url = source_link(visual_states[0] ? recorded_story_url(component_row, visual_states[0]) || story_url : story_url);
  const figma_url = source_link(visual_states[0]?.figma_url ?? review_case.figma_url);
  const website_url = source_link(visual_states[0]?.website_url ?? website_examples[0]?.page_url ?? review_case.drupal_url);
  const source_icons = { figma: 'brand-figma', storybook: 'brand-storybook', drupal: 'globe' };
  const overview_reference = figma_overview_reference(component_row.component_id, review_case.figma_url);
  const live_reference_url = overview_reference?.wrapper_url ?? figma_url;
  const live_figma_markup = `<details class="visual-review__preview-disclosure visual-review__figma-live${overview_reference ? ' visual-review__figma-live--overview' : ''}" data-workspace-details="figma-live-preview"${figma_embed_url(live_reference_url) ? '' : ' hidden'}><summary class="visual-review__preview-heading">Live Figma canvas</summary><div class="visual-review__figma-frame-scroll"><iframe class="visual-review__figma-frame${overview_reference ? ' visual-review__figma-frame--overview' : ''}" src="${escape_html(figma_embed_url(live_reference_url))}" title="${escape_html(component_row.component_name)} live Figma" loading="lazy" allowfullscreen></iframe></div><p class="status-dashboard__meta">Set the canvas zoom to 100% to compare component sizes with the PNG.</p></details>`;
  const figure_markup = (figure_title, artifact_path, missing_text, source_name, source_url) => {
    const source_toggle = icon_button_markup({ button_accessible_label: `Toggle ${figure_title} capture`, button_icon_markup: icon_markup({ icon_name: 'eye', class_name: 'visual-review__toggle-icon' }), button_type: 'button', style_variant: 'ghost', additional_class_names: 'visual-review__source-toggle' }).replace('<button', `<button data-preview-source="${source_name}" aria-pressed="true" aria-controls="review-${source_name}-capture"`);
    const settings_toggle = official_suite ? '' : icon_button_markup({ button_accessible_label: `${figure_title} settings`, button_icon_markup: icon_markup({ icon_name: 'gear', class_name: 'visual-review__settings-icon' }), style_variant: 'ghost', additional_class_names: 'visual-review__settings-toggle' }).replace('<button', `<button data-source-settings="${source_name}" aria-expanded="false" aria-controls="source-settings-${source_name}"`);
    return `<section class="visual-review__source-pane" data-image-source="${source_name}" aria-label="${figure_title} comparison"><div class="visual-review__source-heading"><a class="visual-review__source-link" id="review-${source_name}-source"${source_url ? ` href="${escape_html(source_url)}"` : ' hidden'} target="_blank" rel="noopener" aria-label="Open ${figure_title}" data-tooltip-trigger data-tooltip-label="${escape_html(source_url)}">${icon_markup({ icon_name: source_icons[source_name], class_name: 'visual-review__source-icon', is_link_prefix: true })}</a><span class="visual-review__source-unavailable" ${source_url ? 'hidden' : ''} aria-label="${figure_title} source unavailable">${icon_markup({ icon_name: source_icons[source_name], class_name: 'visual-review__source-icon', is_link_prefix: true })}</span><h3 class="visual-review__source-title">${figure_title}</h3><div class="visual-review__source-actions">${source_toggle}${source_name === 'figma' ? figma_reference_controls(Boolean(artifact_path)) : source_name === 'storybook' ? storybook_upload_controls() : ''}${settings_toggle}</div></div><div class="visual-review__capture horizontal-scrollbar" id="${source_name === 'storybook' && component_row.component_id === 'atoms-button' ? 'review-storybook-recorded-capture' : `review-${source_name}-capture`}">${artifact_path ? `<div class="visual-review__reference"><figure class="visual-review__figure"><img class="visual-review__image" src="/${escape_html(artifact_path)}" alt="${figure_title} capture"></figure></div>` : `<p class="visual-review__empty">${missing_text}</p>`}</div>${source_name === 'storybook' ? '<p class="status-dashboard__meta" data-storybook-capture-message role="status"></p>' : ''}${source_name === 'figma' ? live_figma_markup : ''}${source_name === 'storybook' && component_row.component_id === 'atoms-button' ? `<div class="visual-review__story-live" id="review-storybook-capture" aria-label="Six Storybook button combinations"><div class="visual-review__story-viewport" data-web-preview-columns="40" data-web-preview-rows="37"><iframe class="visual-review__story-frame" title="Storybook button combinations" loading="lazy"></iframe></div></div>` : ''}${source_name === 'storybook' && component_row.component_id !== 'atoms-button' ? `<details class="visual-review__preview-disclosure visual-review__live" data-viewport-width="${viewport_width}" data-workspace-details="storybook-interactive-preview" open><summary class="visual-review__preview-heading">Interactive preview</summary><div class="visual-review__frame-scroll horizontal-scrollbar"><iframe class="visual-review__frame visual-review__interactive-frame" data-viewport-width="${viewport_width}" data-viewport-height="${viewport_height}" src="${escape_html(story_url)}" title="${escape_html(component_row.component_name)} live Storybook" loading="lazy"></iframe></div></details>`: ''}<p class="visual-review__content" data-source-content="${source_name}" hidden></p>${official_suite ? '' : source_settings_markup[source_name]}</section>`;
  };
  const viewport_width = Number(review_case.viewport_width ?? review_case.viewport_widths?.[0] ?? 1280);
  const viewport_height = Number(review_case.viewport_height ?? 900);
  const capture_controls = official_suite ? `<form id="visual-review-form" data-review-suite="language-picker"><div class="visual-review__actions">${button_markup({ button_label: 'Run language-picker tests', button_type: 'submit', style_variant: 'primary' })}<span id="visual-review-message" role="status"></span></div></form>` : `<form id="visual-review-form" class="visual-review__form"><div class="visual-review__run-controls">
    <input type="hidden" name="comparison_mode" value="component">
    <div class="visual-review__viewport-controls"><div class="visual-review__field"><label class="form-required" for="review-viewport-width-input">Capture viewport width</label><div class="visual-review__width-controls"><input class="text-input__control visual-review__width-input" id="review-viewport-width-input" name="viewport_width" type="number" min="1" step="1" required value="${viewport_width}"><span>px</span></div>${range_slider_markup({ field_id: 'review-viewport-width', accessible_label: 'Capture viewport width presets', range_value: nearest_preset_index(VIEWPORT_WIDTHS, viewport_width), range_max: VIEWPORT_WIDTHS.length - 1, value_text: `${viewport_width} pixels` })}<div class="visual-review__viewport-ticks" aria-hidden="true">${VIEWPORT_WIDTHS.map(pixel_width => `<span>${pixel_width}</span>`).join('')}</div></div>
    <div class="visual-review__field"><label class="form-required" for="review-viewport-height">Capture viewport height</label><div class="visual-review__height-controls">${range_slider_markup({ field_id: 'review-viewport-height-slider', accessible_label: 'Capture viewport height presets', range_value: nearest_preset_index(VIEWPORT_HEIGHTS, viewport_height), range_max: VIEWPORT_HEIGHTS.length - 1, value_text: `${viewport_height} pixels`, slider_orientation: 'vertical' })}<input class="text-input__control visual-review__height-input" id="review-viewport-height" name="viewport_height" type="number" min="320" max="2560" required value="${viewport_height}"><span>px</span></div></div></div><div class="visual-review__checkbox" hidden>${checkbox_markup({ field_id: 'review-inputs-matched', field_name: 'inputs_matched', field_value: 'on', field_label: 'Exact-pixel mode only: content, language and state are identical.', checkbox_state: review_case.inputs_matched ? 'filled' : 'empty' })}</div>
    <div class="visual-review__actions">${button_markup({ button_label: 'Capture all examples', button_type: 'submit', style_variant: 'primary', additional_class_names: 'visual-review__capture-submit' }).replace('<button', '<button hidden')}<span id="visual-review-message" role="status"></span></div>
    </div></form>`;
  const source_settings_markup = { figma: `<div class="visual-review__link-column" id="source-settings-figma" data-link-source="figma" hidden aria-label="Figma settings">
    <label class="visual-review__field">Figma reference link<input form="visual-review-form" class="text-input__control" name="figma_url" type="url" value="${field_value('figma_url')}"></label>
    <p class="status-dashboard__meta" data-figma-reference-message role="status"></p>
    </div>`, storybook: `<div class="visual-review__link-column" id="source-settings-storybook" data-link-source="storybook" hidden aria-label="Storybook settings">
    <label class="visual-review__field"><span class="form-required">Storybook URL / args</span><input form="visual-review-form" class="text-input__control" name="story_url" required value="${escape_html(story_url)}"></label>
    <label class="visual-review__field"><span class="form-required">Storybook component selector</span><input form="visual-review-form" class="text-input__control" name="story_selector" required value="${field_value('story_selector')}"></label>
    <details class="visual-review__source-targets" hidden><summary>Interaction targets</summary><label class="visual-review__field">Storybook reveal / tooltip target<input form="visual-review-form" class="text-input__control" name="story_hover_selector" value="${field_value('story_hover_selector')}"></label><label class="visual-review__field">Storybook interaction target<input form="visual-review-form" class="text-input__control" name="story_interaction_selector" value="${field_value('story_interaction_selector')}"></label></details>
    ${capture_controls}</div>`, drupal: `<div class="visual-review__link-column" id="source-settings-drupal" data-link-source="drupal" hidden aria-label="Website settings"><div id="website-examples">${website_examples.map((example_row, example_index) => example_fields(example_row, example_index, review_case.viewport_width ?? review_case.viewport_widths?.[0] ?? 1280)).join('')}</div><div class="visual-review__add-example">${icon_button_markup({ button_accessible_label: 'Add website example', button_type: 'button', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'plus', class_name: 'visual-review__add-icon' }), additional_class_names: 'visual-review__add-example-button' }).replace('<button', '<button id="website-add-example"')}<span class="visual-review__add-example-label">Add website example</span></div></div>` };
  const data_controls_markup = `${component_row.component_id === 'atoms-button' || visual_states.length ? `<div class="visual-review__state"><label class="${component_row.component_id === 'atoms-button' ? 'visually-hidden' : ''}" for="review-state">${component_row.component_id === 'atoms-button' ? 'Combination' : 'Recorded example &amp; state'}</label><input type="range" id="review-state" min="0" max="${component_row.component_id === 'atoms-button' ? combination_list().length - 1 : visual_states.length - 1}" step="1" value="0" aria-describedby="review-state-label"${component_row.component_id !== 'atoms-button' && visual_states.length === 1 ? ' disabled' : ''}><output id="review-state-label" for="review-state" aria-live="polite">${escape_html(component_row.component_id === 'atoms-button' ? combination_label(combination_list()[0]) : visual_states[0].state_label)}</output></div>` : ''}
    ${component_row.component_id === 'atoms-button' && visual_states.length ? `<label class="visual-review__field visual-review__example-choice">Website example<select id="review-example" class="select-input__native" data-jurenites-select>${[...new Map(visual_states.map(state_row => [state_row.example_id, state_row])).values()].map(state_row => `<option value="${escape_html(state_row.example_id)}">${escape_html(state_row.example_label)}</option>`).join('')}</select></label>` : ''}`;
  const matrix_markup = component_row.component_id === 'atoms-button' ? extra_markup.replace('<div data-review-controls></div>', data_controls_markup) : extra_markup;
  return `<section class="visual-review" aria-label="Visual comparison">
    <h3 class="visually-hidden">Screenshot comparison</h3>
    <div class="visual-review__combination-controls" hidden>${component_row.component_id !== 'atoms-button' ? data_controls_markup : ''}</div>
    <div class="visual-review__three-up" data-preview-mode="separate">
      <div class="visual-review__preview-toolbar" hidden>
        ${button_markup({ button_label: 'Overlay', button_type: 'button', style_variant: 'secondary', additional_class_names: 'visual-review__mode-toggle' }).replace('<button', '<button id="preview-overlay-toggle" aria-pressed="false" aria-controls="review-preview-stage"')}
      </div>
      <p id="preview-source-status" class="visually-hidden" role="status"></p>
      <div id="review-preview-stage" class="visual-review__preview-stage">${figure_markup('Figma', figma_image, 'N/A', 'figma', figma_url)}${figure_markup('Storybook', story_image, 'Not captured.', 'storybook', story_reference_url)}${figure_markup('Website', website_image, 'No captured website example.', 'drupal', website_url)}</div>
    </div>
    <input form="visual-review-form" name="remove_baseline" type="hidden" value="${review_case.remove_baseline ? 'true' : 'false'}">
    <div class="visual-review__combination-controls" hidden>${matrix_markup}</div>
    ${visual_states.length ? '<details class="visual-review__evidence" data-workspace-details="comparison-evidence"><summary>Comparison evidence</summary><div id="review-state-results" class="visual-review__results"></div></details>' : ''}
    ${official_suite ? `<details class="visual-review__settings" data-workspace-details="capture-settings"><summary>Capture settings</summary>${capture_controls}</details>` : ''}
  </section>`;
}

function storybook_upload_controls() {
  const upload_button = icon_button_markup({ button_accessible_label: 'Upload Storybook PNG', tooltip_label: 'Upload Storybook PNG', button_icon_markup: icon_markup({ icon_name: 'arrow-upload', class_name: 'visual-review__upload-reference-icon' }), style_variant: 'ghost', additional_class_names: 'visual-review__upload-storybook' }).replace('<button', '<button data-upload-storybook-png');
  return `<input id="review-storybook-png" type="file" accept="image/png" hidden>${upload_button}`;
}

function figma_reference_controls(has_reference) {
  const upload_button = icon_button_markup({ button_accessible_label: 'Upload Figma PNG', button_type: 'button', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'arrow-upload', class_name: 'visual-review__upload-reference-icon' }), additional_class_names: 'visual-review__upload-reference' }).replace('<button', `<button data-upload-figma-png data-tooltip-trigger data-tooltip-label="Upload Figma PNG (1×)"${has_reference ? ' hidden' : ''}`);
  const refresh_button = icon_button_markup({ button_accessible_label: 'Generate Figma PNG automatically', button_type: 'button', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'arrow-refresh', class_name: 'visual-review__refresh-reference-icon' }), additional_class_names: 'visual-review__obtain-reference' }).replace('<button', `<button data-obtain-figma-png data-tooltip-trigger data-tooltip-label="Automatically generate a fresh Figma PNG (1×)"${has_reference ? ' hidden' : ''}`);
  const remove_button = figma_remove_button().replace('<button', `<button data-tooltip-trigger data-tooltip-label="Remove Figma PNG"${has_reference ? '' : ' hidden'}`);
  return `<input form="visual-review-form" id="review-figma-png" name="figma_png" type="file" accept="image/png" hidden>${upload_button}${refresh_button}${remove_button}`;
}

function figma_remove_button() {
  return icon_button_markup({ button_accessible_label: 'Remove Figma PNG', button_type: 'button', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'cross-big', class_name: 'visual-review__remove-reference-icon' }), additional_class_names: 'visual-review__remove-reference' }).replace('<button', '<button data-remove-figma-png');
}

export function connect_review_panel({ component_row, review_token, refresh_results, set_busy, workspace_state = {}, save_settings, flush_settings }) {
  const review_form = document.querySelector('#visual-review-form');
  const review_element = review_form.closest('.visual-review');
  const interactive_frame = review_element.querySelector('.visual-review__interactive-frame');
  function update_interactive_viewport() {
    if (!interactive_frame) return;
    for (const dimension_name of ['width', 'height']) {
      const dimension_input = review_form.elements[`viewport_${dimension_name}`];
      if (dimension_input?.value && dimension_input.validity.valid) {
        interactive_frame.setAttribute(`data-viewport-${dimension_name}`, dimension_input.value);
        if (dimension_name === 'width') interactive_frame.closest('.visual-review__live').dataset.viewportWidth = dimension_input.value;
      }
    }
    const story_input = review_form.elements.story_url;
    if (story_input?.value && interactive_frame.getAttribute('src') !== story_input.value) interactive_frame.src = story_input.value;
  }
  review_form.addEventListener('input', update_interactive_viewport);
  const width_slider = review_form.querySelector('#review-viewport-width');
  const height_slider = review_form.querySelector('#review-viewport-height-slider');
  if (width_slider && height_slider) {
    const width_input = review_form.elements.viewport_width;
    const height_input = review_form.elements.viewport_height;
    width_slider.addEventListener('input', () => {
      const pixel_width = VIEWPORT_WIDTHS[Number(width_slider.value)];
      width_input.value = pixel_width;
      width_slider.setAttribute('aria-valuetext', `${pixel_width} pixels`);
    });
    width_input.addEventListener('input', () => {
      if (!width_input.validity.valid || !width_input.value) return;
      width_slider.value = nearest_preset_index(VIEWPORT_WIDTHS, Number(width_input.value));
      width_slider.setAttribute('aria-valuetext', `${width_input.value} pixels`);
    });
    height_slider.addEventListener('input', () => {
      const pixel_height = VIEWPORT_HEIGHTS[Number(height_slider.value)];
      height_input.value = pixel_height;
      height_slider.setAttribute('aria-valuetext', `${pixel_height} pixels`);
    });
    height_input.addEventListener('input', () => {
      if (!height_input.validity.valid || !height_input.value) return;
      height_slider.value = nearest_preset_index(VIEWPORT_HEIGHTS, Number(height_input.value));
      height_slider.setAttribute('aria-valuetext', `${height_input.value} pixels`);
    });
  }
  for (const settings_button of review_element.querySelectorAll('[data-source-settings]')) {
    const settings_panel = document.getElementById(settings_button.getAttribute('aria-controls'));
    const set_settings_open = is_open => {
      settings_panel.hidden = !is_open;
      settings_button.setAttribute('aria-expanded', String(is_open));
      settings_button.querySelector('.visual-review__settings-icon').outerHTML = icon_markup({ icon_name: is_open ? 'gear-filled' : 'gear', class_name: 'visual-review__settings-icon' });
    };
    settings_button.addEventListener('click', () => set_settings_open(settings_panel.hidden));
    settings_panel.addEventListener('keydown', key_event => {
      if (key_event.key !== 'Escape') return;
      set_settings_open(false);
      settings_button.focus();
    });
    settings_panel.addEventListener('invalid', () => set_settings_open(true), true);
  }

  for (const source_anchor of review_element.querySelectorAll('.visual-review__source-link[href]')) source_anchor.dataset.tooltipLabel = source_anchor.href;
  initialize_tooltips(review_element);
  for (const source_anchor of review_element.querySelectorAll('.visual-review__source-link')) source_anchor.jurenites_tooltip_element?.classList.add('visual-review__url-tooltip');
  initialize_file_inputs(review_element);
  for (const select_element of document.querySelectorAll('.visual-review select[data-jurenites-select]')) enable_custom_select(select_element);
  const story_disclosure = review_element.querySelector('.visual-review__story-live');
  const story_frame = story_disclosure?.querySelector('iframe');
  function update_story_preview() {
    if (!story_disclosure) return;
    const story_reference = review_form.elements.story_url.value;
    let preview_url;
    try { preview_url = button_preview_url(story_reference, 'primary|false|default', window.location.origin); } catch { return; }
    const combination_url = new URL(preview_url);
    combination_url.searchParams.set('component_preview', 'button-combinations');
    combination_url.searchParams.delete('preview_state');
    preview_url = combination_url.href;
    const source_anchor = review_element.querySelector('#review-storybook-source');
    source_anchor.hidden = false;
    source_anchor.nextElementSibling.hidden = true;
    source_anchor.href = preview_url;
    source_anchor.dataset.tooltipLabel = preview_url;
    if (source_anchor.jurenites_tooltip_element) source_anchor.jurenites_tooltip_element.textContent = preview_url;
    if (story_frame.getAttribute('src') !== preview_url) story_frame.src = preview_url;
  }
  update_story_preview();
  const story_message_handler = message_event => {
    const message_data = message_event.data;
    if (!story_frame?.getAttribute('src') || message_event.source !== story_frame.contentWindow || message_event.origin !== new URL(story_frame.src).origin || message_data?.message_type !== 'jurenites-storybook-preview') return;
    if (![message_data.component_width, message_data.component_height].every(size_value => Number.isFinite(size_value) && size_value > 0)) return;
    const story_viewport = story_disclosure.querySelector('.visual-review__story-viewport');
    story_viewport.dataset.webPreviewColumns = String(Math.max(1, Math.min(128, Math.ceil(message_data.component_width / 8))));
    story_viewport.dataset.webPreviewRows = String(Math.max(1, Math.min(64, Math.ceil(message_data.component_height / 8))));
  };
  window.addEventListener('message', story_message_handler);
  const example_list = document.querySelector('#website-examples');
  function update_web_preview(example_element) {
    const web_preview = example_element.querySelector('.visual-review__web-live');
    const web_viewport = web_preview.querySelector('.visual-review__web-viewport');
    const web_frame = web_preview.querySelector('iframe');
    const page_url = example_element?.querySelector('[data-example-field="page_url"]')?.value;
    const component_selector = example_element?.querySelector('[data-example-field="component_selector"]')?.value.trim();
    const preview_message = web_preview.querySelector('[data-web-preview-message]');
    if (!page_url || !component_selector) { preview_message.textContent = 'Add a page URL and component selector.'; web_viewport.hidden = true; web_frame.removeAttribute('src'); delete web_frame.dataset.previewIdentifier; return; }
    let preview_url;
    try { preview_url = new URL(page_url, 'http://jurenites.local/'); } catch { preview_message.textContent = 'Enter a valid website URL.'; web_viewport.hidden = true; web_frame.removeAttribute('src'); delete web_frame.dataset.previewIdentifier; return; }
    if (preview_url.origin !== 'http://jurenites.local') { preview_message.textContent = 'Live web is available for the local website.'; web_viewport.hidden = true; web_frame.removeAttribute('src'); delete web_frame.dataset.previewIdentifier; return; }
    preview_url.searchParams.set('jurenites_component_preview', component_selector);
    const previous_url = web_frame.getAttribute('src') ? new URL(web_frame.src) : null;
    if (previous_url) { previous_url.searchParams.delete('jurenites_preview_id'); if (previous_url.href === preview_url.href) return; }
    const preview_identifier = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    web_frame.dataset.previewIdentifier = preview_identifier;
    preview_url.searchParams.set('jurenites_preview_id', preview_identifier);
    preview_message.textContent = 'Loading website component…';
    web_viewport.hidden = false;
    web_frame.src = preview_url.href;
  }
  function update_web_previews() {
    for (const example_element of example_list?.children ?? []) update_web_preview(example_element);
  }
  const web_message_handler = message_event => {
    const message_data = message_event.data;
    if (message_event.origin !== 'http://jurenites.local' || message_data?.message_type !== 'jurenites-component-preview') return;
    const web_frame = [...(example_list?.querySelectorAll('.visual-review__web-frame') ?? [])].find(frame_element => message_event.source === frame_element.contentWindow && message_data.preview_identifier === frame_element.dataset.previewIdentifier);
    if (!web_frame) return;
    const web_preview = web_frame.closest('.visual-review__web-live');
    const web_viewport = web_preview.querySelector('.visual-review__web-viewport');
    const preview_message = web_preview.querySelector('[data-web-preview-message]');
    if (typeof message_data.error_message === 'string') { preview_message.textContent = message_data.error_message.slice(0, 300); web_viewport.hidden = true; return; }
    if (![message_data.component_width, message_data.component_height].every(size_value => Number.isFinite(size_value) && size_value > 0)) return;
    web_viewport.dataset.webPreviewColumns = String(Math.max(1, Math.min(128, Math.ceil(message_data.component_width / 8))));
    web_viewport.dataset.webPreviewRows = String(Math.max(1, Math.min(64, Math.ceil(message_data.component_height / 8))));
    preview_message.textContent = '';
    web_viewport.hidden = false;
  };
  window.addEventListener('message', web_message_handler);
  update_web_previews();

  function read_website_examples() {
    return [...(example_list?.children ?? [])].map((example_element, example_index) => {
      const example_values = Object.fromEntries([...example_element.querySelectorAll('[data-example-field]')].map(input_element => [input_element.dataset.exampleField, input_element.value]));
      let page_label = example_values.page_url;
      try { page_label = new URL(example_values.page_url, window.location.origin).pathname; } catch { /* Keep the draft URL until it is valid. */ }
      return { example_id: example_element.dataset.exampleId, ...example_values, example_label: example_values.example_label || [page_label, example_values.component_selector].filter(Boolean).join(' · ') || `Website example ${example_index + 1}` };
    });
  }
  function read_draft_case() {
    const form_data = new FormData(review_form);
    const draft_case = Object.fromEntries(form_data.entries());
    draft_case.capture_states = ['default'];
    draft_case.inputs_matched = form_data.has('inputs_matched');
    draft_case.remove_baseline = form_data.get('remove_baseline') === 'true';
    draft_case.website_examples = read_website_examples();
    delete draft_case.figma_png;
    return draft_case;
  }
  let storybook_override = workspace_state.draft_case?.storybook_capture ?? '';
  let reference_removed = Boolean(workspace_state.draft_case?.remove_baseline);
  let reference_override = workspace_state.draft_case?.figma_baseline;
  const save_draft = () => save_settings?.({ draft_case: read_draft_case() });
  review_form.addEventListener('input', save_draft);
  const handle_review_change = change_event => {
    save_draft();
    const image_file = change_event.target.id === 'review-figma-png' ? change_event.target.files?.[0] : undefined;
    if (!image_file) return;
    if (image_file.size > 8 * 1024 * 1024) { document.querySelector('#visual-review-message').textContent = 'Choose a PNG under 8 MB.'; return; }
    const file_reader = new FileReader();
    file_reader.addEventListener('load', () => {
      reference_removed = false;
      reference_override = file_reader.result;
      review_form.elements.remove_baseline.value = 'false';
      save_settings?.({ draft_case: read_draft_case() }, file_reader.result);
      display_figma_reference(file_reader.result);
    });
    file_reader.readAsDataURL(image_file);
  };
  function display_figma_reference(image_source) {
    const capture_element = review_element.querySelector('[data-image-source="figma"] .visual-review__capture');
    capture_element.innerHTML = image_source ? `<div class="visual-review__reference"><figure class="visual-review__figure"><img class="visual-review__image" src="${escape_html(image_source)}" alt="Figma reference"></figure></div>` : '<p class="visual-review__empty">N/A</p>';
    update_capture_layout();
  }
  review_element.addEventListener('click', async click_event => {
    if (click_event.target.closest('[data-upload-figma-png]')) { review_form.elements.figma_png.click(); return; }
    if (!click_event.target.closest('[data-remove-figma-png]')) return;
    reference_removed = true;
    reference_override = '';
    review_form.elements.remove_baseline.value = 'true';
    if (review_form.elements.figma_png) review_form.elements.figma_png.value = '';
    save_draft();
    display_figma_reference('');
    review_element.querySelector('[data-obtain-figma-png]')?.focus();
    await flush_settings?.();
  });
  review_element.querySelector('[data-obtain-figma-png]')?.addEventListener('click', async click_event => {
    const obtain_button = click_event.currentTarget;
    const message_element = review_element.querySelector('[data-figma-reference-message]');
    obtain_button.disabled = true;
    message_element.textContent = 'Obtaining Figma PNG…';
    try {
      await flush_settings?.();
      const reference_response = await fetch('/api/figma-reference', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': review_token }, body: JSON.stringify({ component_id: component_row.component_id, figma_url: review_form.elements.figma_url.value }) });
      const reference_result = await reference_response.json();
      if (!reference_response.ok) throw new Error(reference_result.error ?? 'Could not obtain Figma PNG.');
      reference_removed = false;
      reference_override = reference_result.draft_case.figma_baseline;
      review_form.elements.remove_baseline.value = 'false';
      save_settings?.({ draft_case: read_draft_case() });
      display_figma_reference(`/${reference_override}`);
      message_element.textContent = 'Fresh Figma PNG obtained at 1×.';
    } catch (reference_error) { message_element.textContent = reference_error.message; }
    finally { obtain_button.disabled = false; }
  });
  review_form.addEventListener('change', handle_review_change);
  review_element.querySelector('#review-figma-png')?.addEventListener('change', handle_review_change);
  for (const source_settings of review_element.querySelectorAll('.visual-review__link-column')) {
    source_settings.addEventListener('input', input_event => {
      if (!review_form.contains(input_event.target)) review_form.dispatchEvent(new Event('input', { bubbles: true }));
    });
    source_settings.addEventListener('change', handle_review_change);
  }
  example_list?.addEventListener('change', change_event => {
    const example_element = change_event.target.closest('[data-example-id]');
    if (example_element) update_web_preview(example_element);
  });
  document.querySelector('#website-add-example')?.addEventListener('click', () => {
    if (example_list.children.length >= 8) return;
    example_list.insertAdjacentHTML('beforeend', example_fields({ example_id: `example-${Date.now()}` }, example_list.children.length, Number(review_form.elements.viewport_width.value)));
    update_web_preview(example_list.lastElementChild);
    example_list.lastElementChild.querySelector('[data-example-field="page_url"]').focus();
    review_form.dispatchEvent(new Event('input', { bubbles: true }));
  });
  example_list?.addEventListener('click', (click_event) => {
    if (!click_event.target.closest('[data-remove-example]')) return;
    const removed_example = click_event.target.closest('[data-example-id]');
    const next_example = removed_example.nextElementSibling ?? removed_example.previousElementSibling;
    removed_example.remove();
    [...example_list.children].forEach((example_element, example_index) => { example_element.querySelector('legend').textContent = `Website example ${example_index + 1}`; example_element.querySelector('[data-example-field-label="page_url"]').textContent = `Example URL ${example_index + 1}`; example_element.querySelector('[data-remove-example]').setAttribute('aria-label', `Remove website example ${example_index + 1}`); example_element.querySelector('.visual-review__web-frame').title = `Website example ${example_index + 1} live preview`; });
    (next_example?.querySelector('[data-remove-example]') ?? document.querySelector('#website-add-example')).focus();
    review_form.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const capture_message = review_element.querySelector('[data-storybook-capture-message]');
  function read_capture_settings() {
    if (review_form.dataset.reviewSuite) return null;
    const input_data = read_draft_case();
    if (!input_data.story_selector?.trim() || !review_form.elements.viewport_width.validity.valid || !review_form.elements.viewport_width.value || !review_form.elements.viewport_height.validity.valid || !review_form.elements.viewport_height.value) return null;
    try {
      const story_address = new URL(input_data.story_url, window.location.origin);
      if (story_address.origin !== window.location.origin || story_address.pathname !== '/storybook/iframe.html' || !component_row.story_ids.includes(story_address.searchParams.get('id'))) return null;
      input_data.story_url = `${story_address.pathname}${story_address.search}`;
      if (input_data.figma_url) {
        const figma_address = new URL(input_data.figma_url);
        if (figma_address.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(figma_address.hostname)) return null;
      }
    } catch { return null; }
    input_data.component_id = component_row.component_id;
    input_data.website_examples = input_data.website_examples.filter(example_row => example_row.page_url?.trim() && example_row.component_selector?.trim());
    return input_data;
  }
  const auto_capture = create_auto_capture({
    read_settings: read_capture_settings,
    on_status: (status_message, is_busy) => {
      set_busy(is_busy);
      capture_message.textContent = status_message;
      capture_message.setAttribute('aria-busy', String(is_busy));
      review_element.querySelector('[data-upload-storybook-png]').disabled = is_busy;
    },
    run_capture: async input_data => {
      await flush_settings?.();
      const capture_response = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': review_token }, body: JSON.stringify(input_data) });
      const capture_result = await capture_response.json();
      if (!capture_response.ok) {
        const capture_error = new Error(capture_result.error ?? 'Capture failed. Check the selector or upload a Storybook PNG.');
        if (capture_response.status === 409) capture_error.retry_after_ms = 2000;
        throw capture_error;
      }
      return capture_result;
    },
    on_complete: async capture_result => {
      if (!review_element.isConnected) return;
      const story_check = capture_result.components[0]?.checks.find(check_result => check_result.check_key === 'storybook');
      const capture_errors = story_check?.details?.filter?.(capture_row => capture_row.error || capture_row.error_message || capture_row.message)?.map(capture_row => capture_row.error || capture_row.error_message || capture_row.message).join(' ');
      await refresh_results(true);
      const next_message = document.querySelector('[data-storybook-capture-message]');
      if (next_message) next_message.textContent = story_check?.artifacts?.length ? 'Capture updated. Recorded checks show the latest results.' : `Storybook was not captured. ${capture_errors || story_check?.message || 'Check the URL and selector.'} You can upload a PNG instead.`;
    },
  });
  const auto_capture_input = input_event => {
    const input_element = input_event.target;
    if (input_element.type === 'file' || input_element.name === 'figma_url') return;
    if (input_element.matches('[name="story_url"], [name="story_selector"], [name="viewport_width"], [name="viewport_height"], .range-slider, [data-example-field]') || input_element === review_form) auto_capture.schedule_capture();
  };
  review_element.addEventListener('input', auto_capture_input);
  review_element.addEventListener('change', auto_capture_input);
  review_element.querySelector('[data-upload-storybook-png]')?.addEventListener('click', () => review_element.querySelector('#review-storybook-png').click());
  review_element.querySelector('#review-storybook-png')?.addEventListener('change', async upload_event => {
    const image_file = upload_event.target.files?.[0];
    if (!image_file) return;
    if (image_file.size > 8 * 1024 * 1024) { capture_message.textContent = 'Choose a PNG under 8 MB.'; return; }
    capture_message.textContent = 'Uploading Storybook PNG…';
    try {
      const png_data = await new Promise((resolve_file, reject_file) => {
        const file_reader = new FileReader();
        file_reader.onload = () => resolve_file(file_reader.result);
        file_reader.onerror = () => reject_file(new Error('Could not read the PNG.'));
        file_reader.readAsDataURL(image_file);
      });
      await flush_settings?.();
      const upload_response = await fetch('/api/storybook-reference', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': review_token }, body: JSON.stringify({ component_id: component_row.component_id, png_data }) });
      const upload_result = await upload_response.json();
      if (!upload_response.ok) throw new Error(upload_result.error ?? 'Could not save Storybook PNG.');
      storybook_override = upload_result.draft_case.storybook_capture;
      const capture_element = review_element.querySelector('[data-image-source="storybook"] .visual-review__capture');
      capture_element.innerHTML = `<div class="visual-review__reference"><figure class="visual-review__figure"><img class="visual-review__image" src="/${escape_html(storybook_override)}" alt="Uploaded Storybook PNG"></figure></div>`;
      capture_message.textContent = 'Uploaded Storybook PNG · automated checks have not been run for this image.';
      update_capture_layout();
    } catch (upload_error) { capture_message.textContent = upload_error.message; }
    upload_event.target.value = '';
  });
  review_form.addEventListener('submit', async (submit_event) => {
    submit_event.preventDefault();
    if (!review_form.dataset.reviewSuite) { auto_capture.schedule_capture(); return; }
    await flush_settings?.();
    const message_element = document.querySelector('#visual-review-message');
    const submit_button = review_form.querySelector('button[type="submit"]');
    const form_data = new FormData(review_form);
    const input_data = Object.fromEntries(form_data.entries());
    input_data.capture_states = ['default'];
    input_data.website_examples = read_website_examples();
    input_data.component_id = component_row.component_id;
    input_data.inputs_matched = form_data.has('inputs_matched');
    input_data.remove_baseline = form_data.get('remove_baseline') === 'true';
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
  const layout_buttons = [...document.querySelectorAll('[data-comparison-layout]')];
  let comparison_layout = browser_layout_preferences.read_layout();
  function update_comparison_layout() {
    capture_grid.dataset.comparisonLayout = comparison_layout;
    for (const layout_button of layout_buttons) layout_button.setAttribute('aria-pressed', String(layout_button.dataset.comparisonLayout === comparison_layout));
  }
  for (const layout_button of layout_buttons) {
    layout_button.addEventListener('click', () => {
      comparison_layout = layout_button.dataset.comparisonLayout;
      browser_layout_preferences.save_layout(comparison_layout);
      update_comparison_layout();
      save_view();
    });
  }
  update_comparison_layout();
  const preview_stage = document.querySelector('#review-preview-stage');
  const mode_toggle = document.querySelector('#preview-overlay-toggle');
  const source_toggles = [...capture_grid.querySelectorAll('[data-preview-source]')];
  const enabled_sources = new Set(workspace_state.view_state?.enabled_sources ?? Object.keys(SOURCE_LABELS));
  const visual_states = recorded_states(component_row);
  const state_select = document.querySelector('#review-state');
  const example_select = document.querySelector('#review-example');
  const is_button_component = component_row.component_id === 'atoms-button';
  const overview_reference = figma_overview_reference(component_row.component_id, review_element.querySelector('[name="figma_url"]')?.value);
  let combination_keys = combination_list(workspace_state.matrix_state);
  let recorded_index = 0;
  const current_recorded_index = () => is_button_component ? recorded_index : Number(state_select?.value ?? 0);
  let unavailable_combination = workspace_state.view_state?.unavailable_combination ?? '';
  mode_toggle.setAttribute('aria-pressed', 'false');
  if (state_select && workspace_state.view_state?.recorded_state) {
    const saved_index = visual_states.findIndex(state_row => `${state_row.example_id}|${state_row.state_key}` === workspace_state.view_state.recorded_state);
    if (saved_index >= 0) { recorded_index = saved_index; if (!is_button_component) state_select.value = String(saved_index); if (example_select) example_select.value = visual_states[saved_index].example_id; }
  }
  if (example_select && workspace_state.view_state?.example_id && [...example_select.options].some(option_item => option_item.value === workspace_state.view_state.example_id)) example_select.value = workspace_state.view_state.example_id;
  function save_view() {
    const selected_state = visual_states[current_recorded_index()];
    save_settings?.({ view_state: { comparison_layout, example_id: example_select?.value ?? '', combination_key: is_button_component ? combination_keys[Number(state_select?.value ?? 0)] : '', unavailable_combination, enabled_sources: [...enabled_sources], overlay_enabled: mode_toggle.getAttribute('aria-pressed') === 'true', recorded_state: selected_state ? `${selected_state.example_id}|${selected_state.state_key}` : '' } });
  }
  function update_capture_layout() {
    const overlay_enabled = mode_toggle.getAttribute('aria-pressed') === 'true';
    const available_sources = [];
    const missing_sources = [];
    for (const source_toggle of source_toggles) {
      const source_name = source_toggle.dataset.previewSource;
      const figure_element = preview_stage.querySelector(`[data-image-source="${source_name}"]`);
      const capture_element = figure_element.querySelector('.visual-review__capture');
      const capture_image = capture_element.querySelector('img');
      const live_story_available = source_name === 'storybook' && Boolean(story_frame?.getAttribute('src'));
      const capture_available = live_story_available || Boolean(capture_image && !(capture_image.complete && !capture_image.naturalWidth));
      if (source_name === 'figma') {
        figure_element.querySelector('[data-remove-figma-png]').hidden = !capture_available;
        figure_element.querySelector('[data-upload-figma-png]').hidden = capture_available;
        figure_element.querySelector('[data-obtain-figma-png]').hidden = capture_available;
        if (!capture_available && capture_element.querySelector('.visual-review__empty')) capture_element.querySelector('.visual-review__empty').textContent = 'N/A';
      }
      if (source_name === 'storybook') figure_element.querySelector('[data-upload-storybook-png]').hidden = Boolean(capture_image) && !storybook_override;
      const source_enabled = enabled_sources.has(source_name);
      source_toggle.disabled = !capture_available;
      source_toggle.setAttribute('aria-pressed', String(source_enabled && capture_available));
      const visibility_icon_name = source_enabled && capture_available ? 'eye' : 'eye-closed';
      const toggle_icon = source_toggle.querySelector('.visual-review__toggle-icon');
      if (toggle_icon.dataset.iconName !== visibility_icon_name) toggle_icon.outerHTML = icon_markup({ icon_name: visibility_icon_name, class_name: 'visual-review__toggle-icon' });
      source_toggle.setAttribute('aria-label', `Toggle ${SOURCE_LABELS[source_name]} capture`);
      source_toggle.setAttribute('aria-description', capture_available ? '' : 'Capture unavailable');
      capture_element.hidden = live_story_available || !source_enabled || (overlay_enabled && !capture_available);
      if (source_name === 'storybook' && story_disclosure) story_disclosure.hidden = !source_enabled;
      if (capture_available && source_enabled) available_sources.push(source_name);
      if (!capture_available) missing_sources.push(SOURCE_LABELS[source_name]);
    }
    capture_grid.dataset.previewMode = overlay_enabled ? 'overlay' : 'separate';
    preview_stage.dataset.activeCount = String(available_sources.length);
    preview_stage.dataset.visibleCount = String([...preview_stage.querySelectorAll('.visual-review__capture')].filter(capture_element => !capture_element.hidden).length);
    const source_description = available_sources.length ? `${available_sources.map(source_name => SOURCE_LABELS[source_name]).join(' + ')}${overlay_enabled ? ` · ${Math.round(100 / available_sources.length)}% opacity each` : ''}` : 'No sources active. Select a source above.';
    document.querySelector('#preview-source-status').textContent = `${source_description}${missing_sources.length ? ` · Capture unavailable: ${missing_sources.join(', ')}.` : ''}`;
    monospace_numbers(document.querySelector('#preview-source-status'));
  }
  for (const source_toggle of source_toggles) source_toggle.addEventListener('click', () => {
    const source_name = source_toggle.dataset.previewSource;
    if (enabled_sources.has(source_name)) enabled_sources.delete(source_name);
    else enabled_sources.add(source_name);
    update_capture_layout();
    save_view();
  });
  mode_toggle.addEventListener('click', () => {
    mode_toggle.setAttribute('aria-pressed', String(mode_toggle.getAttribute('aria-pressed') !== 'true'));
    update_capture_layout();
    save_view();
  });
  const layout_observer = new ResizeObserver(update_capture_layout);
  layout_observer.observe(capture_grid);
  capture_grid.addEventListener('load', update_capture_layout, true);
  capture_grid.addEventListener('error', update_capture_layout, true);
  const disconnect_layout = () => {
    auto_capture.dispose();
    set_busy(false);
    layout_observer.disconnect();
    window.removeEventListener('message', web_message_handler);
    window.removeEventListener('message', story_message_handler);
    capture_grid.removeEventListener('load', update_capture_layout, true);
    capture_grid.removeEventListener('error', update_capture_layout, true);
  };
  function select_recorded_state() {
    const selected_state = visual_states[current_recorded_index()];
    if (!selected_state) return;
    unavailable_combination = '';
    const selected_label = is_button_component ? combination_label(recorded_button_combination(component_row, selected_state)) : selected_state.state_label;
    document.querySelector('#review-state-label').textContent = selected_label;
    state_select.setAttribute('aria-valuetext', selected_label);
    if (component_row.component_id === 'atoms-button') review_element.dispatchEvent(new CustomEvent('recorded-state-selected', { detail: { combination_key: recorded_button_combination(component_row, selected_state) } }));
    for (const source_name of ['figma', 'storybook', 'drupal']) {
      const figure_element = document.querySelector(`[data-image-source="${source_name}"]`);
      const capture_element = figure_element.querySelector('.visual-review__capture');
      capture_element.replaceChildren();
      const image_path = source_name === 'figma' ? reference_removed ? '' : selected_state.state_key === 'default' && reference_override ? reference_override : selected_state.images[source_name] : source_name === 'storybook' && storybook_override ? storybook_override : selected_state.images[source_name];
      if (image_path) {
        const image_figure = document.createElement('figure');
        image_figure.className = 'visual-review__figure';
        const image_element = document.createElement('img');
        image_element.className = 'visual-review__image';
        image_element.src = image_path.startsWith('data:') ? image_path : `/${image_path}`;
        image_element.alt = `${selected_state.state_label} · ${source_name}`;
        image_figure.append(image_element);
        const reference_container = document.createElement('div');
        reference_container.className = 'visual-review__reference';
        reference_container.append(image_figure);
        capture_element.append(reference_container);
      } else {
        const missing_message = document.createElement('p');
        missing_message.className = 'visual-review__empty';
        missing_message.textContent = source_name === 'figma' ? 'N/A' : 'Capture unavailable for this state.';
        capture_element.append(missing_message);
      }
    }
    for (const [source_name, source_url] of [['figma', selected_state.figma_url], ['storybook', recorded_story_url(component_row, selected_state)], ['drupal', selected_state.website_url]]) {
      const source_anchor = document.querySelector(`#review-${source_name}-source`);
      source_anchor.hidden = !source_url;
      source_anchor.nextElementSibling.hidden = Boolean(source_url);
      if (source_url) source_anchor.href = source_url;
      else source_anchor.removeAttribute('href');
      source_anchor.dataset.tooltipLabel = source_url ? source_anchor.href : '';
      if (source_anchor.jurenites_tooltip_element) { source_anchor.jurenites_tooltip_element.textContent = source_anchor.dataset.tooltipLabel; source_anchor.jurenites_tooltip_element.classList.remove('is-visible'); }
      if (source_name === 'figma') {
        const live_preview = document.querySelector('.visual-review__figma-live');
        const embed_url = figma_embed_url(overview_reference?.wrapper_url ?? source_url);
        live_preview.hidden = !embed_url;
        const live_frame = live_preview.querySelector('iframe');
        if (embed_url) { if (live_frame.getAttribute('src') !== embed_url) live_frame.src = embed_url; }
        else live_frame.removeAttribute('src');
      }
    }
    initialize_tooltips(review_element);
    for (const source_anchor of review_element.querySelectorAll('.visual-review__source-link')) source_anchor.jurenites_tooltip_element?.classList.add('visual-review__url-tooltip');
    for (const source_name of ['figma', 'storybook', 'drupal']) document.querySelector(`[data-source-content="${source_name}"]`).textContent = selected_state.content?.[source_name] ? `Copy: ${selected_state.content[source_name]}` : '';
    document.querySelector('#review-state-results').innerHTML = comparison_evidence_markup(selected_state);
    monospace_numbers(document.querySelector('#review-state-results'));
    update_capture_layout();
  }
  function select_slider_combination() {
    if (is_button_component) review_element.dispatchEvent(new CustomEvent('button-combination-selected', { detail: { combination_key: combination_keys[Number(state_select.value)] } }));
    else { select_recorded_state(); save_view(); }
  }
  state_select?.addEventListener('input', select_slider_combination);
  state_select?.addEventListener('change', select_slider_combination);
  example_select?.addEventListener('change', select_slider_combination);
  review_element.addEventListener('button-combination-list', list_event => {
    combination_keys = list_event.detail.combination_keys;
    state_select.max = String(combination_keys.length - 1);
    const active_index = combination_keys.indexOf(list_event.detail.active_combination);
    if (active_index >= 0) state_select.value = String(active_index);
  });
  review_element.addEventListener('button-combination-selected', selection_event => {
    const combination_key = selection_event.detail.combination_key;
    const slider_index = combination_keys.indexOf(combination_key);
    if (state_select && slider_index >= 0) state_select.value = String(slider_index);
    const current_example = example_select?.value ?? visual_states[current_recorded_index()]?.example_id;
    const matching_indexes = visual_states.map((state_row, state_index) => recorded_button_combination(component_row, state_row) === combination_key ? state_index : -1).filter(state_index => state_index >= 0);
    const selected_index = current_example ? matching_indexes.find(state_index => visual_states[state_index].example_id === current_example) : matching_indexes[0];
    if (selected_index !== undefined && state_select) { recorded_index = selected_index; select_recorded_state(); update_story_preview(); save_view(); return; }
    review_element.dispatchEvent(new CustomEvent('recorded-state-selected', { detail: { combination_key } }));
    if (state_select) state_select.setAttribute('aria-valuetext', `No recorded capture for ${combination_key}`);
    recorded_index = -1;
    const state_output = document.querySelector('#review-state-label');
    if (state_output) state_output.textContent = `${combination_label(combination_key)} · No recorded capture`;
    for (const capture_element of review_element.querySelectorAll('.visual-review__capture')) capture_element.innerHTML = '<p class="visual-review__empty">No recorded capture for this combination.</p>';
    for (const source_anchor of review_element.querySelectorAll('.visual-review__source-link')) { source_anchor.hidden = true; source_anchor.removeAttribute('href'); source_anchor.dataset.tooltipLabel = ''; source_anchor.jurenites_tooltip_element?.classList.remove('is-visible'); }
    const live_preview = review_element.querySelector('.visual-review__figma-live');
    live_preview.hidden = !overview_reference; if (!overview_reference) live_preview.querySelector('iframe').removeAttribute('src');
    const state_results = document.querySelector('#review-state-results');
    if (state_results) state_results.textContent = 'No recorded evidence for this combination.';
    update_capture_layout();
    unavailable_combination = combination_key;
    update_story_preview();
    save_view();
  });
  if (is_button_component) {
    const initial_combination = workspace_state.view_state?.combination_key || workspace_state.view_state?.unavailable_combination || recorded_button_combination(component_row, visual_states[recorded_index] ?? {}) || combination_keys[0];
    review_element.dispatchEvent(new CustomEvent('button-combination-selected', { detail: { combination_key: initial_combination } }));
  } else if (visual_states.length) select_recorded_state();
  else update_capture_layout();
  if (storybook_override) capture_message.textContent = 'Uploaded Storybook PNG · automated checks have not been run for this image.';
  return disconnect_layout;
}

export function comparison_evidence_markup(selected_state) {
  const pair_labels = { implementation: 'Implementation', 'figma-storybook': 'Design / story', 'figma-drupal': 'Design / site' };
  return selected_state.comparisons.map(pair_result => `<article class="visual-review__result"><h4>${escape_html(pair_labels[pair_result.pair_name] ?? pair_result.pair_name)} ${status_label_markup(pair_result.status)}</h4><p>${escape_html(pair_result.message)}</p>${pair_result.differences_list?.length ? `<ul>${pair_result.differences_list.map(difference_row => `<li class="visual-review__difference-row">${escape_html(difference_row.role_name)} · <code>${escape_html(difference_row.property_key)}</code>: <span class="visual-review__value-from"><span class="visually-hidden">Current value: </span>${inline_code_markup({ snippet_text: String(difference_row.actual_value) })}</span> → <span class="visual-review__value-to"><span class="visually-hidden">Target value: </span>${inline_code_markup({ snippet_text: String(difference_row.expected_value) })}</span></li>`).join('')}</ul>` : ''}</article>`).join('') + (selected_state.interactions?.length ? `<article class="visual-review__result"><h4>Interaction feedback</h4><ul>${selected_state.interactions.map(interaction_row => `<li>${escape_html(interaction_row.source_id)}: ${REVIEW_STATUS_LABELS[interaction_row.status] ?? 'Incomplete'} · ${escape_html(interaction_row.message)}</li>`).join('')}</ul></article>` : '');
}
