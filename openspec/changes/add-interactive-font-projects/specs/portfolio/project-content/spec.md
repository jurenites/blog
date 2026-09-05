## Purpose

Defines how authored portfolio projects are modeled, published, discovered, and composed from reusable structured sections without turning project stories into template-owned copy.

## ADDED Requirements

### Requirement: Project is a first-class portfolio record
The system SHALL provide a Project content type whose records have a canonical title, editable introductory body, optional hero image, tags, and an ordered collection of structured content sections. Project content SHALL support revisions and normal Drupal publication state.

#### Scenario: Editor creates a general project
- **WHEN** an authorized editor creates a Project with a title and introductory body
- **THEN** the system stores it as a revisionable Project record that can be published independently of Articles and Basic pages

#### Scenario: Editor reorders project sections
- **WHEN** an authorized editor changes the order of a Project's structured sections
- **THEN** the public Project detail page renders those sections in the saved order

### Requirement: Portfolio exposes published projects
The system SHALL provide a public Portfolio listing at `/portfolio` and canonical Project detail aliases beneath `/portfolio/`. The listing SHALL include published Projects and SHALL NOT expose unpublished Projects to anonymous visitors. At supported desktop widths, the listing SHALL render a compact four-column gallery and SHALL collapse to fewer columns at narrower widths. Each Project card SHALL contain only its optional thumbnail, underlined 16px title link, and optional tag Chips; the title link SHALL be the single detail-page action, the introductory body SHALL NOT appear in the card, and the card SHALL NOT render a duplicate `View project` button. Project tags SHALL render as Chip links to `/portfolio?tag=<slug>`, and the Portfolio listing SHALL use that single validated GET value to show only Projects carrying the selected Tags term.

#### Scenario: Visitor opens Portfolio
- **WHEN** an anonymous visitor opens `/portfolio`
- **THEN** the page lists the published Project records in a four-column desktop gallery that responsively collapses, with each card limited to its optional thumbnail, underlined 16px title link, and optional tag Chips
- **AND** no Project card renders its introductory body or a `View project` button

#### Scenario: Visitor encounters unpublished project
- **WHEN** a Project is unpublished
- **THEN** it is absent from the anonymous Portfolio listing and is not publicly accessible through its alias

#### Scenario: Visitor selects a Project tag
- **WHEN** a visitor activates the `Font` tag on a Project card or detail page
- **THEN** the visitor opens `/portfolio?tag=font`, the tag renders with the shared Chip contract, and the listing contains only published Projects tagged `Font`

#### Scenario: Visitor clears a Portfolio tag
- **WHEN** a visitor activates the selected-tag clear action on a filtered Portfolio listing
- **THEN** the visitor returns to `/portfolio` with the complete published Project listing

### Requirement: Font projects use reusable structured sections
The system SHALL make rich project-story, interactive font-preview, and pixel-glyph-editor sections available to Projects. Font-specific behavior SHALL be selected through structured fields rather than title matching, numeric node identifiers, or hardcoded per-node templates.

#### Scenario: Editor adds a font preview to a Project
- **WHEN** an editor adds a font-preview section and selects an available project font
- **THEN** the Project renders the corresponding interactive preview without requiring the Project title or node identifier to match a special value

#### Scenario: Editor adds ordinary narrative around a tool
- **WHEN** an editor places rich project-story sections before and after an interactive section
- **THEN** the public page preserves that authored sequence

### Requirement: Initial font Projects are installed idempotently
The system SHALL provide initial published Project records for Roundabout and 4pixel with stable UUIDs and canonical aliases `/portfolio/roundabout` and `/portfolio/4pixel`. Installation SHALL create a missing record without duplicating an existing record with the same UUID and SHALL preserve normal editorial ownership after creation.

#### Scenario: Fresh site installs the feature
- **WHEN** the font-project feature is installed on a site where neither stable UUID exists
- **THEN** one Roundabout Project and one 4pixel Project are created and published with their canonical aliases

#### Scenario: Installation logic is encountered again
- **WHEN** a stable font-Project UUID already exists
- **THEN** the system does not create a duplicate Project

### Requirement: Roundabout story covers its design rationale
The Roundabout Project SHALL contain editable narrative covering its origin in the SMEP project, its pixel-grid ambition, Windows RGB subpixel edge rendering, the Urbanist and Sulphur Point influences, lowercase-height numerals, circular closure and entry-cut topology, and its stencil-like direction. A Windows comparison screenshot SHALL remain an optional editorial media section so publication does not depend on an unavailable image.

#### Scenario: Visitor reads Roundabout
- **WHEN** a visitor opens the Roundabout Project
- **THEN** the page presents the required design-history topics as authored content alongside the interactive font preview

### Requirement: 4pixel story covers its design rationale
The 4pixel Project SHALL contain editable narrative covering the 2009 logo origin, the original 4×4 uppercase and 3×3 lowercase constraints, the later 5×5 and 3×5 compromises, compact human-readable storage, proportional spacing, screenshot watermark use, DOS VGA code page 437 inspiration, the FontStruct recreation, and an accessibility-conscious comparison with braille that avoids demeaning disabled people.

#### Scenario: Visitor reads 4pixel
- **WHEN** a visitor opens the 4pixel Project
- **THEN** the page presents the required design-history topics, the supplied FontStruct reference, the interactive font preview, and the pixel glyph editor
