import { component_status_markup } from '../stories/organisms/component-status/component-status.markup.js';
import { escape_html } from '../stories/template.js';
import { review_panel_markup, connect_review_panel } from './review-panel.js';
import { enable_custom_select } from '../slice/src/js/script.js';
let dashboard_data;
let review_busy = false;
let review_dirty = false;
let refresh_in_flight = false;
let refresh_timer;
let disconnect_review;
const REFRESH_INTERVAL_MS = 60000;
const search_input = document.querySelector('#component-search');
const status_filter = document.querySelector('#status-filter');
enable_custom_select(status_filter);
const component_list = document.querySelector('#component-catalogue');
const details_panel = document.querySelector('#component-details');
const CHECK_LABELS = { passed: 'Passed', failed: 'Failed', blocked: 'Blocked', not_checked: 'Not checked', missing: 'Missing' };

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
  const status_label = check_result.is_stale ? `Stale · last result ${CHECK_LABELS[check_result.status].toLowerCase()}` : CHECK_LABELS[check_result.status];
  const light_state = check_result.is_stale || ['blocked', 'not_checked', 'missing'].includes(check_result.status) ? 'attention' : check_result.status;
  const artifact_content = (check_result.artifacts ?? []).map((artifact_item) => {
    const artifact_url = safe_link(`/${artifact_item.artifact_path}`);
    return `<a class="status-dashboard__artifact" href="${artifact_url}" target="_blank" rel="noopener"><img src="${artifact_url}" alt="${escape_html(artifact_item.artifact_label)}" loading="lazy"><span>${escape_html(artifact_item.artifact_label)}</span></a>`;
  }).join('');
  return `<article class="status-dashboard__check"><div class="status-dashboard__check-heading"><h3>${escape_html(check_result.check_label)}</h3><span><i class="component-status__light component-status__light--${light_state}" aria-hidden="true"></i>${escape_html(status_label)}</span></div><p>${escape_html(check_result.message)}</p>${check_result.is_stale ? '<p>Run again against the current source before relying on this result.</p>' : ''}<p class="status-dashboard__meta">${escape_html(report_time(check_result.checked_at))}${check_result.source_name ? ` · ${escape_html(check_result.source_name)}` : ''}${check_result.source_commit ? ` · ${escape_html(check_result.source_commit.slice(0, 8))}${check_result.source_dirty ? ' + working changes' : ''}` : ''}</p>${check_result.details ? `<details><summary>Technical evidence</summary><pre><code>${escape_html(JSON.stringify(check_result.details, null, 2))}</code></pre></details>` : ''}${artifact_content ? `<div class="status-dashboard__artifacts">${artifact_content}</div>` : ''}</article>`;
}
function render_catalogue() {
  if (!dashboard_data) return;
  const search_text = search_input.value.trim().toLowerCase();
  const component_rows = dashboard_data.components.filter((component_row) =>
    `${component_row.component_name} ${component_row.component_group}`.toLowerCase().includes(search_text)
    && (status_filter.value === 'all' || component_row.overall_status === status_filter.value));
  component_list.innerHTML = component_status_markup({ component_rows });
  document.querySelector('#catalogue-count').textContent = `${component_rows.length} of ${dashboard_data.components.length} components`;
  mark_selected_component();
  document.querySelector('#empty-results').hidden = component_rows.length !== 0;
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
  try { component_id = decodeURIComponent(window.location.hash.slice(1)); } catch { component_id = ''; }
  const component_row = dashboard_data.components.find((row_item) => row_item.component_id === component_id);
  disconnect_review?.();
  disconnect_review = undefined;
  mark_selected_component();
  document.querySelector('#selection-placeholder').hidden = Boolean(component_row);
  details_panel.hidden = !component_row;
  if (!component_row) return;
  const case_config = { ...dashboard_data.case_config[component_id], ...dashboard_data.review_cases?.[component_id] };
  let figma_preview = '';
  if (case_config.figma_url) {
    const figma_link = new URL(case_config.figma_url);
    if (figma_link.hostname === 'www.figma.com' && figma_link.pathname.startsWith('/design/')) {
      figma_link.hostname = 'embed.figma.com';
      figma_link.searchParams.set('embed-host', 'jurenites-component-status');
      figma_link.searchParams.set('viewport-controls', 'true');
      figma_link.searchParams.set('footer', 'true');
      figma_preview = `<details class="status-dashboard__preview"><summary>Live Figma reference</summary><p>Interactive Figma frame. Use its zoom controls or fullscreen to inspect the design. Its zoom is independent of the 100% captures above.</p><iframe src="${safe_link(figma_link.href)}" title="${escape_html(component_row.component_name)} in Figma" loading="lazy" allowfullscreen></iframe></details>`;
    }
  }
  details_panel.innerHTML = `<p class="status-dashboard__eyebrow">${escape_html(component_row.component_group)}</p><h2 id="detail-heading">${escape_html(component_row.component_name)}</h2>${review_panel_markup(component_row, case_config, dashboard_data.review_cases?.[component_id])}<details class="status-dashboard__recorded"><summary>Recorded checks &amp; capture evidence</summary>${component_row.checks.map(check_markup).join('')}</details>${figma_preview}`;
  review_dirty = false;
  details_panel.querySelector('#visual-review-form').addEventListener('input', () => { review_dirty = true; });
  disconnect_review = connect_review_panel({ component_row, saved_case: dashboard_data.review_cases?.[component_id], review_token: dashboard_data.review_token, refresh_results, set_busy: (busy_value) => { review_busy = busy_value; } });
  if (move_focus) details_panel.focus({ preventScroll: true });
}
async function refresh_results(force_refresh = false) {
  if (review_busy || refresh_in_flight || (document.hidden && force_refresh !== true)) return;
  refresh_in_flight = true;
  const refresh_button = document.querySelector('#refresh-results');
  refresh_button.disabled = true;
  try {
    const response_data = await fetch('/api/status', { cache: 'no-store' });
    if (!response_data.ok) throw new Error('Reports unavailable. Run npm run status:build, then refresh.');
    const next_dashboard_data = await response_data.json();
    const unchanged_results = dashboard_data && JSON.stringify([dashboard_data.components, dashboard_data.pipeline_checks, dashboard_data.report_errors, dashboard_data.case_config, dashboard_data.review_cases]) === JSON.stringify([next_dashboard_data.components, next_dashboard_data.pipeline_checks, next_dashboard_data.report_errors, next_dashboard_data.case_config, next_dashboard_data.review_cases]);
    dashboard_data = next_dashboard_data;
    if (unchanged_results && force_refresh !== true) {
      document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
      return;
    }
    const passed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'passed').length;
    const failed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'failed').length;
    const unchecked_count = dashboard_data.components.filter((row_item) => row_item.checks.every((check_result) => ['not_checked', 'missing'].includes(check_result.status))).length;
    const attention_count = dashboard_data.components.length - passed_count - failed_count - unchecked_count;
    document.querySelector('#status-summary').textContent = `${dashboard_data.components.length} components · ${passed_count} passed · ${failed_count} failed · ${attention_count} need attention · ${unchecked_count} not checked`;
    document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
    const error_panel = document.querySelector('#report-errors');
    error_panel.hidden = !dashboard_data.report_errors.length;
    error_panel.textContent = dashboard_data.report_errors.join(' ');
    document.querySelector('#pipeline-results').innerHTML = dashboard_data.pipeline_checks.length ? dashboard_data.pipeline_checks.map(check_markup).join('') : '<p>No pipeline reports have been imported. CI and troubleshooting checks can use the same report format.</p>';
    render_catalogue();
    if (!review_dirty || force_refresh === true) render_details();
  } catch (request_error) {
    dashboard_data = undefined;
    component_list.replaceChildren();
    if (!review_dirty) details_panel.hidden = true;
    document.querySelector('#pipeline-results').textContent = 'Current results unavailable.';
    document.querySelector('#status-summary').textContent = request_error.message;
  } finally { refresh_in_flight = false; refresh_button.disabled = false; }
}
document.querySelector('#show-all-components').addEventListener('click', () => {
  search_input.value = '';
  status_filter.value = 'all';
  status_filter.dispatchEvent(new Event('change', { bubbles: true }));
  render_catalogue();
});
search_input.addEventListener('input', render_catalogue);
status_filter.addEventListener('change', render_catalogue);
document.querySelector('#refresh-results').addEventListener('click', () => refresh_results(true));
window.addEventListener('hashchange', () => render_details(true));
component_list.addEventListener('click', (click_event) => {
  const component_link = click_event.target.closest('[data-component-id]');
  if (component_link && window.location.hash === `#${component_link.dataset.componentId}`) render_details(true);
});
await refresh_results();

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
