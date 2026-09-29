# Local pre-release audit, 2026-09-29

Verdict: resolve release checks and localization gaps before declaring the release ready. Production was not accessed or changed. The full build regenerated local theme and Storybook outputs; no CMS content or database updates were applied.

## Verified

- Drupal 11.4.7 bootstraps; local database is connected.
- All 127 inventoried published routes returned 200. The browser run checked 137 paths including listing and utility routes; no JavaScript exceptions were recorded.
- All registered public-file originals exist. Independent browser loading/decoding succeeded for 439 unique image URLs extracted from the successful pages (src, data-src, and srcset). This does not cover every CSS background, video playback, external embed, or interactive gallery state.
- Two thumbnails on /ru/videos initially failed, with one recorded 503 from image-style generation. Both passed the independent decoding pass. Verify derivative generation under production permissions/load.
- Theme and Storybook full build passed. Build identity now matches version 1.176.0 and commit affe6bf, with uncommitted work present.
- SCSS, template and token lint passed. Documentation freshness and version checks passed.
- Composer locked dependency audit and runtime-only npm dependency audit reported no advisories. npm development dependencies were not audited.
- All 24 catalogued configuration translations and 166 catalogued interface translations match the saved Russian values. These catalogues do not prove all current interface text is covered.
- Both language video listings contain all 58 videos once, including intentional original-language fallbacks.
- Ten desktop/mobile checks across Russian home, Accountia, SMEP, contact and QR Studio found no horizontal document overflow. Russian homepage desktop and Accountia mobile screenshots were visually inspected.
- Progressive-image recovery test passed after selecting the installed Playwright browser path.

## Findings

1. Russian translation is incomplete. QR Studio has seven English-only editorial blocks (IDs 26–32), and /ru/qr-studio visibly mixes English and Russian controls. The Russian homepage cookie notice still has a WHATEVER button.
2. 48 published video nodes and 9 news nodes have no Russian translation. Video fallback is explicitly covered by a passing test; determine whether original-language news/video titles satisfy the release scope. The inventory also includes untranslated names, tags, blocks and obsolete paragraph revisions, which must not all be treated as visible defects.
3. Translation verification stops on a content mismatch. A complete comparison found 226 EN/RU field-value differences from the stored catalogue, including changed titles, bodies and timeline links. These are catalogue drift, not proof of 226 mistranslations. Reconcile against current CMS copy without overwriting intentional edits.
4. /guidelines and /ru/guidelines return 404. The latter remains in the translation verifier's expected routes. Decide whether these routes should redirect or whether the verification expectations should be updated.
5. JavaScript lint fails at artifacts/square-pagination/check-stationary.mjs:26 and outputs/scatchapp/verify-playback.mjs:26 (three no-promise-executor-return errors total).
6. Selected tests have two obsolete source expectations: portfolio-tag-filtering expects literal brand initials although Twig now reads CMS values; timeline-page expects Organisms/Timeline although the story is Pages/Timeline. Reconcile tests with intended behavior. Of 19 selected tests, the first run passed 16, failed these two, and failed one due to browser-path setup; that browser test passed on rerun.
7. Drupal post-update jurenites_admin.editor_alignment is pending. Rehearse it locally and include updatedb in deployment.
8. Many intended source/generated/media changes are modified or untracked. A deployment of current HEAD alone will not include this local state. The active Drupal configuration is database-owned (config status reports Only in DB); avoid assuming a Git pull transfers CMS content/configuration.
9. On the inspected 390px Accountia screenshot, the release watermark overlaps the cookie notice's lower controls. Review this small-screen presentation before release.

## Before deployment

- Resolve/review the findings, commit the intended source and generated assets, and verify CI against that exact commit.
- Decide code-only versus intentional DEV database replacement. Preserve new PROD content/users/submissions if replacing the database.
- Back up PROD database, public files and matching code; retain a rollback procedure for all three.
- Export matching DEV database/public files after final edits if performing content replacement. Validate archive integrity and membership, including recently added originals and YouTube thumbnails.
- Preserve PROD settings, secrets, mail, analytics and environment-specific URLs. Follow docs/command-cheat-sheet.md.
- Run locked Composer install, database updates and cache rebuild through the documented procedure. Confirm writable public/private/temp directories and image-style generation.
- Before reopening PROD, repeat anonymous EN/RU page, image, mobile navigation, language switching, search/filter and download checks. Check login and contact-form validation; verify actual mail delivery with an explicitly intended test submission.
- Check HTTPS, redirects, canonical/hreflang, robots/sitemap, 404 behavior, local-domain leakage, application logs and visible release identity on PROD. Check Storybook's deployed identity separately.

Not verified: PROD host/state, remote CI, archive restore, complete internal/external link graph, email delivery, authenticated editorial flows, accessibility audit, all breakpoint/interactions, or every video/embed.
