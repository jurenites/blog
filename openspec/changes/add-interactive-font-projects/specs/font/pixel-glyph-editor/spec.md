## Purpose

Defines a compact, accessible visitor tool for drawing a monochrome 5×5 pixel glyph and seeing the result immediately without modifying or exporting the 4pixel font.

## ADDED Requirements

### Requirement: Editor presents a 5×5 monochrome grid
The pixel glyph editor SHALL render exactly 25 interactive cells arranged as five rows and five columns. Every cell SHALL have a 40px minimum width and height from the shared basic-tile token, use the site's black/white palette with thin gray separators, and begin in a deterministic blank state.

#### Scenario: Editor initializes
- **WHEN** the 4pixel Project's pixel-editor section initializes
- **THEN** it displays five columns by five rows of unfilled cells with no inline presentational sizing in the initial DOM

### Requirement: Visitor can toggle pixels with pointer or keyboard
Each cell SHALL be an accessible toggle with an announced row, column, and selected state. A visitor SHALL be able to toggle individual cells with pointer, touch, Enter, or Space, and pointer dragging across cells SHALL apply the drag's selected or cleared state consistently.

#### Scenario: Visitor activates one cell
- **WHEN** a visitor clicks or presses Enter or Space on an unfilled cell
- **THEN** that cell becomes filled, exposes its selected state programmatically, and the live preview updates immediately

#### Scenario: Visitor draws across cells
- **WHEN** a visitor begins a pointer drag on a cell and crosses other cells
- **THEN** each crossed cell receives the same filled or cleared state chosen at drag start

### Requirement: Editor provides immediate and non-persistent feedback
The editor SHALL present a live enlarged preview of the current 5×5 bitmap and a concise status indicating the number of filled cells. Drawings SHALL remain local to the current page session and SHALL NOT change, upload, or generate a downloadable font file.

#### Scenario: Visitor changes the drawing
- **WHEN** any cell state changes
- **THEN** the enlarged preview and filled-cell status reflect all 25 current cell states without a page reload

#### Scenario: Visitor reloads the page
- **WHEN** the visitor reloads or revisits the Project
- **THEN** the editor returns to its deterministic blank state and no drawing is retrieved from storage or a server

### Requirement: Pixel editor is limited to designated content
The pixel glyph editor SHALL render only when an editor adds its structured section, and the initial seeded content SHALL add it to 4pixel but not Roundabout. A matching Storybook story SHALL demonstrate the same markup and interaction contract used by Drupal.

#### Scenario: Visitor opens Roundabout
- **WHEN** the Roundabout Project has no pixel-editor section
- **THEN** no pixel editor is rendered on that page

#### Scenario: Maintainer opens Storybook
- **WHEN** a maintainer opens the pixel-glyph-editor story
- **THEN** the story provides an interactive 5×5 example using the production component contract

