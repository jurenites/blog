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

Partition that complete inventory into separate prioritized groups: ASCII numbers, basic Latin capitals, any requested Project-specific extension group, basic Latin lowercase, font-specific language groups, and printable ASCII keyboard symbols. For 4pixel, create separate `cyrillic-uppercase` and `cyrillic-lowercase` groups from explicit ordered allowlists for the 33 uppercase Russian letters and matching 33 lowercase letters, including `Ё` after `Е` and `ё` after `е`; each group receives its own semantic section and `.font-preview__glyph-grid`, while extended Cyrillic mappings remain in the additional-glyph region. For Roundabout, insert a `roundabout-extended-uppercase` group containing the exact ordered sequence `ĀƁĆĎĒƑĜĤĪĴĶĹƜŇǑƤǪƦŚŢŨѴŴХŶŹ` between the basic Latin uppercase and lowercase groups. After basic Latin lowercase, render `greek-uppercase`, then `roundabout-alternate-set` containing `ĀƁГĐĒŹĤƟĨĸɅМŇ≡ƠПƤƩŢŶɸХѰΏ` in that exact order, then `greek-lowercase`. Exclude `U+038F` from `greek-uppercase` because the alternate set owns that placement. Curated groups may intentionally repeat mappings where their supplied sequences overlap; completeness tests therefore compare the set of displayed code points with the font inventory, while additional glyphs exclude every code point used by any primary group. Leave Greek letters without an uppercase or lowercase Unicode classification in additional glyphs. Render every mapping outside those groups in one initially hidden additional-glyphs region. A shared ghost Button with the named `chevron-down` Icon controls the region through `aria-expanded` and `aria-controls`; it is hidden only when no additional mappings exist. Scope a Font Preview override to that ghost Button so its hover border, background, and brand-tertiary content color match the computed secondary Download Button treatment without changing the shared ghost variant.

Tiles are semantic buttons whose only visible child is the mapped character. The accessible button name retains the safe glyph label and correctly padded `U+XXXX` value, while the dialog owns the visible metadata. Every glyph grid uses `repeat(auto-fit, var(--shape-basic-tile))`, so all tiles remain one fixed 40px shared basic-tile wide, unused row space remains undistributed, and excess tiles wrap naturally as the container narrows. No inline width, height, or style attributes are added to the initial markup.

### Render the detail view with native dialog and SVG geometry

The shared font-preview markup includes one native `<dialog>`, a close button using the shared Button component, named metadata slots, a `<code>` path region, and an SVG without fixed width or height attributes. On selection, JavaScript calculates a font-metric viewBox using `GLYPH_BODY_ROW_COUNT = 4`, `GLYPH_OVERSHOOT_ROW_COUNT = 2`, and `GLYPH_DESCENDER_ROW_COUNT = 1`. One font-unit row is the larger of one quarter of the ascender or the absolute descender, so the ascender-to-baseline body remains four equal rows and the complete viewport always reserves two rows above the ascender line plus one row below the baseline. The renderer converts the outline to SVG path data without applying a second serialization flip, then creates classed point markers for path endpoints and Bézier controls in that same coordinate system. CSS sets the visual to seven `shape.basic-tile` rows and owns line, point, and fill colors through existing or newly justified semantic tokens. Rendering happens on demand for the selected glyph rather than materializing hundreds of detailed SVGs.

Apply `FONT_PREVIEW_METADATA_KEY_TYPE` to dialog `<dt>` keys and `FONT_PREVIEW_METADATA_VALUE_TYPE` to their `<dd>` values, matching the Data table. Replace the native `<details>/<summary>` marker with a labeled Path data section and a real `shape.basic-tile` shared ghost Button containing the named `chevron-down` Icon. The Button controls the hidden path `<pre>` through `aria-expanded` and `aria-controls`, and its icon rotates when open. Apply the machine-readable role to the path code and `color.palette.dark-black` to the `<pre>` surface.

The renderer applies the OpenType-to-SVG Y-axis conversion exactly once and serializes that converted path with `flipY: false`. This preserves 4pixel's corrected upright appearance while keeping the outline, point markers, baseline, ascender, descender, and overshoot guides in one baseline-anchored coordinate system; no variant flips the root SVG independently.

Use a same-document View Transition to connect the activated `.font-preview__glyph-tile` with the dialog's centered `.font-preview__glyph-visual` area. JavaScript temporarily moves one fixed `view-transition-name` between source and destination data attributes while the dialog opens inside the transition update callback, avoiding inline geometry styles and duplicate transition names. Use `motion.duration.extra-long` with the decelerate easing for the shared element, remove the temporary attributes when the transition settles or fails, and fall back to the normal dialog opening when the API is unavailable. Skip the movement entirely for `prefers-reduced-motion: reduce`.

Native dialog supplies modal focus containment and Escape behavior. The behavior records the opening tile, supplies an explicit accessible name, and restores focus after close. Unsupported `<dialog>` behavior gets a simple in-page detail fallback rather than blocking the grid.

### Keep server markup useful before enhancement

Drupal Twig and Storybook helpers share the same BEM structure and data contract. Initial markup includes the labeled text input rendered directly in the selected font, a status message, Data heading, and a real download anchor composed from Button and Icon helpers/templates. The input is the only editable preview surface, so no duplicate specimen element or JavaScript value-mirroring listener is used. JavaScript changes the enhancement state, populates font-derived content with DOM APIs/text nodes, and leaves a visible error message if fetch or parse fails.

Set `FONT_PREVIEW_CHARACTER_SIZE = 16px` through `component.font-preview.preview-character-size-default`. Apply it to both the editable input and glyph-tile character for the Roundabout and 4pixel variants so browser text rasterization stays on the intended font grid without changing shared Text Input typography.

Let the Font Preview input wrapper fill the component and remove the composed Text Input control's maximum width only within `.font-preview__input`. Shared Text Input width variants retain their limits elsewhere.

Set `FONT_PREVIEW_METADATA_KEY_TYPE = typography.caption` and `FONT_PREVIEW_METADATA_VALUE_TYPE = typography.machine-readable`. Define the latter as regular 14px Ubuntu Sans Mono so compact system values have a reusable role distinct from both the large numeric display and bold Courier code roles.

The parser must not inject name-table strings or serialized path text as HTML. SVG attributes are built only from numeric commands produced by the parsed allowlisted file. Drupal translations wrap all public UI labels; font metadata and authored names are data, not translated UI.

### Implement the 4×4 editor as accessible toggle buttons

Render 16 buttons from shared markup, each with row/column labeling and `aria-pressed=false`. The enhancement tracks a 16-element Boolean array. Click, Enter, and Space toggle one cell. Pointer-down chooses a paint value, pointer-enter applies it while captured/pressed, and pointer-up/cancel ends painting.

Place one standard 40px `.font-preview__glyph-tile` immediately after the grid in a vertically centered flex row. Inside it, render a 16px 4×4 miniature whose cells mirror the same Boolean pattern on every render. Treat this repeated visual as decorative so it adds no redundant focus stop or screen-reader content; the labeled editor cells remain the accessible source. Keep the previously removed Preview heading and filled-cell counter absent.

Give Font Preview an optional `before_data_content` render slot. In Drupal, when a 4pixel Font Preview paragraph is immediately followed by a pixel-editor paragraph in the Project's authored section list, move that existing editor render array into the slot and remove its original top-level render entry. Storybook passes the same shared editor markup into the slot for its 4pixel composition. This makes `Draw a 4×4 glyph` precede `Data` in server-rendered DOM order without CSS reordering, duplicate markup, title/NID checks, or loss of the editor-owned Paragraph source.

For a Project containing a Font Preview whose structured identifier is `4pixel` or `roundabout`, expose a Project-template composition flag during node preprocess and render the editable body after the complete structured-section collection, immediately before trailing tags. Keep the normal body-before-sections order for other Projects. This changes semantic DOM order without duplicating body markup or inferring identity from a title, alias, or node ID.

Set `PIXEL_EDITOR_EMPTY_COLOR = color.palette.dark-black` and `PIXEL_EDITOR_FILLED_COLOR = color.palette.dark-white`. This gives the editor the same near-black ground and muted-white glyph treatment as the font inspection experience without introducing new color values.

Use `color.palette.dark-black` as the standard Font Preview glyph-tile background as well, so parsed font characters and the drawn miniature share the same ground.

The blank pattern is deterministic and no localStorage, cookie, request, upload, or binary generation is used. CSS owns all geometry and consumes `shape.basic-tile` for interactive cells.

### Use the shared Icon contract for Download

Render the supplied `arrow-download.svg` through the existing Icon markup/Twig component inside the shared Button.

### Keep Article teaser markup compact

Use a plain `.article-teaser` container rather than Drupal's node-classed `<article>` wrapper in teaser view mode. Preserve the uploaded source image and cap only its rendered teaser media at the existing `component.article-teaser.list-media.max-width.default` token. Render the shared `.article-tags` navigation as the immediate sibling after `.article-teaser__title`, and remove `field_tags` from the later content render so it cannot appear twice. Keep the same structure in Storybook. Keep the Drupal byline sequence aligned with Storybook by placing the date directly after the author and omitting the extra connective `on`.

### Let content stacks own external spacing

Use `gap: calc(var(--space-scale-base-gap) * 2)` on the semantic parent containers that arrange Drupal page blocks, Project detail fields and sections, and full Article content fields. Give the rendered Drupal content region a `.layout-content__region` class so the rule targets its real block container instead of relying on anonymous markup. Child components continue to own their internal layout and do not receive compensating external padding.

## Risks / Trade-offs

- [Bundled parser increases JavaScript size] → Import it only through the font-preview module, measure the production bundle, and consider an esbuild split/lazy import only if the actual increase materially affects non-font pages.
- [Global theme script loads on every page] → Gate initialization on the font-preview data attribute and prefer a dynamic import or separate Drupal library if bundle measurement shows a meaningful cost.
- [Malformed fonts can make parsing fail] → Parse only allowlisted same-origin assets, catch all fetch/parse errors, and retain readable fallback/download markup.
- [Embedded license wording may differ from surrounding editorial claims] → Report the exact font metadata in the Data table and keep broader usage statements separately editable rather than silently rewriting binary facts.
- [Tile characters alone do not expose their technical identity visually] → Preserve the full glyph and Unicode identity in the accessible button name and keep visible technical metadata in the dialog.
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
