## Why

Roundabout and 4pixel already ship with the site, but visitors cannot discover them as portfolio work, inspect their supported glyphs, try them with their own text, or download them from a documented project page. The site also lacks the Project content type described by its content-model documentation, so these two font projects need both a durable editorial home and reusable interactive presentation.

## What Changes

- Add a deployable Drupal Project content model and create two Project records: Roundabout and 4pixel, presented in a compact four-column Portfolio gallery whose cards keep only the thumbnail, underlined 16px title link, and optional tag Chips linking to a shareable `/portfolio?tag=<slug>` listing filter.
- Give Project pages reorderable structured sections so the font stories, references, screenshots, spacing explanations, and accessibility-conscious editorial copy remain author-controlled instead of being embedded in a template.
- Add a reusable font-preview section that loads a selected local font, presents a “Try it yourself” input whose editable value is rendered directly in that font, and renders only glyphs with Unicode mappings in responsive 40px-minimum groups that prioritize familiar alphabets and keyboard symbols before a collapsed additional-glyph disclosure.
- Add a macOS Character Viewer-inspired glyph dialog with a smooth tile-to-vector shared-element transition, a baseline-anchored seven-row metric viewport, an enlarged vector outline, visible on-curve and off-curve/control points, typed key/value metadata, a shared Chevron-controlled path-code disclosure, advance width, glyph name/index, and correctly formatted Unicode code point.
- Add an embedded font-data table that reports metadata actually present in the font and explicitly marks absent values rather than inventing them.
- Add a downloadable font action using the shared Icon component and the supplied `arrow-download.svg` asset.
- Add a 4×4 black-and-white pixel glyph editor to the 4pixel project, using 40px cells plus an adjacent compact glyph tile that mirrors the drawing live.
- Add matching Storybook stories and shared markup helpers for every new visual component, plus Drupal templates/behaviors that consume the same contracts.
- Add the two supplied origin stories as edited project content: Roundabout’s SMEP, pixel-grid, subpixel-rendering, Urbanist/Sulphur Point, topology, and stencil themes; and 4pixel’s 2009 logo, compact-grid, variable-spacing, watermark, DOS VGA 437, FontStruct, and accessibility themes.

## Capabilities

### New Capabilities

- `portfolio/project-content`: Deployable Project records support structured, reorderable portfolio storytelling and include the Roundabout and 4pixel entries.
- `font/interactive-preview`: A Project can expose a downloadable local font through an editable font-preview input, Unicode-mapped glyph grid, vector-inspection dialog, and embedded metadata table.
- `font/pixel-glyph-editor`: The 4pixel Project includes an accessible 4×4 visitor-editable monochrome glyph grid with immediate feedback in the drawing surface.

### Modified Capabilities

None.

## Impact

- Adds Drupal recipe/configuration for the Project bundle, Project fields, structured Paragraph types, displays, and the two initial records or an idempotent content-install path.
- Adds Storybook templates, stories, JavaScript behavior, SCSS, semantic tokens where a reusable decision is missing, Drupal Twig integration, and a shared download icon.
- Adds a bundled browser-side OpenType parser dependency; the existing esbuild theme pipeline will package it rather than loading code from a CDN.
- Reuses `roundabout-regular.ttf`, `4pixel.ttf`, and `4pixel.woff` already under `src/public/assets/fonts/`; generated theme assets remain derived outputs.
- Extends project documentation and advances its documentation checkpoint as part of delivery.
- Does not promise a complete Unicode table, editing or exporting the installed fonts, server-side font processing, or persistence of visitor pixel drawings.
