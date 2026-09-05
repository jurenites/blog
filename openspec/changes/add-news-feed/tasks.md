## 1. Drupal Content

- [x] 1.1 Add the `news` bundle, editorial fields, form display, list view mode,
  and editor permissions; verify the deployable configuration and a complete
  News record can be saved.

## 2. Homepage Block

- [x] 2.1 Add and place a newest-first Drupal View block limited by
  `HOMEPAGE_NEWS_ITEM_LIMIT`; verify it appears only on the homepage and creates
  no News page or main-menu item.

## 3. Presentation

- [x] 3.1 Map Drupal News fields to the shared News List Item and verify the
  thumbnail and title open the stored external URL.
- [x] 3.2 Verify attractive previews for both a YouTube source and a normal
  article source, then run relevant Drupal checks, Storybook build, lint, strict
  OpenSpec validation, and `git diff --check`.

## 4. Automatic Metadata

- [x] 4.1 Make source name, publication time, and thumbnail optional managed
  fields; verify editors need only a title and source URL.
- [x] 4.2 Reuse YouTube metadata and add ordinary-page metadata extraction;
  verify both source types populate source, publication time, and thumbnail.
- [x] 4.3 Run Drupal checks, lint, the Storybook build, strict OpenSpec
  validation, and `git diff --check`.
