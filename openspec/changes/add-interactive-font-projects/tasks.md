## 1. Drupal Project foundation

- [x] 1.1 Add the `jurenites_font_projects` module and recipe-owned Project bundle configuration (revisionable body, image, tags, and `field_content_sections`), then validate the recipe and confirm Drupal reports the `project` bundle with the expected fields.
- [x] 1.2 Add `project_story`, `font_preview`, and `pixel_glyph_editor` Paragraph configuration, including the allowlisted font-identifier field and Project form/view displays, then verify an editor can add and reorder all three section types without exposing font controls on unrelated bundles.
- [x] 1.3 Add the `/portfolio` published-Project View and Project detail/list templates using the existing Project Card and content-layout contracts, then verify anonymous output lists only published Projects and links to their aliases.
- [x] 1.4 Render Project tags with the shared semantic tag-list/Chip contract, route each tag to `/portfolio?tag=<slug>`, and add the same validated single-value Views argument used by Blog; verify the filtered and cleared Portfolio URLs, markup, result set, and cache context in DEV.
- [x] 1.5 Make each Project card's underlined 16px title link its sole detail-page action, remove the duplicate `View project` button from Drupal and Storybook templates, and verify the rendered Portfolio DOM and computed typography in DEV.
- [x] 1.6 Convert the Portfolio to a compact four-column desktop gallery, limit Project cards to thumbnail, title, and optional tags in Drupal and Storybook, and verify the responsive grid and rendered DOM in DEV.

## 2. Shared font-preview component

- [x] 2.1 Add a pinned `opentype.js` production dependency plus isolated font parsing/formatting helpers, then verify automated tests against both real TTF assets cover Unicode formatting, mapped-outline filtering, safe glyph-name fallback, path serialization, and absent metadata.
- [x] 2.2 Add the shared font-preview templates and markup helper with separate Roundabout and 4pixel Storybook stories, composing existing Text Input, Button, and Icon helpers instead of duplicating their HTML; verify Storybook renders meaningful pre-enhancement markup without inline `width`, `height`, or `style` attributes.
- [x] 2.3 Implement the progressively enhanced specimen, cached same-origin font loading, responsive glyph tiles, honest Data table, and failure state; verify automated/browser checks cover live typing, real code-point ordering, no unsupported/empty glyph tiles, local download filenames, and the current binaries' actual embedded license values.
- [x] 2.4 Implement the native glyph dialog with scalable SVG outline, metric guides, on/off-curve points, metadata, scrollable path code, keyboard opening/closing, and focus restoration; verify uppercase `S` reports `U+0053` and a Storybook browser check exercises pointer and keyboard interaction.
- [x] 2.5 Add component SCSS and only necessary semantic tokens for the responsive full-width grid, 40px minimum tiles, character-viewer dialog, and approximately 160px glyph visualization; verify token-contract, Stylelint, 360px, and desktop visual checks pass.
- [x] 2.6 Use the supplied `arrow-download.svg` through the shared Icon contract inside the download Button; verify source and built icon references resolve without handwritten duplicate icon markup.

## 3. Pixel glyph editor

- [x] 3.1 Add shared pixel-glyph-editor templates, markup helper, and Storybook story with exactly 16 labeled toggle buttons and token-owned cell geometry; verify the initial markup is a blank 4×4 grid with no inline presentational sizing.
- [x] 3.2 Implement keyboard, click, touch/pointer-drag painting, immediate in-grid feedback, and deterministic non-persistence; verify automated/browser checks cover fill, erase, drag consistency, `aria-pressed`, reload reset, and absence of storage/network writes.
- [x] 3.3 Add pixel-editor SCSS using the shared basic-tile and dark-theme palette tokens, then verify the grid remains usable at 360px and is absent from the Roundabout Storybook composition.
- [x] 3.4 Correct the delivered editor to a single 4×4 drawing surface, remove the duplicate Preview and filled-count UI from Drupal and Storybook, and verify the final rendered contract in both environments.

## 4. Drupal integration and initial content

- [x] 4.1 Add Drupal Paragraph templates/preprocess data for the font preview and pixel editor using the same BEM/data contracts as Storybook, translated UI labels, allowlisted theme asset URLs, and shared Icon Twig; verify rendered source contains useful fallback/download markup and no title/NID-based branching.
- [x] 4.2 Add missing-only recipe content with stable UUIDs for Roundabout and 4pixel, canonical aliases, ordered Paragraph trees, and edited narrative covering every required story topic and the FontStruct link; verify two runs leave exactly one node per UUID and do not overwrite an intentional editor change.
- [x] 4.3 Apply the recipe/module update to DEV, clear Drupal caches, and verify `/portfolio`, `/portfolio/roundabout`, and `/portfolio/4pixel` as anonymous pages, including local font downloads, real metadata, glyph dialogs, and the 4pixel-only editor.

## 5. Documentation and release verification

- [x] 5.1 Update the content-model/design-system/workflow documentation for Project sections, self-hosted font parsing, honest embedded metadata, content seeding, and later optional Windows media, then run `npm run version:bump` for the delivered iteration and verify `npm run docs:check` passes.
- [x] 5.2 Run `npm run lint`, focused automated tests, `git diff --check`, `npm run build:theme`, and `npm run build-storybook`; inspect the generated asset diffs and production bundle-size change without reverting unrelated user work.
- [x] 5.3 Perform final browser accessibility and responsive QA in Storybook and DEV at 360px and desktop widths, record any non-blocking build warnings separately, and verify all scenarios in the three delta specs before marking the change complete.
- [x] 5.4 Replace the Drupal/Storybook Article teaser `<article>` wrapper with a plain `.article-teaser` container, cap teaser media at the existing 280px semantic maximum without changing the uploaded source, move `.article-tags` immediately after the title, and verify the served homepage DOM and geometry in DEV.
- [x] 5.5 Remove the Drupal-only `on` from the Article teaser byline, preserve the current author output for this correction, and verify logged-in and anonymous teaser text places the date directly after the author.
