## Purpose

Defines a source-independent Drupal record for manually curated external News
links with editorial control over their clickable presentation.

## ADDED Requirements

### Requirement: Dedicated News records
The system SHALL provide a Drupal content type with machine name `news` whose
records require an editorial title and external source URL. Source name, source
publication time, and thumbnail SHALL be managed automatically; Tags remain
optional.

#### Scenario: Editor publishes external News
- **WHEN** an editor publishes a complete `news` record for a video or article
- **THEN** the record becomes eligible for the homepage News block

### Requirement: Source-independent previews
The News model SHALL accept any valid external web source without requiring a
YouTube-specific field or workflow.

#### Scenario: Editor uses an article source
- **WHEN** an editor saves a title and newspaper article URL
- **THEN** the system fills available source name, publication time, and
  thumbnail metadata for the same News preview used by video sources

#### Scenario: Editor uses a YouTube source
- **WHEN** an editor saves a title and YouTube URL
- **THEN** the system fills source name, publication time, and thumbnail using
  the existing video metadata workflow

#### Scenario: Source URL changes
- **WHEN** an editor replaces a News record's source URL
- **THEN** managed metadata is refreshed from the new source

#### Scenario: Metadata is unavailable
- **WHEN** a source does not expose one or more supported metadata values
- **THEN** the save completes without replacing existing values with invalid
  data
