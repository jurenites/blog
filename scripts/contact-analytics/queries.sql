-- query: overview
SELECT report_periods.*,
  session_count - engaged_sessions AS bounced_sessions,
  ROUND(100.0 * (session_count - engaged_sessions)
    / NULLIF(session_count, 0), 1) AS bounce_percent,
  (SELECT active_users FROM page_totals
   WHERE report_id = :report_id AND page_title = 'Contact | jurenites') AS contact_users,
  (SELECT page_views FROM page_totals
   WHERE report_id = :report_id AND page_title = 'Contact | jurenites') AS contact_views,
  (SELECT total_users FROM event_totals
   WHERE report_id = :report_id AND event_name = 'form_submit') AS submit_users,
  (SELECT event_count FROM event_totals
   WHERE report_id = :report_id AND event_name = 'form_submit') AS submit_events,
  ROUND(100.0 * (SELECT active_users FROM page_totals
    WHERE report_id = :report_id AND page_title = 'Contact | jurenites')
    / NULLIF(active_users, 0), 1) AS contact_reach_percent,
  ROUND(100.0 * (SELECT total_users FROM event_totals
    WHERE report_id = :report_id AND event_name = 'form_submit')
    / NULLIF(total_users, 0), 1) AS all_form_user_percent
FROM report_periods WHERE report_id = :report_id;

-- query: events
SELECT event_name, event_count, total_users
FROM event_totals WHERE report_id = :report_id ORDER BY event_count DESC, event_name;

-- query: pages
SELECT page_title, page_views, active_users, bounce_percent
FROM page_totals WHERE report_id = :report_id ORDER BY page_views DESC, page_title;

-- query: sources
SELECT source_medium, active_users AS first_user_active_users, session_count,
  ROUND(100.0 * session_count / NULLIF(
    (SELECT session_count FROM report_periods WHERE report_id = :report_id), 0), 1)
    AS session_share_percent
FROM source_totals WHERE report_id = :report_id ORDER BY session_count DESC;

-- query: audience
SELECT start_date, end_date, active_users, source_note
FROM audience_windows WHERE report_id = :report_id ORDER BY end_date DESC, start_date;

-- query: retention
SELECT cohort_date, new_users,
  ROUND(day_one_percent, 1) AS day_one_percent,
  ROUND(day_seven_percent, 1) AS day_seven_percent
FROM retention_cohorts WHERE report_id = :report_id ORDER BY cohort_date;

-- query: journeys
SELECT page_path, page_views, active_users,
  ROUND(engagement_seconds, 1) AS engagement_seconds
FROM page_path_totals WHERE report_id = :report_id ORDER BY page_views DESC, page_path;

-- query: goals
SELECT
  (SELECT active_users FROM page_path_totals WHERE report_id = :report_id
    AND page_path = '/contact/confirmation') AS confirmation_users,
  (SELECT active_users FROM page_path_totals WHERE report_id = :report_id
    AND page_path = '/videos') AS video_page_users,
  (SELECT active_users FROM page_path_totals WHERE report_id = :report_id
    AND page_path = '/portfolio') AS portfolio_index_users,
  (SELECT SUM(page_views) FROM page_path_totals WHERE report_id = :report_id
    AND page_path LIKE '/portfolio/%') AS project_page_views,
  (SELECT active_users FROM audience_windows WHERE report_id = :report_id
    AND start_date = report_periods.end_date AND end_date = report_periods.end_date) AS daily_users,
  (SELECT active_users FROM audience_windows WHERE report_id = :report_id
    AND start_date = DATE(report_periods.end_date, '-29 days')
    AND end_date = report_periods.end_date) AS monthly_users,
  ROUND(100.0 * (SELECT active_users FROM audience_windows WHERE report_id = :report_id
    AND start_date = report_periods.end_date AND end_date = report_periods.end_date)
    / NULLIF((SELECT active_users FROM audience_windows WHERE report_id = :report_id
      AND start_date = DATE(report_periods.end_date, '-29 days')
      AND end_date = report_periods.end_date), 0), 2) AS stickiness_percent
FROM report_periods WHERE report_id = :report_id;
