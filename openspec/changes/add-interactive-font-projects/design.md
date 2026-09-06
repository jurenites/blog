## Context

See `proposal.md` for motivation and the three delta specs for observable behavior. The repository already ships `roundabout-regular.ttf`, `4pixel.ttf`, and `4pixel.woff`, declares both font families in `_fonts.scss`, copies fonts and icons into the Drupal theme through `scripts/build-theme.mjs`, and bundles one JavaScript entry with esbuild. The live DEV site currently has Article, Basic page, and Image comparison bundles but no Project bundle. Existing Paragraphs infrastructure attaches `field_content_sections` only to Article and Basic page. The two font files are small (about 60KB each), contain TrueType outlines, and embed copyright and license strings. Roundabout reports `Non-Commercial License`; 4pixel reports `Open Font License`. The source assets include `arrow-download.svg`.

The working tree already contains unrelated user changes. Implementation must confine edits to the new feature and avoid normalizing or rebuilding unrelated source until final verification requires generated outputs.

## Goals / Non-Goals

**Goals:**

- Make Project the editorial owner of the two font stories while keeping font tools reusable and selected through fields.
- Share semantic HTML contracts between Storybook and Drupal, with JavaScript as progressive enhancement.
- Parse each local font once in the browser and derive glyphs, paths, points, metrics, and name-table data from that parsed object.
- Keep downloaded code self-hosted, keyboard accessible, token-driven, and compatible with the existing build pipeline.
- Seed the two records predictably without duplicating them or binding behavior to mutable node IDs.

**Non-Goals:**

- Editing font binaries, adding glyphs to the fonts, exporting the 4×4 drawing, or persisting visitor state.
- Presenting unsupported Unicode ranges, shaping complex text beyond what the selected font/library already supports, or reproducing every macOS Character Viewer control.
- Capturing the proposed Windows screenshot; the content model will accept it later without making it a release dependency.
- Backfilling license fields inside the binary font files. Editorial usage terms remain separate until the font sources themselves are updated.

## Decisions

### Use Project plus structured Paragraphs, not a Font node type

Create a deployable `project` content type and attach the existing `field_content_sections` storage. Add `project_story`, `font_preview`, and `pixel_glyph_editor` Paragraph types; let the Project body provide a concise introduction and let Paragraph order own the long-form sequence. Attach the existing image and tags storages where compatible and provide a `/portfolio` View using the existing Project Card visual language. The listing uses a compact four-column desktop gallery that collapses responsively; each card renders only its optional thumbnail, shared `text-link` title as the single detail-page action, and optional tag Chips. The introductory body remains detail-page content and is omitted from the card.

Project tag rendering reuses the Article tag field structure and shared Chip component, but targets `/portfolio?tag=<slug>`. The Portfolio View reuses the existing `jurenites_blog` tag-slug resolver and Views default-argument plugin so Blog, Videos, and Portfolio share one validated, cache-aware single-tag GET contract instead of linking Projects to taxonomy term pages.

Font preview configuration uses a required list field such as `field_font_identifier` with controlled values `roundabout` and `4pixel`. Theme/module code resolves that identifier through a small allowlisted registry containing asset filename, CSS font family, and download filename. It never infers behavior from title, alias, or NID and never accepts an arbitrary visitor-supplied URL.

Alternative considered: a dedicated Font node type. Rejected because both records are portfolio projects and their stories, listing, publication workflow, and URLs should remain consistent with other Projects. A Font bundle would duplicate those concerns and create a second portfolio silo.

Alternative considered: optional font fields directly on Project. Rejected because those controls would clutter every Project form and could not be reordered among narrative sections.

### Package configuration and missing-only content in one recipe

Add a `jurenites_font_projects` custom module with a recipe that imports its Project, Paragraph, field, display, and Portfolio View configuration. The same recipe declares the two nodes and their Paragraph trees as default content with fixed UUIDs. Drupal's recipe content importer creates only missing UUIDs, so applying the recipe again neither duplicates records nor overwrites editor-owned content. Explicit aliases travel with the records and no behavior relies on runtime node IDs. Keeping content in the recipe also guarantees that field configuration exists before Drupal imports the Paragraph values; an install hook cannot safely make that ordering promise.

Alternative considered: a one-off local Drush script. Rejected because it would create DEV-only state with no repeatable STAGE/PROD path.

Alternative considered: rewriting seeded records on every deployment. Rejected because deployed editorial content must become user-owned after creation.

### Parse fonts with a bundled OpenType library

Add `opentype.js` as a pinned production dependency and import its parser from a dedicated font-preview behavior module reached by the existing esbuild entry. Fetch the same-origin TTF selected by the allowlisted Drupal/Storybook data attributes, cache the parse promise by URL, and use the parsed `Font`/`Glyph` APIs for cmap-backed glyph enumeration, paths, metrics, and name-table values. Bundle the dependency locally; no CDN or runtime third-party request is allowed.

The current files' TTF `glyf` outlines are directly supported, and the library exposes glyph paths, font metrics, point drawing information, advance width, and kerning data. Use TTF rather than WOFF for parsing so the two fonts follow one path; 4pixel may continue using WOFF first in CSS for ordinary rendering.

Alternative considered: extract all metadata and SVG paths at build time. Rejected because it would duplicate font-derived artifacts in source/generated data, increase build complexity, and make the component less reusable with future allowed font assets.

Alternative considered: draw only with the browser's FontFace/Canvas text APIs. Rejected because they do not expose the required outline commands, glyph indices, or embedded name-table metadata.

### Treat the grid as Unicode mappings, not a fabricated Unicode table

Build a deterministic array from the parsed font's cmap mappings, ordered by numeric code point. Resolve each mapping to its glyph and retain entries only when the glyph has a non-empty drawable path; this removes `.notdef`, unsupported slots, and visually empty entries such as spaces. If multiple code points map to the same glyph, each mapping remains navigable while the dialog reports all mappings known for that glyph.

Tiles are semantic buttons. Their compact overlay shows the character, safe glyph label, and correctly padded `U+XXXX` value. CSS Grid uses `repeat(auto-fit, minmax(var(--shape-basic-tile), 1fr))` or a component token that references that dimension, so the grid fills its container without inline width/height/style attributes.

### Render the detail view with native dialog and SVG geometry

The shared font-preview markup includes one native `<dialog>`, a close button using the shared Icon component, named metadata slots, a `<code>` path region, and an SVG without fixed width or height attributes. On selection, JavaScript calculates a viewBox from the glyph bounding box plus metric guides, converts the outline to SVG path data, and creates classed point markers for path endpoints and Bézier controls. CSS owns line, point, and fill colors through existing or newly justified semantic tokens. Rendering happens on demand for the selected glyph rather than materializing hundreds of detailed SVGs.

Native dialog supplies modal focus containment and Escape behavior. The behavior records the opening tile, supplies an explicit accessible name, and restores focus after close. Unsupported `<dialog>` behavior gets a simple in-page detail fallback rather than blocking the grid.

### Keep server markup useful before enhancement

Drupal Twig and Storybook helpers share the same BEM structure and data contract. Initial markup includes headings, the labeled text input, pangram/specimen text, a status message, Data heading, and a real download anchor composed from Button and Icon helpers/templates. JavaScript changes the enhancement state, populates font-derived content with DOM APIs/text nodes, and leaves a visible error message if fetch or parse fails.

The parser must not inject name-table strings or serialized path text as HTML. SVG attributes are built only from numeric commands produced by the parsed allowlisted file. Drupal translations wrap all public UI labels; font metadata and authored names are data, not translated UI.

### Implement the 4×4 editor as accessible toggle buttons

Render 16 buttons from shared markup, each with row/column labeling and `aria-pressed=false`. The enhancement tracks a 16-element Boolean array. Click, Enter, and Space toggle one cell. Pointer-down chooses a paint value, pointer-enter applies it while captured/pressed, and pointer-up/cancel ends painting. The drawing grid is the only visual representation of the glyph; a duplicate Preview section and filled-cell counter would repeat information without helping the drawing task, so neither is rendered.

The blank pattern is deterministic and no localStorage, cookie, request, upload, or binary generation is used. CSS owns all geometry and consumes `shape.basic-tile` for interactive cells.

### Use the shared Icon contract for Download

Render the supplied `arrow-download.svg` through the existing Icon markup/Twig component inside the shared Button.

### Keep Article teaser markup compact

Use a plain `.article-teaser` container rather than Drupal's node-classed `<article>` wrapper in teaser view mode. Preserve the uploaded source image and cap only its rendered teaser media at the existing `component.article-teaser.list-media.max-width.default` token. Render the shared `.article-tags` navigation as the immediate sibling after `.article-teaser__title`, and remove `field_tags` from the later content render so it cannot appear twice. Keep the same structure in Storybook. Keep the Drupal byline sequence aligned with Storybook by placing the date directly after the author and omitting the extra connective `on`.

## Risks / Trade-offs

- [Bundled parser increases JavaScript size] → Import it only through the font-preview module, measure the production bundle, and consider an esbuild split/lazy import only if the actual increase materially affects non-font pages.
- [Global theme script loads on every page] → Gate initialization on the font-preview data attribute and prefer a dynamic import or separate Drupal library if bundle measurement shows a meaningful cost.
- [Malformed fonts can make parsing fail] → Parse only allowlisted same-origin assets, catch all fetch/parse errors, and retain readable fallback/download markup.
- [Embedded license wording may differ from surrounding editorial claims] → Report the exact font metadata in the Data table and keep broader usage statements separately editable rather than silently rewriting binary facts.
- [Tiny 40px tiles cannot carry verbose metadata comfortably] → Use the existing 5px 4pixel technical-label role, preserve an accessible full label, and validate at 360px; the dialog remains the readable detail surface.
- [Seeded long-form copy may need editorial refinement] → Create it as normal revisionable Drupal content and never overwrite an existing stable UUID during routine deployment.
- [Some Unicode mappings share an outline or contain combining marks] → Preserve code-point navigation, expose all glyph mappings in detail, and base inclusion on actual outline content rather than advance width.
- [Existing user changes overlap generated assets] → Inspect diffs before generation, preserve source ownership, and review generated diffs rather than resetting them.

## Migration Plan

1. Add and validate module-owned configuration plus the recipe for Project, Paragraph fields/displays, and the Portfolio View.
2. Add missing-only recipe content with stable UUIDs, aliases, and ordered Paragraph trees; reapply it to verify editor-owned content is preserved.
3. Add source components, parser dependency, behavior, icon, tokens only where required, and Drupal templates/preprocess integration.
4. Build tokens/theme/Storybook, run lint and docs checks, and visually verify both Storybook examples at mobile and desktop widths.
5. Apply the recipe in DEV, clear caches, verify both stable aliases, anonymous listing access, glyph inspection, downloads, and the 4pixel-only editor.
6. Deploy code/config to later environments, apply the same recipe, and verify content UUIDs and aliases before considering the migration complete.

Rollback keeps editorial data recoverable: unpublish the two Projects and remove the Portfolio menu/listing exposure first. Disable the custom module only after removing dependent Paragraph content/config through a reviewed follow-up; do not delete seeded nodes or font assets automatically.
