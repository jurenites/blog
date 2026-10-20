import test from 'node:test';
import assert from 'node:assert/strict';
import { open_database, import_snapshot, read_dashboard } from '../scripts/contact-analytics/database.mjs';

function test_snapshot(report_id = 'test-period') {
  return {
    report_period: { report_id, property_id: 'test-property', property_name: 'Synthetic test',
      start_date: '2026-01-01', end_date: '2026-01-28', captured_at: '2026-01-29T12:00:00Z',
      source_url: 'https://analytics.google.com/', source_method: 'Synthetic test only',
      active_users: 40, total_users: 50, new_users: 30, session_count: 60,
      engagement_seconds: 20, event_count: 100 },
    event_totals: [{ event_name: 'form_submit', event_count: 3, total_users: 2 }],
    page_totals: [{ page_title: 'Contact | jurenites', page_views: 9, active_users: 6, bounce_percent: 0 }],
    source_totals: [{ source_medium: '(direct) / (none)', active_users: 40, session_count: 60 }],
    quality_notes: [{ note_id: 'test-note', reported_on: '2026-01-29',
      note_text: 'Undated spam report; do not subtract from form submissions.', evidence_source: 'Synthetic test' }],
  };
}

test('rates keep active and total user denominators distinct; spam does not alter events', () => {
  const database_handle = open_database(':memory:');
  try {
    import_snapshot(database_handle, test_snapshot());
    const overview_data = read_dashboard(database_handle).report_data.overview[0];
    assert.equal(overview_data.contact_reach_percent, 15);
    assert.equal(overview_data.all_form_user_percent, 4);
    assert.equal(overview_data.submit_events, 3);
    assert.equal(overview_data.submit_users, 2);
    assert.equal(Object.hasOwn(overview_data, 'genuine_contacts'), false);
  } finally { database_handle.close(); }
});

test('bounce rate uses session totals, preserves missing values and guards zero sessions', () => {
  const database_handle = open_database(':memory:');
  try {
    const snapshot_data = test_snapshot();
    import_snapshot(database_handle, snapshot_data);
    assert.equal(read_dashboard(database_handle).report_data.overview[0].bounce_percent, null);
    snapshot_data.report_period.session_count = 81;
    snapshot_data.report_period.engaged_sessions = 28;
    import_snapshot(database_handle, snapshot_data);
    const overview_data = read_dashboard(database_handle).report_data.overview[0];
    assert.equal(overview_data.bounced_sessions, 53);
    assert.equal(overview_data.bounce_percent, 65.4);
    snapshot_data.report_period.engaged_sessions = 82;
    assert.throws(() => import_snapshot(database_handle, snapshot_data), /cannot exceed/);
    assert.equal(read_dashboard(database_handle).report_data.overview[0].bounce_percent, 65.4);
    snapshot_data.report_period.engaged_sessions = 0;
    import_snapshot(database_handle, snapshot_data);
    assert.equal(read_dashboard(database_handle).report_data.overview[0].bounce_percent, 100);
    snapshot_data.report_period.session_count = 0;
    import_snapshot(database_handle, snapshot_data);
    assert.equal(read_dashboard(database_handle).report_data.overview[0].bounce_percent, null);
  } finally { database_handle.close(); }
});

test('missing events and zero denominators stay unknown instead of producing misleading zeroes', () => {
  const database_handle = open_database(':memory:');
  try {
    const snapshot_data = test_snapshot();
    snapshot_data.event_totals = [];
    snapshot_data.page_totals = [];
    snapshot_data.report_period.active_users = 0;
    snapshot_data.report_period.total_users = 0;
    import_snapshot(database_handle, snapshot_data);
    const overview_data = read_dashboard(database_handle).report_data.overview[0];
    assert.equal(overview_data.contact_users, null);
    assert.equal(overview_data.submit_users, null);
    assert.equal(overview_data.contact_reach_percent, null);
    assert.equal(overview_data.all_form_user_percent, null);
  } finally { database_handle.close(); }
});

test('re-import is idempotent and overlapping periods are never added', () => {
  const database_handle = open_database(':memory:');
  try {
    import_snapshot(database_handle, test_snapshot());
    import_snapshot(database_handle, test_snapshot());
    import_snapshot(database_handle, test_snapshot('another-period'));
    assert.equal(read_dashboard(database_handle).report_periods.length, 2);
    assert.equal(read_dashboard(database_handle, 'test-period').report_data.overview[0].active_users, 40);
    assert.equal(read_dashboard(database_handle, 'test-period').report_data.events.length, 1);
    assert.equal(read_dashboard(database_handle).quality_notes.length, 1);
  } finally { database_handle.close(); }
});

test('audience windows, page views and cohort maturity retain their distinct scopes', () => {
  const database_handle = open_database(':memory:');
  try {
    const snapshot_data = test_snapshot();
    snapshot_data.audience_windows = [
      { start_date: '2026-01-28', end_date: '2026-01-28', active_users: 1, source_note: 'Synthetic daily' },
      { start_date: '2025-12-30', end_date: '2026-01-28', active_users: 49, source_note: 'Synthetic 30-day' },
    ];
    snapshot_data.retention_cohorts = [
      { cohort_date: '2026-01-01', new_users: 6, day_one_percent: 100 / 6, day_seven_percent: 0 },
      { cohort_date: '2026-01-27', new_users: 2, day_one_percent: 50, day_seven_percent: 0 },
      { cohort_date: '2026-01-28', new_users: 1, day_one_percent: 0, day_seven_percent: 0 },
    ];
    snapshot_data.page_path_totals = [
      { page_path: '/portfolio', page_views: 10, active_users: 5, engagement_seconds: 13 },
      { page_path: '/portfolio/example', page_views: 3, active_users: 2, engagement_seconds: 40 },
      { page_path: '/contact/confirmation', page_views: 2, active_users: 1, engagement_seconds: 1 },
    ];
    import_snapshot(database_handle, snapshot_data);
    import_snapshot(database_handle, snapshot_data);
    const report_data = read_dashboard(database_handle).report_data;
    assert.equal(report_data.goals[0].daily_users, 1);
    assert.equal(report_data.goals[0].monthly_users, 49);
    assert.equal(report_data.goals[0].stickiness_percent, 2.04);
    assert.equal(report_data.goals[0].confirmation_users, 1);
    assert.equal(report_data.goals[0].project_page_views, 3);
    assert.equal(report_data.goals[0].video_page_users, null);
    assert.equal(report_data.retention[0].day_one_percent, 16.7);
    assert.equal(report_data.retention[0].day_seven_percent, 0);
    assert.equal(report_data.retention[1].day_seven_percent, null);
    assert.equal(report_data.retention[2].day_one_percent, null);
    assert.equal(report_data.audience.length, 2);
    snapshot_data.audience_windows[0].end_date = '2026-02-01';
    assert.throws(() => import_snapshot(database_handle, snapshot_data), /Invalid audience window/);
    assert.equal(read_dashboard(database_handle).report_data.goals[0].stickiness_percent, 2.04);
  } finally { database_handle.close(); }
});

test('failed imports roll back deletion and partial inserts', () => {
  const database_handle = open_database(':memory:');
  try {
    import_snapshot(database_handle, test_snapshot());
    const invalid_snapshot = test_snapshot();
    invalid_snapshot.report_period.active_users = 999;
    invalid_snapshot.event_totals[0].event_count = -1;
    assert.throws(() => import_snapshot(database_handle, invalid_snapshot), /Invalid count/);
    assert.equal(read_dashboard(database_handle).report_data.overview[0].active_users, 40);
    assert.equal(read_dashboard(database_handle).report_data.events[0].event_count, 3);
  } finally { database_handle.close(); }
});

test('report selection rejects injection; source URLs and impossible dates are validated', () => {
  const database_handle = open_database(':memory:');
  try {
    import_snapshot(database_handle, test_snapshot());
    assert.throws(() => read_dashboard(database_handle, "' OR 1=1 --"), /Unknown report/);
    const invalid_snapshot = test_snapshot();
    invalid_snapshot.report_period.source_url = 'javascript:alert(1)';
    assert.throws(() => import_snapshot(database_handle, invalid_snapshot), /Source must/);
    invalid_snapshot.report_period.source_url = 'https://analytics.google.com/';
    invalid_snapshot.report_period.start_date = '2026-02-30';
    assert.throws(() => import_snapshot(database_handle, invalid_snapshot), /Invalid date/);
    assert.equal(read_dashboard(database_handle).report_periods.length, 1);
  } finally { database_handle.close(); }
});
