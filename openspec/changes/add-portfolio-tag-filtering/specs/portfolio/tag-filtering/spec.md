## Purpose

Defines how shared Tags provide context-aware Portfolio discovery and an accurate footer entry for published font Projects.

## ADDED Requirements

### Requirement: Portfolio can be filtered by a shared tag
The Portfolio listing at `PORTFOLIO_LISTING_PATH` SHALL accept a readable tag slug through `TAG_QUERY_PARAMETER` and show only published Projects carrying the resolved shared term. Above the results, the listing SHALL show a persistent Chip choice for every tag used by an accessible published Project. The selected tag Chip SHALL be visibly marked without a close icon, SHALL remain alongside the other choices, and SHALL link to the unfiltered `PORTFOLIO_LISTING_PATH` so activating it again clears the filter. Activating another Chip SHALL replace the single selected tag. Filtering by query SHALL NOT remove the active state from the Portfolio link in the main navigation.

#### Scenario: Visitor filters font Projects
- **WHEN** a visitor opens the Portfolio listing with `TAG_QUERY_PARAMETER` set to `FONT_TAG_SLUG`
- **THEN** the listing shows only published Projects tagged with `FONT_TAG_LABEL`, keeps all available Project tag Chips visible, and marks the `FONT_TAG_LABEL` Chip as selected without a close icon
- **AND** the Portfolio main-navigation link remains marked as the current page

#### Scenario: Visitor clears the filter
- **WHEN** a visitor activates the selected Portfolio tag Chip again
- **THEN** the browser returns to the unfiltered `PORTFOLIO_LISTING_PATH`

#### Scenario: Visitor chooses another Portfolio tag
- **WHEN** a visitor activates a different tag Chip while one tag is selected
- **THEN** the browser replaces `TAG_QUERY_PARAMETER` with that Chip's readable slug and filters the listing to the newly selected tag

#### Scenario: Tag slug is invalid or ambiguous
- **WHEN** `TAG_QUERY_PARAMETER` does not resolve to exactly one shared Tags term
- **THEN** the Portfolio listing exposes no Projects for that filter and does not broaden the result set

### Requirement: Tag links preserve their content context
Project tag links SHALL target the matching filtered Portfolio listing. Existing Article tag links SHALL continue to target Blog or Videos according to the Article content.

#### Scenario: Visitor follows a Project tag
- **WHEN** a visitor activates a tag on a Project card or Project detail page
- **THEN** the browser opens `PORTFOLIO_LISTING_PATH` filtered by that term's readable slug

#### Scenario: Visitor follows an Article tag
- **WHEN** a visitor activates a tag on an Article
- **THEN** the browser opens the existing Blog or Videos filtered listing rather than the Portfolio listing

### Requirement: Footer exposes the current font Project count
The footer SHALL contain a link labeled `FONT_FOOTER_LABEL` to the `FONT_TAG_SLUG` Portfolio filter and compose a `FONT_BADGE_VARIANT` Badge containing the current number of published, accessible Projects tagged with `FONT_TAG_LABEL`. The count SHALL be calculated from current Project content and SHALL NOT be stored as a fixed initial value.

#### Scenario: Two published font Projects exist
- **WHEN** two accessible published Projects carry `FONT_TAG_LABEL`
- **THEN** the footer Badge displays `2` and the link opens their filtered Portfolio listing

#### Scenario: A matching Project changes publication or tags
- **WHEN** a matching Project is published, unpublished, tagged, or untagged
- **THEN** the footer Badge reflects the new accessible published count after normal Drupal cache invalidation

#### Scenario: Maintainer opens Footer Navigation in Storybook
- **WHEN** the Footer Navigation story renders its Fonts item
- **THEN** it demonstrates the same link and composed gray Badge contract used by Drupal

### Requirement: Initial font Projects share the font term
Roundabout and 4pixel SHALL reference the existing shared Tags vocabulary term identified by `FONT_TAG_LABEL` without removing any other assigned tags.

#### Scenario: Existing font Projects receive the shared term
- **WHEN** the follow-up update runs after the font-project change
- **THEN** both stable Project records reference `FONT_TAG_LABEL` once and retain their other tags
