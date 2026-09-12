import { component_status_markup } from '../stories/organisms/component-status/component-status.markup.js';
import { escape_html } from '../stories/template.js';
let dashboard_data;
const search_input = document.querySelector('#component-search');
const status_filter = document.querySelector('#status-filter');
const component_list = document.querySelector('#component-catalogue');
const details_panel = document.querySelector('#component-details');
const CHECK_LABELS = { passed: 'Passed', failed: 'Failed', blocked: 'Blocked', not_checked: 'Not checked' };

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
  const light_state = check_result.is_stale || ['blocked', 'not_checked'].includes(check_result.status) ? 'attention' : check_result.status;
  const artifact_content = (check_result.artifacts ?? []).map((artifact_item) => {
    const artifact_url = safe_link(`/${artifact_item.artifact_path}`);
    return `<a class="status-dashboard__artifact" href="${artifact_url}" target="_blank" rel="noopener"><img src="${artifact_url}" alt="${escape_html(artifact_item.artifact_label)}" loading="lazy"><span>${escape_html(artifact_item.artifact_label)}</span></a>`;
  }).join('');
  return `<article class="status-dashboard__check"><div class="status-dashboard__check-heading"><h3>${escape_html(check_result.check_label)}</h3><span><i class="component-status__light component-status__light--${light_state}" aria-hidden="true"></i>${escape_html(status_label)}</span></div><p>${escape_html(check_result.message)}</p>${check_result.is_stale ? '<p>Run again against the current source before relying on this result.</p>' : ''}<p class="status-dashboard__meta">${escape_html(report_time(check_result.checked_at))}${check_result.source_name ? ` · ${escape_html(check_result.source_name)}` : ''}${check_result.source_commit ? ` · ${escape_html(check_result.source_commit.slice(0, 8))}${check_result.source_dirty ? ' + working changes' : ''}` : ''}</p>${check_result.details ? `<details><summary>Technical evidence</summary><pre>${escape_html(JSON.stringify(check_result.details, null, 2))}</pre></details>` : ''}${artifact_content ? `<div class="status-dashboard__artifacts">${artifact_content}</div>` : ''}</article>`;
}
function render_catalogue() {
  if (!dashboard_data) return;
  const search_text = search_input.value.trim().toLowerCase();
  const component_rows = dashboard_data.components.filter((component_row) =>
    `${component_row.component_name} ${component_row.component_group}`.toLowerCase().includes(search_text)
    && (status_filter.value === 'all' || component_row.overall_status === status_filter.value));
  component_list.innerHTML = component_status_markup({ component_rows });
  document.querySelector('#empty-results').hidden = component_rows.length !== 0;
}
function render_details(move_focus = false) {
  if (!dashboard_data) return;
  let component_id;
  try { component_id = decodeURIComponent(window.location.hash.slice(1)); } catch { component_id = ''; }
  const component_row = dashboard_data.components.find((row_item) => row_item.component_id === component_id);
  details_panel.hidden = !component_row;
  if (!component_row) return;
  const case_config = dashboard_data.case_config[component_id] ?? {};
  const story_url = `/storybook/iframe.html?id=${encodeURIComponent(component_row.story_ids[0])}&viewMode=story`;
  const source_links = [`<a href="${story_url}" target="_blank" rel="noopener">Open Storybook ↗</a>`];
  if (case_config.drupal_url && safe_link(case_config.drupal_url)) source_links.push(`<a href="${safe_link(case_config.drupal_url)}" target="_blank" rel="noopener">Open Drupal ↗</a>`);
  if (case_config.figma_url && safe_link(case_config.figma_url)) source_links.push(`<a href="${safe_link(case_config.figma_url)}" target="_blank" rel="noopener">Open Figma ↗</a>`);
  let figma_preview = '';
  if (case_config.figma_url) {
    const figma_link = new URL(case_config.figma_url);
    if (figma_link.hostname === 'www.figma.com' && figma_link.pathname.startsWith('/design/')) {
      figma_link.hostname = 'embed.figma.com';
      figma_link.searchParams.set('embed-host', 'jurenites-component-status');
      figma_preview = `<details class="status-dashboard__preview"><summary>Live Figma reference</summary><p>This live view may require Figma access. It is not an exported pixel baseline. Use the source link above if embedding is unavailable.</p><iframe src="${safe_link(figma_link.href)}" title="${escape_html(component_row.component_name)} in Figma" loading="lazy"></iframe></details>`;
    }
  }
  details_panel.innerHTML = `<p class="status-dashboard__eyebrow">${escape_html(component_row.component_group)}</p><h2 id="detail-heading">${escape_html(component_row.component_name)}</h2><nav class="status-dashboard__source-links" aria-label="Component sources">${source_links.join('')}</nav><div>${component_row.checks.map(check_markup).join('')}</div><details class="status-dashboard__preview"><summary>Live Storybook preview</summary><p>This preview uses the story’s default example. Captures above record the exact data tested.</p><iframe src="${story_url}" title="${escape_html(component_row.component_name)} in Storybook" loading="lazy"></iframe></details>${figma_preview}<p class="status-dashboard__meta">Drupal’s same-origin frame policy keeps the live page in a separate tab. The screenshots above show the tested component.</p>`;
  if (move_focus) details_panel.focus();
}
async function refresh_results() {
  const refresh_button = document.querySelector('#refresh-results');
  refresh_button.disabled = true;
  try {
    const response_data = await fetch('/api/status', { cache: 'no-store' });
    if (!response_data.ok) throw new Error('Reports unavailable. Run npm run status:build, then refresh.');
    const next_dashboard_data = await response_data.json();
    const unchanged_results = dashboard_data && JSON.stringify([dashboard_data.components, dashboard_data.pipeline_checks, dashboard_data.report_errors, dashboard_data.case_config]) === JSON.stringify([next_dashboard_data.components, next_dashboard_data.pipeline_checks, next_dashboard_data.report_errors, next_dashboard_data.case_config]);
    dashboard_data = next_dashboard_data;
    if (unchanged_results) {
      document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
      return;
    }
    const passed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'passed').length;
    const failed_count = dashboard_data.components.filter((row_item) => row_item.overall_status === 'failed').length;
    const unchecked_count = dashboard_data.components.filter((row_item) => row_item.checks.every((check_result) => check_result.status === 'not_checked')).length;
    const attention_count = dashboard_data.components.length - passed_count - failed_count - unchecked_count;
    document.querySelector('#status-summary').textContent = `${dashboard_data.components.length} components · ${passed_count} passed · ${failed_count} failed · ${attention_count} need attention · ${unchecked_count} not checked`;
    document.querySelector('#updated-time').textContent = `Reports refreshed ${report_time(dashboard_data.refreshed_at)}`;
    const error_panel = document.querySelector('#report-errors');
    error_panel.hidden = !dashboard_data.report_errors.length;
    error_panel.textContent = dashboard_data.report_errors.join(' ');
    document.querySelector('#pipeline-results').innerHTML = dashboard_data.pipeline_checks.length ? dashboard_data.pipeline_checks.map(check_markup).join('') : '<p>No pipeline reports have been imported. CI and troubleshooting checks can use the same report format.</p>';
    render_catalogue();
    render_details();
  } catch (request_error) {
    dashboard_data = undefined;
    component_list.replaceChildren();
    details_panel.hidden = true;
    document.querySelector('#pipeline-results').textContent = 'Current results unavailable.';
    document.querySelector('#status-summary').textContent = request_error.message;
  } finally { refresh_button.disabled = false; }
}
search_input.addEventListener('input', render_catalogue);
status_filter.addEventListener('change', render_catalogue);
document.querySelector('#refresh-results').addEventListener('click', refresh_results);
window.addEventListener('hashchange', () => render_details(true));
component_list.addEventListener('click', (click_event) => {
  const component_link = click_event.target.closest('[data-component-id]');
  if (component_link && window.location.hash === `#${component_link.dataset.componentId}`) render_details(true);
});
await refresh_results();
setInterval(refresh_results, 30000);
