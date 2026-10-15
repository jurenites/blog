import { button_markup, button_link_markup } from '../stories/atoms/button/button.markup.js';
import { use_project_buttons, monospace_numbers } from './testing-ui.js';
import { escape_html } from '../stories/template.js';
import { enable_custom_select } from '../slice/src/js/script.js';
import { TRANSITION_DURATION, pair_history_layers, layer_keyframes, describe_layer_change } from './history-motion.js';

const HOME_LAYERS = [
  { layer_id: 'site-brand', layer_label: 'Site identity', selector_text: '.site-header__branding', depth_level: 1 },
  { layer_id: 'main-navigation', layer_label: 'Main navigation', selector_text: '.site-header__navigation', depth_level: 1 },
  { layer_id: 'hero-section', layer_label: 'Hero region', selector_text: '.hero-section', depth_level: 0 },
  { layer_id: 'hero-heading', layer_label: 'Introduction heading', selector_text: '.hero-section__heading', depth_level: 2 },
  { layer_id: 'hero-description', layer_label: 'Introduction copy', selector_text: '.hero-section__description', depth_level: 2 },
  { layer_id: 'contact-action', layer_label: 'Contact action', selector_text: '.hero-section__action.button--primary', depth_level: 3 },
  { layer_id: 'secondary-action', layer_label: 'Secondary action', selector_text: '.hero-section__action.button--secondary', depth_level: 3 },
  { layer_id: 'project-slider', layer_label: 'Project showcase', selector_text: '.project-case-slider', depth_level: 1 },
  { layer_id: 'site-footer', layer_label: 'Footer region', selector_text: '.site-footer', depth_level: 0 },
];
use_project_buttons(document);
const route_parameters = new URLSearchParams(location.search);
const query_element = (selector_text) => document.querySelector(selector_text);
const context_component = route_parameters.get('component');
query_element('#history-back').innerHTML = button_link_markup({ button_label: context_component ? 'Back to details' : 'Components', link_url: context_component ? `/#${encodeURIComponent(context_component)}` : '/', style_variant: 'ghost' });
const stage_element = query_element('#history-stage');
const player_element = query_element('.history-player');
const progress_input = query_element('#history-progress');
const toggle_button = query_element('#version-toggle');
const play_button = query_element('#play-toggle');
const notes_form = query_element('#notes-form');
const capture_form = query_element('#capture-form');
const motion_sheet = new CSSStyleSheet();
document.adoptedStyleSheets = [...document.adoptedStyleSheets, motion_sheet];
let history_data = { milestone_rows: [] };
let selected_target = route_parameters.get('target') || 'homepage';
let before_id = route_parameters.get('before') || '';
let after_id = route_parameters.get('after') || '';
let progress_value = 0;
let destination_value = 1;
let frame_request = 0;
let previous_time = 0;
let blueprint_mode = false;
let animation_rows = [];
let image_rows = [];
let layer_pairs = [];
let current_notes_id = '';
let render_sequence = 0;
let inspection_mode = false;
let editor_context = null;
const reason_drafts = new Map();
const note_drafts = new Map();

function selected_milestone(side_name) {
  return history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === (side_name === 'before' ? before_id : after_id));
}
function version_text(milestone_row) {
  return milestone_row?.version_number && milestone_row.version_number !== 'unrecorded' ? `v${milestone_row.version_number.replace(/^v/, '')}` : 'version unrecorded';
}
function refresh_select(select_element) {
  const old_wrapper = select_element.closest('.select-input--enhanced');
  if (old_wrapper) { old_wrapper.before(select_element); old_wrapper.remove(); select_element.jurenites_custom_select_initialized = false; }
  enable_custom_select(select_element);
}
function safe_url(url_value) {
  try { const parsed_url = new URL(url_value, location.origin); return ['https:', 'http:'].includes(parsed_url.protocol) ? escape_html(parsed_url.href) : ''; } catch { return ''; }
}
function show_status(message_text) { query_element('#history-status').textContent = message_text; monospace_numbers(query_element('#history-status')); }
async function load_history(preferred_id = '') {
  const api_response = await fetch('/api/history');
  if (!api_response.ok) throw new Error('Could not load milestones. Start the visual testing server.');
  history_data = await api_response.json();
  const preferred_row = history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === preferred_id);
  if (preferred_row) { if (selected_target !== preferred_row.target_id) { before_id = ''; after_id = ''; } selected_target = preferred_row.target_id; }
  const target_rows = new Map([[selected_target, route_parameters.get('target_label') || selected_target], ...history_data.milestone_rows.map((milestone_row) => [milestone_row.target_id, `${milestone_row.target_label} · ${milestone_row.target_scope}`])]);
  const target_select = query_element('#history-target');
  target_select.innerHTML = [...target_rows].filter(([target_id]) => !context_component || target_id === selected_target).map(([target_id, target_label]) => `<option value="${escape_html(target_id)}">${escape_html(target_label)}</option>`).join('');
  target_select.value = selected_target;
  refresh_select(target_select);
  const target_milestones = history_data.milestone_rows.filter((milestone_row) => milestone_row.target_id === selected_target);
  if (!before_id) before_id = target_milestones[0]?.milestone_id ?? '';
  if (preferred_id || !after_id) after_id = preferred_id || target_milestones.at(-1)?.milestone_id || '';
  const saved_target = target_milestones[0];
  capture_form.elements.target_id.value = selected_target;
  capture_form.elements.target_id.readOnly = Boolean(context_component);
  capture_form.elements.page_url.value = saved_target?.page_url || (selected_target === 'homepage' ? 'http://jurenites.local/' : '');
  capture_form.elements.target_label.value = saved_target?.target_label || route_parameters.get('target_label') || selected_target;
  const target_scope = saved_target?.target_scope || route_parameters.get('scope') || 'page';
  capture_form.elements.target_scope.value = ['page', 'organism'].includes(target_scope) ? target_scope : 'page';
  capture_form.elements.root_selector.value = saved_target?.root_selector || (target_scope === 'page' ? 'body' : '');
  if (selected_target !== 'homepage') capture_form.elements.layer_definitions.value = JSON.stringify(saved_target?.layer_rows?.map(({ layer_id, layer_label, selector_text, depth_level }) => ({ layer_id, layer_label, selector_text, depth_level })) || [], null, 2);
  refresh_select(capture_form.elements.target_scope);
  render_versions();
  await render_comparison();
}
function render_versions() {
  const milestone_rows = history_data.milestone_rows.filter((milestone_row) => milestone_row.target_id === selected_target);
  for (const side_name of ['before', 'after']) {
    const version_select = query_element(`#${side_name}-versions`);
    version_select.innerHTML = milestone_rows.map((milestone_row) => `<option value="${escape_html(milestone_row.milestone_id)}">${escape_html(version_text(milestone_row))} · ${escape_html(milestone_row.environment_name)} · ${escape_html(milestone_row.notes_data.milestone_title)} · ${escape_html(new Date(milestone_row.captured_at).toLocaleString())}</option>`).join('');
    version_select.value = side_name === 'before' ? before_id : after_id;
    refresh_select(version_select);
  }
  query_element('#pair-summary').textContent = `${version_text(selected_milestone('before'))} → ${version_text(selected_milestone('after'))}`;
  query_element('#pair-evidence').textContent = ['before', 'after'].map((side_name) => {
    const milestone_data = selected_milestone(side_name);
    return milestone_data ? `${side_name}: ${new Date(milestone_data.captured_at).toLocaleString()} · ${milestone_data.viewport_width} × ${milestone_data.viewport_height}` : '';
  }).join(' / ');
  const route_url = new URL(location.href);
  route_url.searchParams.set('target', selected_target);
  for (const [side_name, milestone_id] of [['before', before_id], ['after', after_id]]) if (milestone_id) route_url.searchParams.set(side_name, milestone_id); else route_url.searchParams.delete(side_name);
  history.replaceState(null, '', route_url);
  render_notes();
  monospace_numbers(query_element('#versions-dialog'));
}
function stop_playback() {
  cancelAnimationFrame(frame_request);
  frame_request = 0;
  previous_time = 0;
  play_button.textContent = 'Play';
}
function update_progress(next_value) {
  progress_value = Math.max(0, Math.min(1, next_value));
  progress_input.value = String(Math.round(progress_value * 1000));
  progress_input.setAttribute('aria-valuetext', `${Math.round(progress_value * 100)}% from Before to After`);
  query_element('#progress-value').textContent = `${Math.round(progress_value * 100)}%`;
  stage_element.dataset.progressValue = String(progress_value);
  for (const animation_row of animation_rows) animation_row.currentTime = TRANSITION_DURATION * progress_value;
  for (const image_row of image_rows) image_row.image_element.hidden = image_row.image_kind === 'endpoint-before' ? progress_value !== 0 : image_row.image_kind === 'endpoint-after' ? progress_value !== 1 : progress_value === 0 || progress_value === 1;
  const current_side = progress_value === 1 ? 'after' : progress_value === 0 ? 'before' : destination_value === 1 ? 'after' : 'before';
  const next_label = `${current_side === 'before' ? 'Before' : 'After'} ${version_text(selected_milestone(current_side))}`;
  if (toggle_button.dataset.versionLabel !== next_label) {
    toggle_button.dataset.versionLabel = next_label;
    toggle_button.innerHTML = `<span class="history-player__version-word">${current_side === 'before' ? 'Before' : 'After'}</span><span class="testing-number">${escape_html(version_text(selected_milestone(current_side)))}</span>`;
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) toggle_button.querySelector('.history-player__version-word').animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 160 });
  }
  toggle_button.setAttribute('aria-label', `${next_label}. Switch to ${current_side === 'before' ? 'After' : 'Before'}.`);
  render_console();
}
function animate_frame(frame_time) {
  if (previous_time) update_progress(progress_value + (destination_value === 1 ? 1 : -1) * (frame_time - previous_time) * Number(query_element('#history-speed').value) / TRANSITION_DURATION);
  previous_time = frame_time;
  if (progress_value === destination_value) { stop_playback(); return; }
  frame_request = requestAnimationFrame(animate_frame);
}
function start_playback(next_destination) {
  stop_playback();
  destination_value = next_destination;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { update_progress(destination_value); return; }
  play_button.textContent = 'Pause';
  frame_request = requestAnimationFrame(animate_frame);
}
function attach_animation(target_element, frame_rows) {
  const motion_animation = target_element.animate(frame_rows, { duration: TRANSITION_DURATION, easing: 'linear', fill: 'both' });
  motion_animation.pause();
  animation_rows.push(motion_animation);
}
function add_image(image_url, class_name, image_kind, css_rules, width_value, height_value) {
  const image_element = document.createElement('img');
  image_element.src = image_url;
  image_element.alt = '';
  image_element.className = class_name;
  image_element.id = `history-image-${image_rows.length}`;
  css_rules.push(`#${image_element.id} { width: ${width_value}px; height: ${height_value}px; }`);
  image_rows.push({ image_element, image_kind });
  stage_element.append(image_element);
  return image_element;
}
async function render_comparison() {
  const current_sequence = ++render_sequence;
  stop_playback();
  for (const animation_row of animation_rows) animation_row.cancel();
  animation_rows = []; image_rows = []; layer_pairs = [];
  stage_element.replaceChildren();
  stage_element.classList.toggle('is-blueprint', blueprint_mode);
  query_element('#layer-annotation').hidden = true;
  query_element('#layer-editor').hidden = true;
  query_element('#layer-list').hidden = false;
  query_element('#layer-back').hidden = true;
  editor_context = null;
  const before_data = selected_milestone('before');
  const after_data = selected_milestone('after');
  const comparable_pair = before_data && after_data && before_id !== after_id && before_data.target_id === selected_target && after_data.target_id === selected_target && before_data.viewport_width === after_data.viewport_width && before_data.viewport_height === after_data.viewport_height && before_data.target_scope === after_data.target_scope && before_data.root_selector === after_data.root_selector;
  for (const control_element of [toggle_button, play_button, progress_input, query_element('#blueprint-toggle'), query_element('#inspect-toggle')]) control_element.disabled = !comparable_pair;
  if (!comparable_pair) {
    motion_sheet.replaceSync('');
    stage_element.innerHTML = '<p class="history-player__empty">Choose two different milestones with the same target scope, root and viewport.</p>';
    query_element('#layer-list').replaceChildren();
    show_status(history_data.history_errors.join(' ') || 'A matched pair uses the same viewport and target. Capture another version below.');
    update_progress(0); return;
  }
  layer_pairs = pair_history_layers(before_data, after_data);
  const css_rules = [`#history-stage { width: ${Math.max(before_data.image_width, after_data.image_width)}px; height: ${Math.max(before_data.image_height, after_data.image_height)}px; }`];
  if (blueprint_mode) {
    for (const [pair_index, layer_pair] of layer_pairs.entries()) {
      const source_layer = layer_pair.before_layer || layer_pair.after_layer;
      const destination_layer = layer_pair.after_layer || source_layer;
      const shape_element = document.createElement('button');
      shape_element.type = 'button';
      shape_element.className = 'history-player__shape';
      shape_element.id = `history-shape-${pair_index}`;
      shape_element.dataset.layerId = layer_pair.layer_id;
      shape_element.innerHTML = `<span>${escape_html(destination_layer.layer_label)}</span>`;
      shape_element.setAttribute('aria-label', `${destination_layer.layer_label}. ${describe_layer_change(layer_pair)}`);
      css_rules.push(`#${shape_element.id} { width: ${source_layer.bounds_data.width}px; height: ${source_layer.bounds_data.height}px; }`);
      stage_element.append(shape_element);
      attach_animation(shape_element, layer_keyframes(source_layer, destination_layer, { blueprint_mode: true, fade_direction: !layer_pair.before_layer ? 'in' : !layer_pair.after_layer ? 'out' : '' }));
      shape_element.addEventListener('mouseenter', () => annotate_layer(layer_pair));
      shape_element.addEventListener('focus', () => annotate_layer(layer_pair));
      shape_element.addEventListener('click', () => open_layer_editor(layer_pair));
      shape_element.addEventListener('mouseleave', () => { if (document.activeElement !== shape_element) query_element('#layer-annotation').hidden = true; });
      shape_element.addEventListener('blur', () => { query_element('#layer-annotation').hidden = true; });
    }
  } else {
    for (const [side_name, milestone_data] of [['before', before_data], ['after', after_data]]) {
      const base_element = add_image(milestone_data.base_image_url, 'history-player__image', 'transition', css_rules, milestone_data.image_width, milestone_data.image_height);
      attach_animation(base_element, [{ opacity: side_name === 'before' ? 1 : 0 }, { opacity: 1 }]);
    }
    for (const layer_pair of layer_pairs) {
      const both_animate = layer_pair.before_layer?.motion_enabled && layer_pair.after_layer?.motion_enabled;
      for (const [side_name, source_layer] of [['before', layer_pair.before_layer], ['after', layer_pair.after_layer]]) {
        if (!source_layer?.motion_enabled) continue;
        const start_layer = both_animate ? layer_pair.before_layer : source_layer;
        const end_layer = both_animate ? layer_pair.after_layer : source_layer;
        const patch_element = add_image(source_layer.image_url, 'history-player__patch', 'transition', css_rules, start_layer.bounds_data.width, start_layer.bounds_data.height);
        patch_element.dataset.layerId = layer_pair.layer_id;
        patch_element.dataset.sideName = side_name;
        attach_animation(patch_element, layer_keyframes(start_layer, end_layer, { fade_direction: side_name === 'before' ? 'out' : 'in' }));
      }
    }
    add_image(before_data.full_image_url, 'history-player__image', 'endpoint-before', css_rules, before_data.image_width, before_data.image_height);
    add_image(after_data.full_image_url, 'history-player__image', 'endpoint-after', css_rules, after_data.image_width, after_data.image_height);
    for (const [pair_index, layer_pair] of [...layer_pairs].sort((first_pair, second_pair) => {
      const first_bounds = (first_pair.after_layer || first_pair.before_layer).bounds_data;
      const second_bounds = (second_pair.after_layer || second_pair.before_layer).bounds_data;
      return second_bounds.width * second_bounds.height - first_bounds.width * first_bounds.height;
    }).entries()) {
      const source_layer = layer_pair.before_layer || layer_pair.after_layer;
      const destination_layer = layer_pair.after_layer || source_layer;
      const hit_button = document.createElement('button');
      hit_button.type = 'button';
      hit_button.className = 'history-player__hotspot';
      hit_button.id = `history-hotspot-${pair_index}`;
      hit_button.dataset.layerId = layer_pair.layer_id;
      hit_button.setAttribute('aria-label', `Edit reason: ${destination_layer.layer_label}`);
      hit_button.hidden = !inspection_mode;
      css_rules.push(`#${hit_button.id} { width: ${source_layer.bounds_data.width}px; height: ${source_layer.bounds_data.height}px; }`);
      stage_element.append(hit_button);
      attach_animation(hit_button, layer_keyframes(source_layer, destination_layer));
      hit_button.addEventListener('click', () => open_layer_editor(layer_pair));
      hit_button.addEventListener('mouseenter', () => annotate_layer(layer_pair));
      hit_button.addEventListener('focus', () => annotate_layer(layer_pair));
      hit_button.addEventListener('mouseleave', () => { query_element('#layer-annotation').hidden = true; });
    }

  }
  motion_sheet.replaceSync(css_rules.join('\n'));
  query_element('#layer-list').innerHTML = layer_pairs.map((layer_pair, pair_index) => `<div data-pair-index="${pair_index}">${button_markup({ button_label: (layer_pair.after_layer || layer_pair.before_layer).layer_label, button_type: 'button', style_variant: 'ghost' })}</div>`).join('') || '<p>No mapped elements.</p>';
  render_player_hint();
  update_progress(progress_value);
  const image_results = await Promise.allSettled(image_rows.map((image_row) => image_row.image_element.decode()));
  if (current_sequence !== render_sequence) return;
  const warnings_text = [...before_data.capture_warnings, ...after_data.capture_warnings, ...history_data.history_errors].join(' ');
  const missing_images = image_results.some((image_result) => image_result.status === 'rejected');
  show_status(missing_images ? 'Some capture images are missing. Restore the milestone files before presenting.' : `${layer_pairs.length} logical layers · ${before_data.viewport_width} × ${before_data.viewport_height} capture viewport. ${warnings_text}`);
  if (missing_images) { stop_playback(); toggle_button.disabled = true; play_button.disabled = true; progress_input.disabled = true; }
}
function render_player_hint() {
  query_element('#player-hint').textContent = blueprint_mode ? 'Blueprint · Select a shape to explain its change.' : inspection_mode ? 'Select an outlined element to edit its reason.' : 'Saved captures · 100% scale';
  monospace_numbers(query_element('#player-hint'));
}
function layer_reason(layer_pair) {
  const reason_data = selected_milestone('after').notes_data;
  return reason_data.comparison_notes?.[before_id]?.[layer_pair.layer_id] ?? reason_data.layer_notes[layer_pair.layer_id] ?? '';
}
function annotate_layer(layer_pair) {
  if (!query_element('#reason-panel').hidden) return;
  const layer_data = layer_pair.after_layer || layer_pair.before_layer;
  const reason_text = layer_reason(layer_pair) || 'Select to add a reason.';
  query_element('#layer-annotation').textContent = `${layer_data.layer_label} · ${describe_layer_change(layer_pair)} ${reason_text}`;
  monospace_numbers(query_element('#layer-annotation'));
  query_element('#layer-annotation').hidden = false;
}
function open_layer_editor(layer_pair) {
  stop_playback();
  editor_context = { before_id, after_id, layer_id: layer_pair.layer_id };
  const draft_key = `${after_id}/${before_id}/${layer_pair.layer_id}`;
  query_element('#reason-panel').hidden = false;
  query_element('#layer-editor').hidden = false;
  query_element('#layer-list').hidden = true;
  query_element('#layer-back').hidden = false;
  query_element('#layer-annotation').hidden = true;
  query_element('#layer-editor-heading').textContent = (layer_pair.after_layer || layer_pair.before_layer).layer_label;
  query_element('#layer-editor-context').textContent = `${version_text(selected_milestone('before'))} → ${version_text(selected_milestone('after'))}`;
  query_element('#layer-editor-change').textContent = describe_layer_change(layer_pair);
  query_element('#layer-reason').value = reason_drafts.get(draft_key)?.reason_text ?? layer_reason(layer_pair);
  query_element('#layer-editor-status').textContent = reason_drafts.has(draft_key) ? 'Unsaved reason' : 'Reason for this selected version pair.';
  for (const shape_element of stage_element.querySelectorAll('[data-layer-id]')) shape_element.classList.toggle('is-highlighted', shape_element.dataset.layerId === layer_pair.layer_id);
  monospace_numbers(query_element('#layer-editor-context'));
  query_element('#layer-reason').focus({ preventScroll: true });
}
query_element('#layer-reason').addEventListener('input', () => {
  if (!editor_context) return;
  const draft_key = `${editor_context.after_id}/${editor_context.before_id}/${editor_context.layer_id}`;
  const milestone_data = history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === editor_context.after_id);
  reason_drafts.set(draft_key, { ...editor_context, reason_text: query_element('#layer-reason').value, revision_number: reason_drafts.get(draft_key)?.revision_number ?? milestone_data.notes_data.revision_number });
  query_element('#layer-editor-status').textContent = 'Unsaved reason';
});
query_element('#layer-editor').addEventListener('submit', async (submit_event) => {
  submit_event.preventDefault();
  if (!editor_context) return;
  const draft_key = `${editor_context.after_id}/${editor_context.before_id}/${editor_context.layer_id}`;
  const saving_draft = reason_drafts.get(draft_key);
  if (!saving_draft) return;
  const milestone_data = history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === saving_draft.after_id);
  const persisted_notes = milestone_data.notes_data;
  const comparison_notes = { ...persisted_notes.comparison_notes, [saving_draft.before_id]: { ...persisted_notes.comparison_notes?.[saving_draft.before_id], [saving_draft.layer_id]: saving_draft.reason_text } };
  query_element('#save-layer-reason').disabled = true;
  try {
    const saved_notes = await post_history('/api/history/notes', { ...persisted_notes, revision_number: saving_draft.revision_number, comparison_notes });
    milestone_data.notes_data = saved_notes;
    if (reason_drafts.get(draft_key) === saving_draft) reason_drafts.delete(draft_key);
    for (const draft_value of reason_drafts.values()) if (draft_value.after_id === saving_draft.after_id) draft_value.revision_number = saved_notes.revision_number;
    const general_draft = note_drafts.get(saving_draft.after_id);
    if (general_draft) { general_draft.revision_number = saved_notes.revision_number; general_draft.comparison_notes = saved_notes.comparison_notes; }
    query_element('#layer-editor-status').textContent = reason_drafts.has(draft_key) ? 'Saved. New edits are unsaved.' : 'Reason saved';
    render_notes();
  } catch (save_error) { query_element('#layer-editor-status').textContent = save_error.message; }
  finally { query_element('#save-layer-reason').disabled = false; }
});
function render_console() {
  const current_side = progress_value === 0 ? 'before' : progress_value === 1 ? 'after' : destination_value === 1 ? 'after' : 'before';
  const milestone_data = selected_milestone(current_side);
  if (!milestone_data) { query_element('#history-console').textContent = 'No version selected.'; return; }
  const commit_text = milestone_data.commit_hash || 'commit unrecorded';
  const commit_link = milestone_data.commit_url ? `<a href="${safe_url(milestone_data.commit_url)}" target="_blank" rel="noopener">${escape_html(commit_text)}</a>` : escape_html(commit_text);
  query_element('#history-console').innerHTML = `<p>${escape_html(version_text(milestone_data))} · ${escape_html(milestone_data.environment_name)} · branch ${escape_html(milestone_data.branch_name || 'unrecorded')}${milestone_data.working_changes ? ' + working changes' : ''} · ${commit_link} · ${escape_html(milestone_data.commit_subject || 'Commit message unavailable')}</p>`;
}
function render_notes() {
  const milestone_data = selected_milestone(query_element('#notes-version').value);
  current_notes_id = milestone_data?.milestone_id || '';
  const notes_data = note_drafts.get(current_notes_id) || milestone_data?.notes_data || {};
  query_element('#version-evidence').innerHTML = milestone_data ? `<a href="${safe_url(milestone_data.page_url)}" target="_blank" rel="noopener">Open captured source</a> · Rendered ${escape_html(version_text(milestone_data))} · Release file ${escape_html(milestone_data.release_version || 'unrecorded')}. ${escape_html(milestone_data.branch_evidence)}${milestone_data.release_version && milestone_data.release_version !== milestone_data.version_number ? ' Build identity differs: the served page and release file are not synchronized.' : ''}` : '';
  for (const field_name of ['milestone_title', 'what_changed', 'why_changed']) notes_form.elements[field_name].value = notes_data[field_name] || '';

  monospace_numbers(query_element('#version-evidence'));
  query_element('#save-notes').disabled = !milestone_data;
  query_element('#notes-status').textContent = note_drafts.has(current_notes_id) ? 'Unsaved draft' : milestone_data ? `Saved revision ${notes_data.revision_number}` : '';
}
async function post_history(endpoint_path, input_data) {
  const api_response = await fetch(endpoint_path, { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': history_data.review_token }, body: JSON.stringify(input_data) });
  const result_data = await api_response.json();
  if (!api_response.ok) throw new Error(result_data.error || 'Request failed.');
  return result_data;
}
notes_form.addEventListener('input', (input_event) => {
  if (input_event.target.matches('select')) return;
  if (!current_notes_id) return;
  const milestone_data = history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === current_notes_id);
  note_drafts.set(current_notes_id, { ...(note_drafts.get(current_notes_id) || milestone_data.notes_data), milestone_title: notes_form.elements.milestone_title.value, what_changed: notes_form.elements.what_changed.value, why_changed: notes_form.elements.why_changed.value });
  query_element('#notes-status').textContent = 'Unsaved draft';
});
notes_form.addEventListener('submit', async (submit_event) => {
  submit_event.preventDefault();
  const saving_id = current_notes_id;
  const saving_data = note_drafts.get(saving_id);
  if (!saving_data) return;
  query_element('#save-notes').disabled = true;
  try {
    const saved_notes = await post_history('/api/history/notes', saving_data);
    history_data.milestone_rows.find((milestone_row) => milestone_row.milestone_id === saving_id).notes_data = saved_notes;
    for (const reason_draft of reason_drafts.values()) if (reason_draft.after_id === saving_id) reason_draft.revision_number = saved_notes.revision_number;
    if (note_drafts.get(saving_id) === saving_data) note_drafts.delete(saving_id);
    else note_drafts.get(saving_id).revision_number = saved_notes.revision_number;
    render_versions();
  } catch (save_error) { query_element('#notes-status').textContent = save_error.message; }
  finally { query_element('#save-notes').disabled = !current_notes_id; }
});
capture_form.elements.layer_definitions.value = JSON.stringify(HOME_LAYERS, null, 2);
capture_form.addEventListener('submit', async (submit_event) => {
  submit_event.preventDefault();
  query_element('#capture-milestone').disabled = true;
  query_element('#capture-status').textContent = 'Capturing the rendered page, fonts, images and logical layers…';
  try {
    const input_data = Object.fromEntries(new FormData(capture_form));
    input_data.layer_rows = JSON.parse(input_data.layer_definitions);
    delete input_data.layer_definitions;
    const capture_data = await post_history('/api/history/capture', input_data);
    await load_history(capture_data.milestone_id);
    query_element('#capture-status').textContent = `Saved ${version_text(capture_data)}. Capture evidence is frozen; add the reasoning above.`;
  } catch (capture_error) { query_element('#capture-status').textContent = capture_error.message; }
  finally { query_element('#capture-milestone').disabled = false; }
});
query_element('#history-target').addEventListener('change', async (change_event) => { selected_target = change_event.target.value; before_id = ''; after_id = ''; progress_value = 0; try { await load_history(); } catch (load_error) { show_status(load_error.message); } });
for (const side_name of ['before', 'after']) query_element(`#${side_name}-versions`).addEventListener('change', (change_event) => {
  if (side_name === 'before') before_id = change_event.target.value; else after_id = change_event.target.value;
  progress_value = 0; render_versions(); render_comparison();
});
for (const [button_id, dialog_id] of [['versions-open', 'versions-dialog'], ['details-open', 'details-dialog'], ['capture-open', 'capture-dialog']]) query_element(`#${button_id}`).addEventListener('click', () => query_element(`#${dialog_id}`).showModal());
for (const close_button of document.querySelectorAll('[data-close-dialog]')) close_button.addEventListener('click', () => close_button.closest('dialog').close());
query_element('#inspect-toggle').addEventListener('click', () => {
  inspection_mode = query_element('#reason-panel').hidden;
  query_element('#inspect-toggle').setAttribute('aria-pressed', String(inspection_mode));
  query_element('#reason-panel').hidden = !inspection_mode;
  render_comparison();
});
query_element('#layer-back').addEventListener('click', () => {
  query_element('#layer-list').hidden = false;
  query_element('#layer-editor').hidden = true;
  query_element('#layer-back').hidden = true;
});
query_element('#reason-close').addEventListener('click', () => {
  inspection_mode = false;
  query_element('#reason-panel').hidden = true;
  query_element('#inspect-toggle').setAttribute('aria-pressed', 'false');
  for (const hit_button of stage_element.querySelectorAll('.history-player__hotspot')) hit_button.hidden = true;
  render_player_hint();
});
query_element('#notes-version').addEventListener('change', render_notes);
toggle_button.addEventListener('click', () => start_playback(progress_value === 0 ? 1 : progress_value === 1 ? 0 : 1 - destination_value));
play_button.addEventListener('click', () => { if (frame_request) stop_playback(); else start_playback(progress_value === 1 ? 0 : progress_value === 0 ? 1 : destination_value); });
progress_input.addEventListener('input', () => { stop_playback(); update_progress(Number(progress_input.value) / 1000); });
query_element('#blueprint-toggle').addEventListener('click', () => { blueprint_mode = !blueprint_mode; query_element('#blueprint-toggle').setAttribute('aria-pressed', String(blueprint_mode)); render_comparison(); });
query_element('#layer-list').addEventListener('click', (click_event) => { const layer_button = click_event.target.closest('[data-pair-index]'); if (layer_button) open_layer_editor(layer_pairs[Number(layer_button.dataset.pairIndex)]); });
function set_presentation(presenting_state) {
  player_element.classList.toggle('is-presenting', presenting_state);
  query_element('#present-toggle').textContent = presenting_state ? 'Exit fullscreen' : 'Fullscreen';
  query_element('#present-toggle').setAttribute('aria-pressed', String(presenting_state));
}
query_element('#present-toggle').addEventListener('click', async () => {
  if (player_element.classList.contains('is-presenting')) { if (document.fullscreenElement) await document.exitFullscreen(); set_presentation(false); }
  else { set_presentation(true); await player_element.requestFullscreen?.().catch(() => {}); }
});
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) set_presentation(false); });
document.addEventListener('keydown', (key_event) => { if (key_event.key === 'Escape' && !document.querySelector('dialog[open]')) { set_presentation(false); query_element('#layer-annotation').hidden = true; } });
window.addEventListener('beforeunload', (unload_event) => { if (note_drafts.size || reason_drafts.size) { unload_event.preventDefault(); unload_event.returnValue = ''; } });
for (const select_element of document.querySelectorAll('[data-jurenites-select]')) enable_custom_select(select_element);
monospace_numbers(document.body);
load_history().catch((load_error) => show_status(load_error.message));
