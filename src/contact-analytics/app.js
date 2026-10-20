import { button_markup, button_link_markup } from '../stories/atoms/button/button.markup.js';
import { select_input_markup } from '../stories/atoms/select-input/select-input.markup.js';
import { code_block_markup } from '../stories/atoms/code-block/code-block.markup.js';
import { initialize_custom_selects } from '../slice/src/js/script.js';
import { escape_html } from '../stories/template.js';
import { KPI_CATALOG } from './kpi-catalog.js';

const app_root = document.querySelector('#analytics-app');
let dashboard_data;
let current_view = 'overview';
let current_query = 'overview';
let request_sequence = 0;

function display_value(metric_value, value_suffix = '') {
  return metric_value === null || metric_value === undefined ? '—' : `${metric_value}${value_suffix}`;
}

function display_date(date_value) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Europe/Moscow' }).format(new Date(date_value));
}

function action_button(button_label, action_class, is_selected = false) {
  return button_markup({ button_label, button_type: 'button',
    style_variant: is_selected ? 'primary' : 'secondary',
    additional_class_names: action_class });
}

function metric_card(metric_title, metric_value, metric_note, card_class = '') {
  return `<article class="metric-card ${card_class}">
    <p class="metric-card__label">${escape_html(metric_title)}</p>
    <p class="metric-card__value">${escape_html(metric_value)}</p>
    <p class="metric-card__note">${escape_html(metric_note)}</p>
  </article>`;
}

function data_table(table_rows, column_labels) {
  if (!table_rows.length) return '<p class="empty-state">No rows in this report.</p>';
  const column_keys = Object.keys(column_labels || table_rows[0]);
  return `<div class="table-scroll"><table><thead><tr>${column_keys.map((column_key) =>
    `<th scope="col">${escape_html(column_labels?.[column_key] || column_key)}</th>`).join('')}</tr></thead>
    <tbody>${table_rows.map((table_row) => `<tr>${column_keys.map((column_key) =>
    `<td>${escape_html(display_value(table_row[column_key]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function overview_markup() {
  const report_data = dashboard_data.report_data;
  const overview_data = report_data.overview[0];
  const goal_data = report_data.goals[0];
  return `<section class="goal-panel">
    <div><p class="section-kicker">THE OUTCOME THAT MATTERS</p>
      <h2>Real conversations.<br>Not just form events.</h2>
      <p>Your primary KPI is the number of genuine enquiries received.<br>GA measures activity. Submission review establishes quality.</p></div>
    <div class="goal-panel__result"><span>Verified genuine contacts</span><strong>—</strong>
      <span class="status-label">REVIEW REQUIRED</span><p>No reviewed submission ledger imported.<br>Unknown does not mean zero.</p></div>
  </section>
  <section aria-labelledby="signals-heading">
    <div class="section-heading"><h2 id="signals-heading">Current GA summary</h2><span>All 18 reference KPIs follow below</span></div>
    <div class="metric-grid">
      ${metric_card('Active users', display_value(overview_data.active_users), `${display_value(overview_data.new_users)} new users in this reporting period`)}
      ${metric_card('Contact-page users', display_value(overview_data.contact_users), `${display_value(overview_data.contact_views)} views · exact page title: Contact | jurenites`)}
      ${metric_card('Contact-page reach', display_value(overview_data.contact_reach_percent, '%'), 'Contact-page active users ÷ site active users × 100')}
      ${metric_card('All-form submit events', display_value(overview_data.submit_events), `${display_value(overview_data.submit_users)} users · site-wide; form identity and acceptance unverified`, 'metric-card--caution')}
      ${metric_card('All-form user rate', display_value(overview_data.all_form_user_percent, '%'), 'Users with form_submit ÷ total users. A proxy, not genuine-contact conversion.', 'metric-card--caution')}
      ${metric_card('Engagement per active user', display_value(overview_data.engagement_seconds, 's'), `${display_value(overview_data.session_count)} sessions · ${display_value(overview_data.event_count)} events. Not time to contact.`)}
    </div>
  </section>
  <section aria-labelledby="priorities-heading">
    <div class="section-heading"><h2 id="priorities-heading">Contact first. Video and projects support it.</h2></div>
    <div class="metric-grid">
      ${metric_card('Contact confirmation users', display_value(goal_data.confirmation_users), 'Primary goal · users who opened /contact/confirmation. A completion proxy; genuine enquiries and delivery still need review.')}
      ${metric_card('Video-page users', display_value(goal_data.video_page_users), 'Supporting goal · page visits only. The event export contains no video_start, video_progress or video_complete rows; actual watching is unverified.')}
      ${metric_card('Project-detail views', display_value(goal_data.project_page_views), `Supporting goal · views of /portfolio/… pages, not unique readers. ${display_value(goal_data.portfolio_index_users)} users opened the portfolio index.`)}
    </div>
    <p class="report-footnote">Proposed meaningful actions: watch 50% of a video, or spend 30 active seconds on a project and reach 50% of its content. Track these separately, then measure how often each is followed by an accepted contact. These events are not implemented by this audit.</p>
  </section>
  ${catalog_markup()}
  <section class="report-panel"><div class="section-heading"><h2>Portfolio project evidence</h2><span>Page opens, not confirmed reading</span></div>
    ${data_table(report_data.journeys.filter((page_row) => page_row.page_path.startsWith('/portfolio/')), {
      page_path: 'Project path', page_views: 'Views', active_users: 'Active users', engagement_seconds: 'Engagement seconds / active user',
    })}
    <p class="report-footnote">Users can visit multiple projects; do not add these user counts. Engagement is a page-level average, not proof that a particular person finished reading.</p>
  </section>
  <section class="quality-panel" aria-labelledby="quality-heading">
    <p class="section-kicker">CONTACT QUALITY</p><h2 id="quality-heading">Keep spam out of the success metric</h2>
    ${dashboard_data.quality_notes.map((note_row) => `<p>${escape_html(note_row.note_text)}</p><small>Reported ${escape_html(note_row.reported_on)} · ${escape_html(note_row.evidence_source)}</small>`).join('') || '<p>No quality notes imported.</p>'}
    <p>Classify accepted submissions as genuine, spam, test, duplicate or unreviewed. Count genuine enquiries separately; do not subtract an undated message from this GA reporting period.</p>
  </section>
  <section class="report-columns">
    <article class="report-panel"><div class="section-heading"><h2>Where attention comes from</h2></div>
      <p>First-user acquisition and session acquisition are different scopes.</p>
      ${data_table(report_data.sources, { source_medium: 'Source / medium', first_user_active_users: 'First-user active users', session_count: 'Sessions', session_share_percent: 'Session share %' })}
      <p class="report-footnote">Direct traffic is unattributed traffic; it does not establish that someone typed the URL. Source or location alone does not establish bot activity.</p></article>
    <article class="report-panel"><div class="section-heading"><h2>What GA recorded</h2></div>
      <p>All reported event types for the selected period.</p>
      ${data_table(report_data.events, { event_name: 'Event', event_count: 'Count', total_users: 'Users' })}
    </article>
  </section>
  <section class="report-panel"><div class="section-heading"><h2>Pages that attracted attention</h2><span>Top pages captured from GA</span></div>
    ${data_table(report_data.pages, { page_title: 'Page title', page_views: 'Views', active_users: 'Active users', bounce_percent: 'GA4 bounce %' })}
    <p class="report-footnote">Page rows are not additive unique users. The Contact row is an exact title match and may exclude translated titles.</p>
  </section>
  <section class="next-steps"><p class="section-kicker">NEXT MEASUREMENT STEPS</p>
    <h2>Close the gap between a click and a conversation</h2>
    <ol><li>Review Drupal Contact results and label genuine, spam, test and duplicate submissions.</li>
    <li>Verify the contact form identifier and record a success event only after server acceptance. Check email delivery separately.</li>
    <li>Define consented attribution before linking enquiries to GA users. Exclude internal tests and preserve unknown attribution.</li></ol>
    <p>The GA overview showed no key-event data. Tracking and property settings have not been changed by this dashboard.</p>
  </section>`;
}

function catalog_measurement(metric_key) {
  const overview_data = dashboard_data.report_data.overview[0];
  const goal_data = dashboard_data.report_data.goals[0];
  const cohort_data = dashboard_data.report_data.retention.find((cohort_row) => cohort_row.day_one_percent !== null);
  const has_window = goal_data.daily_users !== null && goal_data.monthly_users !== null;
  const measurement_map = {
    bounce_percent: {
      metric_value: display_value(overview_data.bounce_percent, '%'),
      value_context: overview_data.bounce_percent === null ? '' : `${overview_data.bounced_sessions} bounced / ${overview_data.session_count} sessions · ${overview_data.engaged_sessions} engaged`,
    },
    active_windows: {
      metric_value: has_window ? `${goal_data.daily_users} / ${goal_data.monthly_users}` : '—',
      value_context: has_window ? `DAU / MAU ending ${display_date(overview_data.end_date)}. MAU covers the trailing 30 days, not the 28-day overview.` : '',
    },
    stickiness_percent: {
      metric_value: display_value(goal_data.stickiness_percent, '%'),
      value_context: has_window ? `${goal_data.daily_users} daily / ${goal_data.monthly_users} monthly active users, ending ${display_date(overview_data.end_date)}.` : '',
    },
    retention_example: {
      metric_value: display_value(cohort_data?.day_one_percent, '%'),
      value_context: cohort_data ? `Day-1 return for the ${display_date(cohort_data.cohort_date)} cohort (${cohort_data.new_users} new users). Day-7 return: ${display_value(cohort_data.day_seven_percent, '%')}. Small cohort; not an overall retention rate.` : '',
    },
    contact_conversion: {
      metric_value: '—',
      value_context: `Evidence: ${display_value(overview_data.submit_users)} all-form submit users; ${display_value(goal_data.confirmation_users)} confirmation-page users. Their overlap and enquiry quality have not been verified.`,
    },
    contact_success: {
      metric_value: '—',
      value_context: `Evidence: ${display_value(goal_data.confirmation_users)} confirmation-page users. The export has no contact-specific server-success event.`,
    },
    content_adoption: {
      metric_value: '—',
      value_context: `Evidence: ${display_value(goal_data.video_page_users)} video-page users; ${display_value(goal_data.project_page_views)} project-detail views. These are page-open proxies.`,
    },
  };
  return measurement_map[metric_key] ?? { metric_value: '—', value_context: '' };
}

function catalog_markup() {
  return `<section><div class="section-heading"><div><p class="section-kicker">THE REFERENCE, ADAPTED</p>
    <h2>18 KPIs for a contact-led website</h2></div><span>Definitions, formulas &amp; data gaps</span></div>
    <p class="intro-note">All 18 KPIs reviewed against your goals: contact first, then video watching and portfolio reading. Measured values show their scope; proxies and proposed tracking are labelled. Revenue KPIs stay outside the current targets.</p>
    <div class="metric-grid">${KPI_CATALOG.map(([metric_title, metric_status, metric_formula, metric_note, metric_key], metric_index) => {
    const { metric_value, value_context } = catalog_measurement(metric_key);
    const has_value = metric_value !== '—';
    return `<article class="metric-card catalog-card"><p class="metric-card__label"><span>${String(metric_index + 1).padStart(2, '0')}</span>${escape_html(metric_title)}</p>
      <p class="catalog-card__status">${escape_html(has_value ? 'Verified GA evidence · scope below' : metric_status)}</p><strong class="catalog-card__empty">${escape_html(metric_value)}</strong>
      ${value_context ? `<p class="metric-card__note">${escape_html(value_context)}</p>` : ''}
      <div class="catalog-card__formula"><small>FORMULA</small><code>${escape_html(metric_formula)}</code></div>
      <p class="metric-card__note">${escape_html(metric_note)}</p></article>`;
  }).join('')}</div>
    <p class="report-footnote">Definitions checked against <a href="https://support.google.com/analytics/answer/12195621">GA4 engagement and bounce rate</a> and <a href="https://support.google.com/analytics/answer/9234069">automatically collected events</a>.</p></section>`;
}

function sql_markup() {
  return `<section class="sql-panel"><p class="section-kicker">LOCAL SQLITE · READ ONLY</p><h2>See how the numbers are made</h2>
    <p>These saved queries run against your local database. The selected report is bound as a parameter; periods are never summed.</p>
    <div class="query-actions">${Object.keys(dashboard_data.saved_queries).map((query_name) =>
      action_button(query_name, `query-choice query-choice--${query_name}`, query_name === current_query)).join('')}</div>
    ${code_block_markup({ snippet_text: dashboard_data.saved_queries[current_query], code_language: 'sql' })}
    <p>Bound parameter <code>:report_id = ${escape_html(dashboard_data.report_data.overview[0].report_id)}</code></p>
    ${data_table(dashboard_data.report_data[current_query])}
    ${button_link_markup({ button_label: 'Open SQL file', link_url: '/queries.sql', style_variant: 'secondary' })}
  </section>`;
}

function render_dashboard() {
  if (!dashboard_data.report_data) {
    app_root.innerHTML = '<section class="empty-state"><h1>Contact KPI</h1><p>No report imported yet.</p><p>Run <code>npm run analytics:import -- /absolute/path/snapshot.json</code>, then reload.</p></section>';
    return;
  }
  const overview_data = dashboard_data.report_data.overview[0];
  const period_labels = dashboard_data.report_periods.map((period_data) =>
    `${display_date(period_data.start_date)} – ${display_date(period_data.end_date)}`);
  const selected_index = dashboard_data.report_periods.findIndex((period_data) => period_data.report_id === overview_data.report_id);
  app_root.innerHTML = `<header class="top-bar"><span class="brand-name">jurenites<span> / KPI</span></span><span class="local-label">LOCAL DATABASE · PRIVATE</span></header>
    <div class="dashboard-shell"><header class="page-heading"><div><p class="section-kicker">JURENITES.COM / AUDIENCE &amp; CONTACTS</p>
      <h1>Contact KPI</h1><p>Understand reach. Measure intent. Verify the conversation.</p></div>
      <div class="period-picker"><label for="report-period">Reporting period</label>${select_input_markup({
    field_id: 'report-period', field_name: 'report_period', option_items: period_labels,
    selected_value: period_labels[selected_index],
  })}</div></header>
    <div class="source-strip"><span>GA4 snapshot · ${escape_html(overview_data.property_name)}</span><span>Captured ${escape_html(display_date(overview_data.captured_at))} · manual import, not live sync</span></div>
    <nav class="view-navigation" aria-label="Dashboard views">
      ${action_button('Overview', 'view-choice view-choice--overview', current_view === 'overview')}
      ${action_button('18 KPI cards', 'view-choice view-choice--catalog', current_view === 'catalog')}
      ${action_button('SQL & data', 'view-choice view-choice--sql', current_view === 'sql')}
    </nav>
    <div id="report-content">${current_view === 'overview' ? overview_markup() : current_view === 'catalog' ? catalog_markup() : sql_markup()}</div>
    <footer class="page-footer"><span>Google Analytics → local SQLite → saved SQL → this page</span>
      ${button_link_markup({ button_label: 'Open source report', link_url: overview_data.source_url, style_variant: 'secondary' })}</footer></div>`;
  document.querySelector('#report-period').addEventListener('change', (change_event) => {
    load_dashboard(dashboard_data.report_periods[change_event.target.selectedIndex].report_id);
  });
  initialize_custom_selects(app_root);
  for (const view_name of ['overview', 'catalog', 'sql']) {
    const view_button = document.querySelector(`.view-choice--${view_name}`);
    view_button.setAttribute('aria-pressed', String(current_view === view_name));
    view_button.addEventListener('click', () => {
      current_view = view_name;
      render_dashboard();
      document.querySelector(`.view-choice--${view_name}`).focus();
    });
  }
  for (const query_name of Object.keys(dashboard_data.saved_queries)) {
    const query_button = document.querySelector(`.query-choice--${query_name}`);
    if (!query_button) continue;
    query_button.setAttribute('aria-pressed', String(current_query === query_name));
    query_button.addEventListener('click', () => {
      current_query = query_name;
      render_dashboard();
      document.querySelector(`.query-choice--${query_name}`).focus();
    });
  }
}

async function load_dashboard(report_id = '') {
  const request_id = ++request_sequence;
  try {
    const response_data = await fetch(`/api/dashboard?report_id=${encodeURIComponent(report_id)}`);
    if (!response_data.ok) throw new Error('The local database could not be loaded.');
    const loaded_data = await response_data.json();
    if (request_id !== request_sequence) return;
    dashboard_data = loaded_data;
    render_dashboard();
  } catch (request_error) {
    if (request_id !== request_sequence) return;
    app_root.innerHTML = `<section class="empty-state" role="alert"><h1>Report unavailable</h1><p>${escape_html(request_error.message)}</p><p>Check the local server and reload the page.</p></section>`;
  }
}
load_dashboard();
