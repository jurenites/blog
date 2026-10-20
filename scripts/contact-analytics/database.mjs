import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const DATABASE_PATH = resolve(PROJECT_ROOT, '.cache/contact-analytics/reports.sqlite');
export const QUERY_TEXT = readFileSync(new URL('./queries.sql', import.meta.url), 'utf8');
export const SAVED_QUERIES = Object.fromEntries(
  [...QUERY_TEXT.matchAll(/-- query: (\w+)\n([\s\S]*?)(?=\n-- query:|$)/g)]
    .map((query_match) => [query_match[1], query_match[2].trim()]),
);

export function open_database(database_path = DATABASE_PATH) {
  if (database_path !== ':memory:') mkdirSync(dirname(database_path), { recursive: true, mode: 0o700 });
  const database_handle = new DatabaseSync(database_path);
  database_handle.exec(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));
  const column_names = database_handle.prepare('PRAGMA table_info(report_periods)').all()
    .map((column_row) => column_row.name);
  if (!column_names.includes('engaged_sessions')) {
    database_handle.exec('ALTER TABLE report_periods ADD COLUMN engaged_sessions INTEGER CHECK(engaged_sessions >= 0 AND engaged_sessions <= session_count)');
  }
  return database_handle;
}

function require_text(text_value, field_name) {
  if (typeof text_value !== 'string' || !text_value.trim() || text_value.length > 4000) {
    throw new Error(`Invalid ${field_name}`);
  }
  return text_value;
}

function require_date(date_value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date_value) ||
      Number.isNaN(Date.parse(date_value)) ||
      new Date(date_value).toISOString().slice(0, 10) !== date_value) throw new Error('Invalid date');
  return date_value;
}

function require_count(count_value, allow_null = false) {
  if (allow_null && count_value === null) return null;
  if (!Number.isSafeInteger(count_value) || count_value < 0) throw new Error('Invalid count');
  return count_value;
}

function require_percent(percent_value) {
  if (percent_value === null) return null;
  if (!Number.isFinite(percent_value) || percent_value < 0 || percent_value > 100) {
    throw new Error('Invalid percentage');
  }
  return percent_value;
}

export function import_snapshot(database_handle, snapshot_data) {
  const period_data = snapshot_data.report_period;
  const report_id = require_text(period_data.report_id, 'report_id');
  const start_date = require_date(period_data.start_date);
  const end_date = require_date(period_data.end_date);
  if (start_date > end_date) throw new Error('Date range is reversed');
  if (Number.isNaN(Date.parse(period_data.captured_at))) throw new Error('Invalid capture timestamp');
  const source_url = new URL(period_data.source_url);
  if (source_url.protocol !== 'https:' || source_url.hostname !== 'analytics.google.com') {
    throw new Error('Source must be a Google Analytics report URL');
  }
  if (!Number.isFinite(period_data.engagement_seconds) || period_data.engagement_seconds < 0) {
    throw new Error('Invalid engagement duration');
  }
  const engaged_sessions = require_count(period_data.engaged_sessions ?? null, true);
  if (engaged_sessions !== null &&
      (period_data.session_count === null || engaged_sessions > period_data.session_count)) {
    throw new Error('Engaged sessions require a total session count and cannot exceed it');
  }
  const period_values = [
    report_id, require_text(period_data.property_id, 'property_id'),
    require_text(period_data.property_name, 'property_name'), start_date, end_date,
    require_text(period_data.captured_at, 'captured_at'), source_url.href,
    require_text(period_data.source_method, 'source_method'),
    ...['active_users', 'total_users', 'new_users', 'session_count'].map((field_name) =>
      require_count(period_data[field_name], true)),
    period_data.engagement_seconds, require_count(period_data.event_count, true),
    engaged_sessions,
  ];
  database_handle.exec('BEGIN');
  try {
    // Re-import replaces one complete period atomically; it never sums overlapping users.
    database_handle.prepare('DELETE FROM report_periods WHERE report_id = ?').run(report_id);
    database_handle.prepare(`INSERT INTO report_periods
      (report_id, property_id, property_name, start_date, end_date, captured_at,
       source_url, source_method, active_users, total_users, new_users,
       session_count, engagement_seconds, event_count, engaged_sessions)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(...period_values);
    for (const event_row of snapshot_data.event_totals) {
      database_handle.prepare('INSERT INTO event_totals VALUES (?,?,?,?)').run(report_id,
        require_text(event_row.event_name, 'event_name'),
        require_count(event_row.event_count), require_count(event_row.total_users));
    }
    for (const page_row of snapshot_data.page_totals) {
      database_handle.prepare('INSERT INTO page_totals VALUES (?,?,?,?,?)').run(report_id,
        require_text(page_row.page_title, 'page_title'), require_count(page_row.page_views),
        require_count(page_row.active_users), page_row.bounce_percent);
    }
    for (const source_row of snapshot_data.source_totals) {
      database_handle.prepare('INSERT INTO source_totals VALUES (?,?,?,?)').run(report_id,
        require_text(source_row.source_medium, 'source_medium'), require_count(source_row.active_users),
        require_count(source_row.session_count));
    }
    for (const window_row of snapshot_data.audience_windows ?? []) {
      const window_start = require_date(window_row.start_date);
      const window_end = require_date(window_row.end_date);
      if (window_start > window_end || window_end > end_date) throw new Error('Invalid audience window');
      database_handle.prepare('INSERT INTO audience_windows VALUES (?,?,?,?,?)').run(
        report_id, window_start, window_end, require_count(window_row.active_users),
        require_text(window_row.source_note, 'source_note'));
    }
    for (const cohort_row of snapshot_data.retention_cohorts ?? []) {
      const cohort_date = require_date(cohort_row.cohort_date);
      if (cohort_date < start_date || cohort_date > end_date) throw new Error('Invalid cohort date');
      const elapsed_days = (Date.parse(end_date) - Date.parse(cohort_date)) / 86400000;
      database_handle.prepare('INSERT INTO retention_cohorts VALUES (?,?,?,?,?)').run(
        report_id, cohort_date, require_count(cohort_row.new_users),
        elapsed_days >= 1 ? require_percent(cohort_row.day_one_percent) : null,
        elapsed_days >= 7 ? require_percent(cohort_row.day_seven_percent) : null);
    }
    for (const path_row of snapshot_data.page_path_totals ?? []) {
      if (!Number.isFinite(path_row.engagement_seconds) || path_row.engagement_seconds < 0) {
        throw new Error('Invalid page engagement duration');
      }
      database_handle.prepare('INSERT INTO page_path_totals VALUES (?,?,?,?,?)').run(
        report_id, require_text(path_row.page_path, 'page_path'), require_count(path_row.page_views),
        require_count(path_row.active_users), path_row.engagement_seconds);
    }
    for (const note_row of snapshot_data.quality_notes ?? []) {
      database_handle.prepare('INSERT OR REPLACE INTO quality_notes VALUES (?,?,?,?)').run(
        require_text(note_row.note_id, 'note_id'), require_date(note_row.reported_on),
        require_text(note_row.note_text, 'note_text'), require_text(note_row.evidence_source, 'evidence_source'));
    }
    database_handle.exec('COMMIT');
  } catch (import_error) {
    database_handle.exec('ROLLBACK');
    throw import_error;
  }
}

export function read_dashboard(database_handle, report_id) {
  const report_periods = database_handle.prepare(
    'SELECT report_id, property_name, start_date, end_date, captured_at FROM report_periods ORDER BY end_date DESC, captured_at DESC',
  ).all();
  const selected_id = report_id || report_periods[0]?.report_id;
  if (!selected_id) return { report_periods, report_data: null, saved_queries: SAVED_QUERIES, quality_notes: [] };
  if (!report_periods.some((period_data) => period_data.report_id === selected_id)) throw new Error('Unknown report');
  const report_data = Object.fromEntries(Object.entries(SAVED_QUERIES).map(([query_name, query_text]) =>
    [query_name, database_handle.prepare(query_text).all({ report_id: selected_id })]));
  return { report_periods, report_data, saved_queries: SAVED_QUERIES,
    quality_notes: database_handle.prepare('SELECT * FROM quality_notes ORDER BY reported_on DESC').all() };
}
