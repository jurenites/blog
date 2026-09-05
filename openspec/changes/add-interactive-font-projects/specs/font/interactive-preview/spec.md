## Purpose

Defines a browser-based specimen and inspection experience for the site's downloadable custom fonts, limited to characters and metadata that the selected font actually contains.

## ADDED Requirements

### Requirement: Visitor can try the selected font
The font preview SHALL expose a labeled text input initialized with “Try it yourself” and a visible pangram specimen reading “The quick brown fox jumps over the lazy dog.” User edits SHALL update the specimen immediately in the selected font without submitting or reloading the page.

#### Scenario: Visitor edits specimen text
- **WHEN** a visitor changes the preview input
- **THEN** the specimen displays the entered text in the selected Project font during the same interaction

#### Scenario: Font behavior cannot initialize
- **WHEN** the font file cannot be fetched or parsed
- **THEN** the page retains readable project content and download action and presents a human-readable preview error instead of an empty or broken tool

### Requirement: Glyph grid reflects the font's real Unicode coverage
The preview SHALL derive its glyph inventory from the selected font and render one selectable tile for each Unicode mapping whose glyph has a visible outline. It SHALL omit unmapped, `.notdef`, and outline-empty entries rather than presenting a synthetic complete Unicode table. Each tile SHALL display the mapped character plus compact `Glyph:` and `Unicode:` metadata, format Unicode as uppercase hexadecimal prefixed with `U+` and padded to at least four digits, and use a 40px minimum tile size in an auto-fitting grid that consumes the available content width.

#### Scenario: Font has only a subset of Unicode mappings
- **WHEN** the selected font is parsed
- **THEN** the grid contains only its mapped visible glyphs and does not render placeholders for unsupported code points

#### Scenario: Uppercase S is listed
- **WHEN** the font maps uppercase `S`
- **THEN** its tile identifies the character and reports Unicode `U+0053`, not lowercase `s` code point `U+0073`

#### Scenario: Available width changes
- **WHEN** the preview container becomes wider or narrower within a supported viewport
- **THEN** the grid changes its column count while each tile remains at least 40px in both axes and no fixed inline size is added to the initial HTML

### Requirement: Glyph dialog exposes outline and metrics
Selecting a glyph SHALL open an accessible modal dialog styled as a character-inspection view. The dialog SHALL render the glyph's scalable outline at an approximately 160px visual scale, show baseline and relevant font metric guides, distinguish on-curve points from off-curve/control points, and report character, glyph name or safe fallback, glyph index, all mapped Unicode code points, advance width, left side bearing when available, and serialized path commands in a scrollable code region.

#### Scenario: Visitor selects a glyph tile
- **WHEN** a visitor activates a glyph tile by pointer or keyboard
- **THEN** the dialog opens with the selected glyph's outline, point geometry, mappings, metrics, and path data

#### Scenario: Visitor dismisses the dialog
- **WHEN** the visitor uses the close control or Escape
- **THEN** the dialog closes and keyboard focus returns to the tile that opened it

#### Scenario: Font omits a glyph name
- **WHEN** the selected font has no embedded human-readable name for the glyph
- **THEN** the dialog uses the mapped character or a deterministic `glyph-<index>` fallback and does not display an empty label

### Requirement: Font data reports embedded metadata honestly
The preview SHALL include a Data section derived from the selected font. It SHALL report available family, subfamily, full name, PostScript name, version, copyright, license, license URL, units per em, ascender, descender, glyph count, and displayed Unicode-mapping count; an unavailable field SHALL be labeled `Not embedded` rather than inferred from project prose.

#### Scenario: License metadata is absent
- **WHEN** the font contains no license name or URL in its name table
- **THEN** the Data section displays `Not embedded` for those values while any separately authored usage statement remains visibly distinct

### Requirement: Visitor can download the font
Each font preview SHALL provide a native download link to the selected local font file. The action SHALL use the shared Button and Icon contracts with a project-owned download icon, expose an accessible text label, and preserve the source filename.

#### Scenario: Visitor downloads Roundabout
- **WHEN** the visitor activates Download on the Roundabout Project
- **THEN** the browser is offered `roundabout-regular.ttf` from the site's own theme assets

#### Scenario: Visitor downloads 4pixel
- **WHEN** the visitor activates Download on the 4pixel Project
- **THEN** the browser is offered `4pixel.ttf` from the site's own theme assets

### Requirement: Font preview is progressively enhanced and reusable
The initial server-rendered preview SHALL contain meaningful heading, specimen control, status/fallback copy, and download markup. Browser behavior SHALL enhance that markup without requiring a third-party CDN, and the same component contract SHALL be demonstrated in Storybook for both Roundabout and 4pixel.

#### Scenario: JavaScript is unavailable
- **WHEN** a visitor loads a font Project without JavaScript
- **THEN** the story, labeled specimen control, and font download remain present, while the page clearly indicates that glyph inspection requires JavaScript

#### Scenario: Maintainer opens Storybook
- **WHEN** a maintainer opens the font-preview stories
- **THEN** separate Roundabout and 4pixel examples exercise the shared markup and actual local font assets

