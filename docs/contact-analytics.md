# Local contact analytics

The local dashboard answers whether jurenites.com attracts people who genuinely
contact its owner. It uses Node's built-in SQLite database, saved SQL queries,
and a browser page. It runs separately from Drupal and is not deployed to the
public site. Node 22.13+ is required (verified locally with Node 25).

```bash
npm run analytics:serve
```

Open `http://127.0.0.1:4318`. Set `CONTACT_ANALYTICS_PORT` to choose another port.
The server binds only to loopback, checks the Host header, exposes fixed read-only
queries, and serves only an explicit asset allowlist. No GA credentials are stored.
Stop it with Ctrl-C in its terminal.

## Source and refresh

The initial private snapshot was collected on 20 October 2026 from the signed-in
GA4 property **jurenites Blog website**, property ID **551959229**, account
**406306964**, for **22 September–19 October 2026**, All Users.
The Events CSV came from GA's Download CSV action. Overview, top-page and
source/medium rows were transcribed from the visible Reports snapshot.
The original title/source capture is limited to the rows visible in that report.
The follow-up audit downloaded all 17 page paths, the traffic overview and the
engagement/retention overview as CSV. These are aggregate reports, not an
event-level export. The property timezone and reporting identity were not inspected.

Private inputs and the SQLite database are in `.cache/contact-analytics/`,
excluded from Git. Generated UI assets are in `generated/contact-analytics/`.
The initial input is `snapshot-2026-09-22--2026-10-19.json`; its accompanying
`events-2026-09-22--2026-10-19.csv` preserves the downloaded source.

```bash
npm run analytics:import -- .cache/contact-analytics/snapshot-2026-09-22--2026-10-19.json
npm run test:contact-analytics
```

Refresh by exporting the same GA reports for the desired complete reporting
period and preparing a new normalized JSON snapshot following the existing input:

- `report_period`: report ID, property ID/name, start/end date, capture time,
  source URL/method, active/total/new users, session count, engagement seconds
  per active user, event count, optional `engaged_sessions` (null if unavailable).
  Engaged sessions must come from the same period and All Users report total;
  `user_engagement` event counts are not engaged-session counts.
- `event_totals`: event name, event count, total users.
- `page_totals`: exact page title, page views, active users, bounce percent.
- `source_totals`: source/medium, first-user active users, session count.
  The latter columns originate from separate first-user and session reports.
- `audience_windows`: start/end dates, distinct active users and source note.
  Includes 28 daily windows and the separately verified 20 September–19 October
  rolling 30-day total. Daily windows are never summed into MAU.
- `retention_cohorts`: acquisition date, new users, day-one/day-seven percentages.
  Import only nonempty cohorts. The importer clears percentages for observation
  days that have not elapsed by the report end.
- `page_path_totals`: exact page path, views, active users and average engagement
  seconds per active user, from the full Pages and screens CSV.
- `quality_notes`: stable note ID, reported-on date, note text, evidence source.
  Do not put contact message contents, email addresses or credentials here.

The JSON importer validates fields and replaces a whole report atomically.
Re-importing a report ID is idempotent. Use stable IDs including property and
date range. Use a new ID for a different period. Keep the CSV beside the JSON
for auditability. The current importer accepts normalized JSON, not arbitrary
GA CSV files. The checked-in tests contain synthetic examples of its schema.
The browser selects imported whole periods; it never invents daily data or sums
distinct users across overlapping periods. Reload after import.

This is a manually captured snapshot, **not automatic GA synchronization**.
Future unattended refresh needs an authorized GA Data API connection and a
separate submission-review source. Browser sign-in alone is not a server API
credential.

## Metric interpretation

Primary outcome: reviewed genuine enquiries. The initial data contains no
reviewed submission ledger, so genuine contacts and genuine-contact conversion
are unknown, not zero.

The initial snapshot has 47 active users, 47 total users, 46 new users, 81
sessions, 352 events and approximately 33 seconds engagement per active user.
The Pages and screens report's All Users total was subsequently checked for
22 September–19 October 2026: 28 engaged sessions out of 81 sessions. Card 05
now shows **65.4% bounce rate**, calculated in SQL as `(81 − 28) / 81 × 100`.
The source transcription is retained in the private cache alongside the snapshot.
The schema adds a nullable engaged-session count to existing databases without
replacing their reports. Missing counts and zero denominators produce no rate.
The exact English Contact page title has 6 active users and 9 views: 12.8%
contact-page reach (6 / 47). Translated titles are not implicitly merged.
GA reports 2 `form_submit` events from 2 users across **all forms**: a 4.3%
all-form user rate (2 / 47), not verified contact conversion. Neither form
identity, server acceptance, email delivery nor user quality is established.
The initial snapshot showed no key-event data; this is not evidence of zero
real enquiries.

The owner reported one bot/scam message. Its event date, submission ID and GA
identity are unknown. Preserve it as an undated quality note outside all period
counts. Never subtract it from the two GA events or declare the other event
genuine. Do not classify users as bots from city, country or source alone.

The default Overview displays the six unnumbered GA summary cards followed by
all 18 numbered reference KPI cards. The separate “18 KPI cards” view provides
a focused view of the same complete inventory.
The 18-card reference library preserves the JPEG's metric inventory while
explaining relevance and missing evidence. GA4 bounce rate is non-engaged
sessions / sessions, not simply single-page sessions. NRR includes contraction.
DAU, rolling MAU and dated cohort examples now come from additional GA evidence.
Error rate, task duration, surveys and client revenue still need their own sources.

## Audit of all 18 reference KPIs

The owner's priority order is **contact → video watching / portfolio reading**.
Video and projects are supporting actions, not equivalent to genuine enquiries.
This audit changes the local report, not production tracking or GA key-event settings.

| # | KPI | Evidence and measurement decision |
| --- | --- | --- |
| 01 | Conversion | 2 all-form submit users and 2 confirmation-page users are separate proxies. Genuine-contact conversion needs accepted submissions, quality review, and a deduplicated measured-user denominator. |
| 02 | Activation | Proposed: watch 50% of a video OR read a project for 30 active seconds and reach 50% depth. Deduplicate across actions. No matching event is in the export. |
| 03 | Time to value | Link first visit to first meaningful content action; report time to contact separately. Use medians and distinguish same-session from cross-session journeys. |
| 04 | Drop-off | Contact page → contact-form start → server acceptance, linked in order within a session. Equal start/submit totals do not prove a completed funnel. |
| 05 | Bounce | 53 / 81 sessions = 65.4%; already verified from session totals. |
| 06 | DAU / MAU | 1 on 19 October / 49 during 20 September–19 October. The monthly total was verified directly using GA's Last 30 days selection. |
| 07 | Stickiness | 1 / 49 = 2.04%, matching the traffic CSV's final-day DAU/MAU ratio. Context for repeat readership, not the main success target. |
| 08 | Adoption | /videos: 5 active users; /portfolio index: 7; project detail: 7 views across 4 paths. None proves watching or completed reading. Measure playback and engaged reading separately. |
| 09 | Retention | Earliest imported cohort, 22 September: 6 new users, day-1 return 16.7%, day-7 return 0%. This is an explicitly scoped small-cohort example, not the overall site rate. Full cohort table is available through SQL. |
| 10 | Task success | 2 confirmation-page users support completion validation. Need an attempt ID and server acceptance to calculate success per attempt; delivery and quality are separate outcomes. |
| 11 | Time on task | Contact start-to-success active seconds per attempt, median and p90. Do not substitute 33 seconds of average site engagement. |
| 12 | Error rate | Need safe validation/server/delivery error categories per attempt. Access-denied and not-found page views do not establish a contact error rate. |
| 13 | CSAT | Optional post-contact ease rating or separate content-helpfulness survey. No survey source supplied; show response count and participation rate. |
| 14 | Churn | Not applicable to the current portfolio/contact goals; use return cohorts for visitors. |
| 15 | LTV | Requires actual won-client and invoice records. GA's zero ecommerce revenue does not establish zero client value. |
| 16 | CAC | Requires actual acquisition spend and won clients. Cost per reviewed genuine enquiry is more immediately useful. |
| 17 | MRR / ARR | Not applicable without a recurring paid service or subscription ledger. |
| 18 | NRR | Not applicable without a recurring-customer revenue cohort, expansion, contraction and churn. |

The engagement CSV contains 28 daily rows and 19 nonempty acquisition cohorts.
The CSV includes zeroes for immature cohort observations; those are stored as
NULL until enough days have elapsed. Cohort percentages are not averaged into
a single retention rate. The last-42-days engagement chart in the same CSV is
not imported as retention or time to value.

Full path export for the four projects: `/portfolio/smep` has 4 views / 4 active
users / 78 seconds average engagement; `/portfolio/accountia` 1 / 1 / 44;
`/portfolio/oksenate` 1 / 1 / 3; `/portfolio/scatchapp` 1 / 1 / 10.
Do not add their active users, because the same person may visit several projects.
The confirmation path has 2 views from 2 active users. It can be opened directly,
so it is not a substitute for accepted-submission records.

The exported event inventory contains no `video_start`, `video_progress`,
`video_complete`, contact-specific success/error, survey or revenue events.
That establishes no recorded rows in this export, not zero actual actions.
The local YouTube formatter builds an embed URL without explicitly adding
`enablejsapi`, and its loader tracks iframe loading rather than playback.
This is an implementation clue, not proof of the deployed tag configuration.
Before implementation, verify enhanced measurement and JS API support on the
live player and avoid duplicate automatic/custom video events.

Proposed implementation order:

1. Validate the contact webform identifier (`webform_submission_contact_add_form`
   in local code), server-accepted success, retries, errors and quality ledger.
2. Verify YouTube start/progress/complete measurement; use per-video identifiers
   and a start-to-completion cohort so repeat plays do not inflate completion.
3. Add a proposed `project_engaged` event once per session/project after 30
   foreground seconds and 50% content depth, including a stable project ID.
4. Build assisted-contact funnels and time-to-action reports from consented,
   linked events. Import business spend/revenue only when relevant.

Do not send message bodies, email addresses or other contact details to GA.
Direct email or messaging enquiries can be counted in the quality ledger even
when attribution to a measured website visitor is unknown.

## Architecture and controls

- `scripts/contact-analytics/schema.sql`: normalized report-period tables.
- `scripts/contact-analytics/queries.sql`: executable, parameterized queries.
- `scripts/contact-analytics/database.mjs`: transactional import and reads.
- `src/contact-analytics/`: internal UI and KPI definitions.
- Buttons and period selection reuse shared Storybook atom markup and SCSS.
- The page is named **Contact KPI**. The period picker runs the same select
  enhancement as Storybook, with a 40px suffix and centered 24px chevron.
- SQL uses the shared `Atoms/Code Block` renderer, with token-based colors for
  keywords, strings, parameters, numbers and comments. Highlighting escapes
  source text and preserves the query verbatim; it does not execute SQL.
- Existing generated tokens supply all colors; no token inventory additions.
- The SQL view shows the actual query and bound period plus its result.

This internal tool's instructional interface text is stored with its source.
It adds no public editorial copy, Drupal fields or production tracking.
The existing privacy module's starter copy says the site has no analytics;
reconcile the actual published privacy copy with live tracking in a separate
CMS review. This dashboard does not alter that copy or tracking settings.

Before reporting genuine conversion, review Drupal Contact submissions, define
genuine/spam/test/duplicate/unreviewed classifications, verify a server-accepted
contact-success event, and establish consented attribution and deduplication.
Email delivery is a separate check from submission acceptance.

References: [GA4 engagement and bounce rate](https://support.google.com/analytics/answer/12195621),
[automatically collected events](https://support.google.com/analytics/answer/9234069),
[user stickiness](https://support.google.com/analytics/answer/12993725),
[retention overview](https://support.google.com/analytics/answer/11004084),
and [GA Data API reporting](https://developers.google.com/analytics/devguides/reporting/data/v1/basics).
