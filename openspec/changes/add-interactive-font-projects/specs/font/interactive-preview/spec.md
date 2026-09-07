## Purpose

Defines a browser-based preview and inspection experience for the site's downloadable custom fonts, limited to characters and metadata that the selected font actually contains.

## ADDED Requirements

### Requirement: Visitor can try the selected font
The font preview SHALL expose a labeled “Try it yourself” text input initialized with a pangram and rendered directly in the selected Project font. The component SHALL NOT render a second element that mirrors the input value; user edits remain visible in the input through native form-control behavior without submitting or reloading the page.

#### Scenario: Visitor edits preview text
- **WHEN** a visitor changes the preview input
- **THEN** the input displays the entered text in the selected Project font during the same interaction and no synchronized duplicate text appears

#### Scenario: Custom-font preview text is grid-aligned
- **WHEN** the Roundabout or 4pixel preview renders its input and glyph tiles
- **THEN** the input text and each glyph character use `FONT_PREVIEW_CHARACTER_SIZE` without changing the shared Text Input component globally

#### Scenario: Preview input fills the available width
- **WHEN** either font preview renders its editable input
- **THEN** the Font Preview wrapper and composed Text Input control consume the available component width without changing shared Text Input width variants elsewhere

#### Scenario: Font behavior cannot initialize
- **WHEN** the font file cannot be fetched or parsed
- **THEN** the page retains readable project content and download action and presents a human-readable preview error instead of an empty or broken tool

### Requirement: Glyph grid reflects the font's real Unicode coverage
The preview SHALL derive its glyph inventory from the selected font and render selectable tiles for Unicode mappings whose glyphs have visible outlines. It SHALL omit unmapped, `.notdef`, and outline-empty entries rather than presenting a synthetic complete Unicode table. Each tile SHALL display only the mapped character while retaining the safe glyph label and correctly formatted Unicode value in its accessible name. Each tile SHALL use `color.palette.dark-black` as its default background. Unicode SHALL use uppercase hexadecimal prefixed with `U+` and padded to at least four digits. The initial glyph groups SHALL appear in this order: ASCII numbers, basic Latin capitals, any requested Project-specific extension group, basic Latin lowercase, the Project font's relevant secondary-script letter groups, and printable ASCII keyboard symbols. Curated Project-specific groups MAY intentionally repeat a mapping already visible in another curated group while the collapsed additional region SHALL contain only mappings absent from every primary group. 4pixel SHALL prioritize the Russian uppercase alphabet followed by the Russian lowercase alphabet as two separate groups, with `Ё` after `Е` and `ё` after `е`. Roundabout SHALL place its explicitly ordered extended-capital set after basic Latin capitals and before basic Latin lowercase, then render Greek capital letters, its requested mixed-script alternate set, and Greek lowercase letters as three separate groups. `U+038F` SHALL appear only in the alternate set among those three groups. All remaining mappings SHALL remain available in a collapsed region controlled by an accessible shared Button/Icon chevron control. Every glyph group SHALL use fixed `shape.basic-tile` tracks; tiles SHALL remain 40px wide instead of growing into unused horizontal space and SHALL wrap onto additional rows as available width changes.

#### Scenario: Font has only a subset of Unicode mappings
- **WHEN** the selected font is parsed
- **THEN** the grid contains only its mapped visible glyphs and does not render placeholders for unsupported code points

#### Scenario: Uppercase S is listed
- **WHEN** the font maps uppercase `S`
- **THEN** its tile displays only `S` while its accessible name identifies Unicode `U+0053`, not lowercase `s` code point `U+0073`

#### Scenario: Available width changes
- **WHEN** the preview container becomes wider or narrower within a supported viewport
- **THEN** the grid changes its column count and wraps overflow onto additional rows while every tile remains exactly one 40px `shape.basic-tile` track wide with no fixed inline size in the initial HTML

#### Scenario: Visitor scans number glyphs
- **WHEN** the Roundabout or 4pixel numeric glyph group renders its ten tiles
- **THEN** each tile follows the same fixed `shape.basic-tile` grid contract as every other glyph group instead of expanding to distribute unused horizontal space

#### Scenario: Visitor scans familiar glyphs first
- **WHEN** either font preview finishes loading
- **THEN** numbers, Latin capitals, Latin lowercase, the selected font's prioritized language letters, and keyboard symbols render as separate groups in that order

#### Scenario: Visitor scans Roundabout Greek letters
- **WHEN** the Roundabout preview finishes loading
- **THEN** Greek capital and lowercase letters render in separate `.font-preview__glyph-grid` elements on opposite sides of the Roundabout alternate glyph set, and uncased Greek mappings remain in additional glyphs

#### Scenario: Visitor scans the Roundabout extended capital set
- **WHEN** the Roundabout preview finishes loading
- **THEN** a separate glyph group containing only `ĀƁĆĎĒƑĜĤĪĴĶĹƜŇǑƤǪƦŚŢŨѴŴХŶŹ` in that exact order renders immediately after `latin-uppercase` and immediately before `latin-lowercase`

#### Scenario: Visitor scans the Roundabout alternate glyph set
- **WHEN** the Roundabout preview finishes loading
- **THEN** a separate glyph group containing only `ĀƁГĐĒŹĤƟĨĸɅМŇ≡ƠПƤƩŢŶɸХѰΏ` in that exact order renders immediately after `greek-uppercase` and immediately before `greek-lowercase`
- **AND** `U+038F` is absent from `greek-uppercase` and appears as the final tile of the alternate group

#### Scenario: Visitor scans the 4pixel Cyrillic letters
- **WHEN** the 4pixel preview finishes loading
- **THEN** Cyrillic capital letters render in their own `.font-preview__glyph-grid` containing only `АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ` immediately before a separate Cyrillic lowercase `.font-preview__glyph-grid` containing only `абвгдеёжзийклмнопрстуфхцчшщъыьэюя`, and every other Cyrillic mapping remains in additional glyphs

#### Scenario: Visitor requests less common glyphs
- **WHEN** the visitor activates the collapsed chevron control
- **THEN** every remaining drawable Unicode mapping becomes visible and the control exposes its expanded state programmatically

#### Scenario: Visitor hovers the additional-glyph control
- **WHEN** the visitor hovers the Font Preview additional-glyph ghost Button
- **THEN** it uses the same border, background, and brand-tertiary content hover treatment as the secondary Download Button

### Requirement: Glyph dialog exposes outline and metrics
Selecting a glyph SHALL open an accessible modal dialog styled as a character-inspection view. When same-document View Transitions are available and reduced motion is not requested, the selected tile SHALL smoothly translate and grow into the centered glyph-vector area instead of making the enlarged vector appear immediately. The dialog SHALL render the glyph's scalable outline in a baseline-anchored seven-row metric viewport: four 40px rows from the font ascender line to the baseline, two 40px overshoot rows above the ascender line, and one 40px descender row below the baseline. The path, baseline, ascender, descender, advance-width guides, and point markers SHALL share one coordinate system so tall marks and descenders remain aligned and visible. The dialog SHALL report character, glyph name or safe fallback, glyph index, all mapped Unicode code points, advance width, left side bearing when available, and serialized path commands in a scrollable code region. Dialog metadata keys SHALL use `FONT_PREVIEW_METADATA_KEY_TYPE` and values SHALL use `FONT_PREVIEW_METADATA_VALUE_TYPE`. Path data SHALL start collapsed behind an accessible basic-tile-sized shared Button containing the project Chevron Icon instead of a browser-native disclosure marker, and its `<pre>` surface SHALL use `color.palette.dark-black`.

#### Scenario: Visitor selects a glyph tile
- **WHEN** a visitor activates a glyph tile by pointer or keyboard
- **THEN** the selected tile smoothly grows from its grid position into the centered dialog vector area before settling on the glyph's outline, point geometry, mappings, metrics, and path data

#### Scenario: Visitor prefers reduced motion
- **WHEN** a visitor activates a glyph tile while reduced motion is requested
- **THEN** the dialog opens directly without the tile-to-vector movement and retains the same content, focus, and dismissal behavior

#### Scenario: Visitor expands path data
- **WHEN** the visitor activates the Path data Chevron Button
- **THEN** the serialized path block becomes visible, the Chevron rotates, and the control exposes its expanded state programmatically

#### Scenario: Visitor dismisses the dialog
- **WHEN** the visitor uses the close control or Escape
- **THEN** the dialog closes and keyboard focus returns to the tile that opened it

#### Scenario: Font omits a glyph name
- **WHEN** the selected font has no embedded human-readable name for the glyph
- **THEN** the dialog uses the mapped character or a deterministic `glyph-<index>` fallback and does not display an empty label

#### Scenario: 4pixel detail vector has the intended orientation
- **WHEN** a visitor opens a 4pixel glyph detail dialog
- **THEN** the outline retains its corrected upright orientation without flipping the SVG metric guides or separating its point markers from the path

#### Scenario: Visitor inspects a tall or descending glyph
- **WHEN** a selected glyph extends above the normal four-row body or below the baseline
- **THEN** the fixed viewport keeps the baseline six rows from its top, preserves two full overshoot rows above the ascender line, and preserves one full descender row below the baseline

### Requirement: Font data reports embedded metadata honestly
The preview SHALL include a Data section derived from the selected font. It SHALL report available family, subfamily, full name, PostScript name, version, copyright, license, license URL, units per em, ascender, descender, glyph count, and displayed Unicode-mapping count; an unavailable field SHALL be labeled `Not embedded` rather than inferred from project prose.

#### Scenario: License metadata is absent
- **WHEN** the font contains no license name or URL in its name table
- **THEN** the Data section displays `Not embedded` for those values while any separately authored usage statement remains visibly distinct

#### Scenario: Font metadata uses key-value typography
- **WHEN** the Data table renders a metadata row
- **THEN** its first-column key uses `FONT_PREVIEW_METADATA_KEY_TYPE` and its second-column value uses `FONT_PREVIEW_METADATA_VALUE_TYPE`

### Requirement: Visitor can download the font
Each font preview SHALL provide a native download link to the selected local font file. The action SHALL use the shared Button and Icon contracts with a project-owned download icon, expose an accessible text label, and preserve the source filename.

#### Scenario: Visitor downloads Roundabout
- **WHEN** the visitor activates Download on the Roundabout Project
- **THEN** the browser is offered `roundabout-regular.ttf` from the site's own theme assets

#### Scenario: Visitor downloads 4pixel
- **WHEN** the visitor activates Download on the 4pixel Project
- **THEN** the browser is offered `4pixel.ttf` from the site's own theme assets

### Requirement: Font preview is progressively enhanced and reusable
The initial server-rendered preview SHALL contain a labeled preview input, status/fallback copy, and download markup. Browser behavior SHALL enhance that markup without requiring a third-party CDN, and the same component contract SHALL be demonstrated in Storybook for both Roundabout and 4pixel.

#### Scenario: JavaScript is unavailable
- **WHEN** a visitor loads a font Project without JavaScript
- **THEN** the story, labeled preview input, and font download remain present, while the page clearly indicates that glyph inspection requires JavaScript

#### Scenario: Maintainer opens Storybook
- **WHEN** a maintainer opens the font-preview stories
- **THEN** separate Roundabout and 4pixel examples exercise the shared markup and actual local font assets
