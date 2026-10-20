PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS report_periods (
  report_id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  property_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_method TEXT NOT NULL,
  active_users INTEGER CHECK(active_users >= 0),
  total_users INTEGER CHECK(total_users >= 0),
  new_users INTEGER CHECK(new_users >= 0),
  session_count INTEGER CHECK(session_count >= 0),
  engagement_seconds REAL CHECK(engagement_seconds >= 0),
  event_count INTEGER CHECK(event_count >= 0),
  engaged_sessions INTEGER CHECK(engaged_sessions >= 0 AND engaged_sessions <= session_count)
);
CREATE TABLE IF NOT EXISTS event_totals (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_count INTEGER NOT NULL CHECK(event_count >= 0),
  total_users INTEGER NOT NULL CHECK(total_users >= 0),
  PRIMARY KEY(report_id, event_name)
);
CREATE TABLE IF NOT EXISTS page_totals (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  page_title TEXT NOT NULL,
  page_views INTEGER NOT NULL CHECK(page_views >= 0),
  active_users INTEGER NOT NULL CHECK(active_users >= 0),
  bounce_percent REAL CHECK(bounce_percent BETWEEN 0 AND 100),
  PRIMARY KEY(report_id, page_title)
);
CREATE TABLE IF NOT EXISTS source_totals (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  source_medium TEXT NOT NULL,
  active_users INTEGER NOT NULL CHECK(active_users >= 0),
  session_count INTEGER NOT NULL CHECK(session_count >= 0),
  PRIMARY KEY(report_id, source_medium)
);
CREATE TABLE IF NOT EXISTS audience_windows (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  active_users INTEGER NOT NULL CHECK(active_users >= 0),
  source_note TEXT NOT NULL,
  PRIMARY KEY(report_id, start_date, end_date)
);
CREATE TABLE IF NOT EXISTS retention_cohorts (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  cohort_date TEXT NOT NULL,
  new_users INTEGER NOT NULL CHECK(new_users > 0),
  day_one_percent REAL CHECK(day_one_percent BETWEEN 0 AND 100),
  day_seven_percent REAL CHECK(day_seven_percent BETWEEN 0 AND 100),
  PRIMARY KEY(report_id, cohort_date)
);
CREATE TABLE IF NOT EXISTS page_path_totals (
  report_id TEXT REFERENCES report_periods(report_id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_views INTEGER NOT NULL CHECK(page_views >= 0),
  active_users INTEGER NOT NULL CHECK(active_users >= 0),
  engagement_seconds REAL NOT NULL CHECK(engagement_seconds >= 0),
  PRIMARY KEY(report_id, page_path)
);
-- Notes are evidence, never inferred GA events or an imported submission ledger.
CREATE TABLE IF NOT EXISTS quality_notes (
  note_id TEXT PRIMARY KEY,
  reported_on TEXT NOT NULL,
  note_text TEXT NOT NULL,
  evidence_source TEXT NOT NULL
);
