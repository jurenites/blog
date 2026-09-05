## Why

News becomes outdated quickly, so the homepage needs a small block of recent
external links without turning News into another permanent site section.

## What Changes

- Add a Drupal content type with machine name `news`.
- Show the newest eligible News records only in a homepage Views block.
- Let editors provide a catchy title and source URL; automatically fill the
  source name, source publication time, and thumbnail for YouTube videos and
  ordinary article pages.
- Open each News item's original external source.

## Capabilities

### New Capabilities

- `news/editorial-content`: Editors maintain external News records.
- `news/homepage-highlight`: The homepage presents the recent News block.

### Modified Capabilities

None.

## Impact

Drupal content configuration, a homepage View block, and News theme integration.
