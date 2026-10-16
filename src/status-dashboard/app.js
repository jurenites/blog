import { connect_workspace, read_component_workspace } from './workspace.js';
import { status_label_markup } from './status-mark.js';
import { button_matrix_markup, connect_button_matrix } from './button-matrix.js';
import { button_link_markup } from '../stories/atoms/button/button.markup.js';
import { monospace_numbers } from './testing-ui.js';
import { component_status_markup, connect_component_groups } from '../stories/organisms/component-status/component-status.markup.js';
import { icon_button_markup } from '../stories/atoms/icon-button/icon-button.markup.js';
import { icon_markup } from '../stories/atoms/icon/icon.markup.js';
import { escape_html } from '../stories/template.js';
import { review_panel_markup, connect_review_panel } from './review-panel.js';
import { connect_public_review } from './public-review.js';
import { chip_markup } from '../stories/atoms/chip/chip.markup.js';
const public_mode = document.documentElement.dataset.dashboardMode === 'public';
let dashboard_data;
function component_workspace(component_id) {
  const saved_state = dashboard_data.workspaces?.[component_id] ?? {};
  return public_mode ? saved_state : read_component_workspace(component_id, saved_state);
}
let review_busy = false;
let review_dirty = false;
let refresh_in_flight = false;
let refresh_timer;
let disconnect_review;
let disconnect_workspace;
const REFRESH_INTERVAL_MS = 60000;
const search_input = document.querySelector('#component-search');
const status_filter = document.querySelector('#status-filter');
const selected_statuses = new Set(['passed', 'attention', 'failed']);
status_filter.innerHTML = [['passed', 'Passed'], ['attention', 'Attention'], ['failed', 'Failed']].map(([status_key, chip_label]) => chip_markup({ chip_label, is_selectable: true, is_selected: true }).replace('<button', `<button data-status-filter="${status_key}"`)).join('');
const component_list = document.querySelector('#component-catalogue');
const collapsed_groups = new Set();
const details_panel = document.querySelector('#component-details');

function decorate_disclosures() {
  for (const summary_element of document.querySelectorAll('summary')) {
    if (summary_element.querySelector('.status-dashboard__disclosure-button')) continue;
    const details_element = summary_element.parentElement;
    const disclosure_label = summary_element.textContent.trim();
    summary_element.insertAdjacentHTML('beforeend', icon_button_markup({ button_accessible_label: `Toggle ${disclosure_label}`, style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'chevron-down', class_name: 'status-dashboard__disclosure-icon' }), additional_class_names: 'status-dashboard__disclosure-button' }));
    const disclosure_button = summary_element.querySelector('.status-dashboard__disclosure-button');
    disclosure_button.setAttribute('aria-expanded', String(details_element.open));
    disclosure_button.addEventListener('click', click_event => {
      click_event.preventDefault();
      click_event.stopPropagation();
      details_element.open = !details_element.open;
    });
    details_element.addEventListener('toggle', () => disclosure_button.setAttribute('aria-expanded', String(details_element.open)));

  }
}
function safe_link(link_value) {
  if (!link_value) return '';
  try {
    const parsed_url = new URL(link_value, window.location.origin);
    return ['http:', 'https:'].includes(parsed_url.protocol) ? escape_html(parsed_url.href) : '';
  } catch { return ''; }
}
function report_time(date_value) {
  return date_value ? new Date(date_value).toLocaleString() : 'No recorded run';
}
function check_markup(check_result) {
  const status_key = check_result.is_stale ? 'stale' : check_result.status;
  const artifact_content = (check_result.artifacts ?? []).map((artifact_item) => {
    const artifact_url = safe_link(`/${artifact_item.artifact_path}`);
    return `<a class="status-dashboard__artifact" href="${artifact_url}" target="_blank" rel="noopener"><img src="${artifact_url}" alt="${escape_html(artifact_item.artifact_label)}" loading="lazy"><span>${escape_html(artifact_item.artifact_label)}</span></a>`;
  }).join('');
  return `<article class="status-dashboard__check"><div class="status-dashboard__check-heading"><h3>${escape_html(check_result.check_label)}</h3>${status_label_markup(status_key)}</div><p>${escape_html(check_result.message)}</p><p class="status-dashboard__meta">${escape_html(report_time(check_result.checked_at))}${check_result.source_name ? ` · ${escape_html(check_result.source_name)}` : ''}${check_result.source_commit ? ` · ${escape_html(check_result.source_commit.slice(0, 8))}${check_result.source_dirty ? ' + working changes' : ''}` : ''}</p>${check_result.details ? `<details><summary>Technical evidence</summary><pre><code>${escape_html(JSON.stringify(check_result.details, null, 2))}</code></pre></details>` : ''}${artifact_content ? `<div class="status-dashboard__artifacts">${artifact_content}</div>` : ''}</article>`;
}
function catalogue_rows() {
  const saved_targets = (dashboard_data.history_targets ?? []).filter((target_row) => !dashboard_data.components.some((component_row) => component_row.component_id === target_row.target_id));
  const source_rows = dashboard_data.components.map(component_row => ({ ...component_row, source_case: {
    ...dashboard_data.case_config[component_row.component_id],
    ...dashboard_data.review_cases?.[component_row.component_id],
    ...component_workspace(component_row.component_id).draft_case,
  } }));
  return [...source_rows, ...saved_targets.map((target_row) => ({ component_id: `history-${target_row.target_id}`, component_name: target_row.target_label, component_group: target_row.target_scope === 'page' ? 'Pages' : 'Organisms', history_target: target_row, checks: [], overall_status: 'attention' }))];
}
function detail_history_markup(component_row) {
  const root_group = component_row.component_group.split('/')[0].trim();
  if (!['Organisms', 'Pages', 'Components'].includes(root_group)) return '';
  const target_data = component_row.history_target ?? { target_id: component_row.component_id, target_label: component_row.component_name, target_scope: root_group === 'Pages' ? 'page' : 'organism' };
  const route_parameters = new URLSearchParams({ target: target_data.target_id, target_label: target_data.target_label, scope: target_data.target_scope, component: component_row.component_id });
  return button_link_markup({ button_label: 'Before / After', link_url: `/history.html?${route_parameters}`, style_variant: 'secondary', additional_class_names: 'status-dashboard__history-link' });
}
function render_catalogue() {
  if (!dashboard_data) return;
  const search_text = search_input.value.trim().toLowerCase();
  const component_rows = catalogue_rows().filter((component_row) =>
    `${component_row.component_name} ${component_row.component_group}`.toLowerCase().includes(search_text)
    && (selected_statuses.size === 3 || (!component_row.history_target && selected_statuses.has(['passed', 'failed'].includes(component_row.overall_status) ? component_row.overall_status : 'attention'))));
  component_list.innerHTML = component_status_markup({ component_rows, collapsed_groups: search_text ? new Set() : collapsed_groups });
  connect_component_groups(component_list, collapsed_groups);
  document.querySelector('#catalogue-count').textContent = `${component_rows.length} of ${catalogue_rows().length} entries`;
  mark_selected_component();
  document.querySelector('#empty-results').hidden = component_rows.length !== 0;
  monospace_numbers(component_list);
  monospace_numbers(document.querySelector('#catalogue-count'));
}
function mark_selected_component() {
  for (const component_link of component_list.querySelectorAll('[data-component-id]')) {
    if (component_link.hash === window.location.hash) component_link.setAttribute('aria-current', 'page');
    else component_link.removeAttribute('aria-current');
  }
}
function render_details(move_focus = false) {
  if (!dashboard_data) return;
  let component_id;
  try { component_id = decodeURIComponent(window.location.hash.slice(1)) || 'atoms-button'; } catch { component_id = ''; }
  const component_row = catalogue_rows().find((row_item) => row_item.component_id === component_id);
  disconnect_review?.();
  disconnect_workspace?.();
  disconnect_review = undefined;
  disconnect_workspace = undefined;
  mark_selected_component();
  document.querySelector('#selection-placeholder').hidden = Boolean(component_row);
  details_panel.hidden = !component_row;
  const capture_time = document.querySelector('#capture-time');
  const capture_date = component_row?.checks.find(check_item => check_item.check_key === 'storybook')?.checked_at;
  capture_time.hidden = !capture_date;
  capture_time.textContent = capture_date ? new Date(capture_date).toLocaleString('en-GB') : '';
  if (capture_date) capture_time.dateTime = capture_date;
  else capture_time.removeAttribute('datetime');
  monospace_numbers(capture_time);
  if (!component_row) return;
  const layout_controls = component_row.history_target ? '' : `<div class="status-dashboard__layout-controls" role="group" aria-label="Comparison layout">${[['columns', 'Columns', 'column'], ['list', 'List', 'rows']].map(([layout_key, layout_label, icon_name]) => icon_button_markup({ button_accessible_label: layout_label, tooltip_label: layout_label, style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name, class_name: 'status-dashboard__layout-icon' }), additional_class_names: 'status-dashboard__layout-button' }).replace('<button', `<button data-comparison-layout="${layout_key}" aria-pressed="${layout_key === 'columns'}" aria-controls="review-preview-stage"`)).join('')}</div>`;
  const detail_heading = `<div class="status-dashboard__detail-heading"><div class="status-dashboard__detail-path">${layout_controls}<span class="status-dashboard__eyebrow">${escape_html(component_row.component_group)} /</span><h2 id="detail-heading">${escape_html(component_row.component_name)}</h2></div><div class="status-dashboard__detail-tools"><span class="visually-hidden" data-autosave-status role="status"></span><span id="detail-history-link" hidden>${detail_history_markup(component_row)}</span></div></div>`;
  if (component_row.history_target) {
    details_panel.innerHTML = `${detail_heading}<p>Saved design milestones for ${escape_html(component_row.component_name)}.</p>`;
    review_dirty = false;
    if (move_focus) details_panel.focus({ preventScroll: true });
    return;
  }

  const workspace_state = component_workspace(component_id);
  const effective_case = { ...dashboard_data.review_cases?.[component_id], ...workspace_state.draft_case };
  const case_config = { ...dashboard_data.case_config[component_id], ...effective_case };
  const matrix_markup = component_id === 'atoms-button' ? button_matrix_markup(component_row, workspace_state.matrix_state) : '';
  details_panel.innerHTML = `${detail_heading}${review_panel_markup(component_row, case_config, effective_case, matrix_markup)}<details class="status-dashboard__check-details" data-workspace-details="recorded-checks"><summary>Recorded checks</summary><section class="status-dashboard__recorded">${component_row.checks.map(check_result => check_markup({ ...check_result, artifacts: [] })).join('')}</section></details>`;
  const workspace_connection = public_mode ? { update_settings() {}, flush_settings() {}, current_state: () => workspace_state, disconnect() {} } : connect_workspace({ component_id, initial_state: workspace_state, review_token: dashboard_data.review_token, on_saved: saved_state => { dashboard_data.workspaces ??= {}; dashboard_data.workspaces[component_id] = saved_state; review_dirty = false; render_catalogue(); } });
  const save_settings = workspace_connection.update_settings;
  if (!public_mode && component_id === 'atoms-button') connect_button_matrix({ component_row, saved_state: workspace_state.matrix_state, save_settings });
  review_dirty = false;
  details_panel.querySelector('#visual-review-form').addEventListener('input', () => { review_dirty = true; });
  disconnect_review = public_mode ? connect_public_review({ component_row }) : connect_review_panel({ component_row, saved_case: effective_case, review_token: dashboard_data.review_token, refresh_results, set_busy: busy_value => { review_busy = busy_value; }, workspace_state, save_settings, flush_settings: workspace_connection.flush_settings });
  for (const detail_element of details_panel.querySelectorAll('details')) {
    detail_element.dataset.workspaceDetails ??= detail_element.querySelector('summary')?.textContent.trim() ?? '';
    if (Object.hasOwn(workspace_state.details_state ?? {}, detail_element.dataset.workspaceDetails)) detail_element.open = workspace_state.details_state[detail_element.dataset.workspaceDetails];
  }
  const disclosure_handler = toggle_event => {
    if (!(toggle_event.target instanceof HTMLDetailsElement)) return;
    const detail_element = toggle_event.target;
    const detail_key = detail_element.dataset.workspaceDetails;
    if (detail_key) save_settings({ details_state: { ...workspace_connection.current_state().details_state, [detail_key]: detail_element.open } });
  };
  details_panel.addEventListener('toggle', disclosure_handler, true);
  disconnect_workspace = () => { details_panel.removeEventListener('toggle', disclosure_handler, true); workspace_connection.disconnect(); };
  decorate_disclosures();
  monospace_numbers(details_panel);
  if (move_focus) details_panel.focus({ preventScroll: true });
}
async function refresh_results(force_refresh = false) {
  if (review_busy || refresh_in_flight || (document.hidden && force_refresh !== true)) return;
  refresh_in_flight = true;
  try {
    const response_data = await fetch(public_mode ? '/status.json' : '/api/status', { cache: 'no-store' });
    if (!response_data.ok) throw new Error(public_mode ? 'Published comparisons are unavailable. Please refresh later.' : 'Reports unavailable. Run npm run status:build, then refresh.');
    const next_dashboard_data = await response_data.json();
    const unchanged_results = dashboard_data && JSON.stringify([dashboard_data.components, dashboard_data.pipeline_checks, dashboard_data.report_errors, dashboard_data.case_config, dashboard_data.review_cases, dashboard_data.history_targets]) === JSON.stringify([next_dashboard_data.components, next_dashboard_data.pipeline_checks, next_dashboard_data.report_errors, next_dashboard_data.case_config, next_dashboard_data.review_cases, dashboard_data.history_targets]);
    dashboard_data = next_dashboard_data;
    if (unchanged_results && force_refresh !== true) {
      document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
      return;
    }
    const passed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'passed').length;
    const failed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'failed').length;
    const unchecked_count = dashboard_data.components.filter((row_item) => row_item.checks.every((check_result) => ['not_checked', 'missing'].includes(check_result.status))).length;
    const attention_count = dashboard_data.components.length - passed_count - failed_count - unchecked_count;
    document.querySelector('#status-summary').innerHTML = `${dashboard_data.components.length} components · <span class="status-dashboard__count status-dashboard__count--passed">${passed_count}</span> Passed · <span class="status-dashboard__count status-dashboard__count--failed">${failed_count}</span> Failed · <span class="status-dashboard__count status-dashboard__count--attention">${attention_count}</span> need attention · <span class="status-dashboard__count status-dashboard__count--unchecked">${unchecked_count}</span> not checked`;
    document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
    const error_panel = document.querySelector('#report-errors');
    error_panel.hidden = !dashboard_data.report_errors.length;
    error_panel.textContent = dashboard_data.report_errors.join(' ');
    document.querySelector('#pipeline-results').innerHTML = dashboard_data.pipeline_checks.length ? dashboard_data.pipeline_checks.map(check_markup).join('') : '<p>No pipeline reports have been imported. CI and troubleshooting checks can use the same report format.</p>';
    render_catalogue();
    decorate_disclosures();
    const active_editor = details_panel.contains(document.activeElement) && document.activeElement.matches('input, textarea, select');
    if ((!review_dirty && !active_editor) || force_refresh === true) render_details();
  } catch (request_error) {
    dashboard_data = undefined;
    document.querySelector('#capture-time').hidden = true;
    component_list.replaceChildren();
    if (!review_dirty) details_panel.hidden = true;
    document.querySelector('#pipeline-results').textContent = 'Current results unavailable.';
    document.querySelector('#status-summary').textContent = request_error.message;
  } finally { refresh_in_flight = false; monospace_numbers(document.querySelector('.status-dashboard__main')); }
}
search_input.addEventListener('input', render_catalogue);
status_filter.addEventListener('click', click_event => {
  const filter_button = click_event.target.closest('[data-status-filter]');
  if (!filter_button) return;
  const status_key = filter_button.dataset.statusFilter;
  if (selected_statuses.has(status_key)) selected_statuses.delete(status_key);
  else selected_statuses.add(status_key);
  filter_button.setAttribute('aria-pressed', String(selected_statuses.has(status_key)));
  render_catalogue();
});
window.addEventListener('hashchange', () => render_details(true));
component_list.addEventListener('click', (click_event) => {
  const component_link = click_event.target.closest('[data-component-id]');
  if (component_link && window.location.hash === `#${component_link.dataset.componentId}`) render_details(true);
});
// Restored/background tabs still need their initial catalogue before polling pauses.
await refresh_results(true);

function schedule_refresh() {
  clearInterval(refresh_timer);
  if (!document.hidden) refresh_timer = setInterval(refresh_results, REFRESH_INTERVAL_MS);
}
document.addEventListener('visibilitychange', () => {
  schedule_refresh();
  if (!document.hidden) void refresh_results();
});
window.addEventListener('pagehide', () => clearInterval(refresh_timer));
window.addEventListener('pageshow', schedule_refresh);
schedule_refresh();
