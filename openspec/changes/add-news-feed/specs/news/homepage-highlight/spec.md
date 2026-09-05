## Purpose

Defines a homepage-only News block that presents the most recent eligible
external records as attractive previews linking to their original sources.

## ADDED Requirements

### Requirement: Homepage-only recent News
The homepage SHALL show published `news` records newest-first and bounded by
`HOMEPAGE_NEWS_ITEM_LIMIT`. The system SHALL NOT add a News page or main-menu
item.

#### Scenario: Homepage has more eligible records than the limit
- **WHEN** eligible News records exceed `HOMEPAGE_NEWS_ITEM_LIMIT`
- **THEN** the homepage shows only the newest records within that limit

### Requirement: Preview opens the original source
Each preview SHALL show its editorial thumbnail, title, source, Tags, and source
age; its thumbnail and title SHALL open the stored external URL.

#### Scenario: Visitor opens News
- **WHEN** a visitor activates a News thumbnail or title
- **THEN** the original external source opens
