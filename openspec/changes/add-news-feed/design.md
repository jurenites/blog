## Context

The site already uses Drupal nodes, Views, homepage blocks, and a Storybook News
List Item. This change connects those existing pieces.

## Parameters

```text
HOMEPAGE_NEWS_ITEM_LIMIT = 3
```

## Goals / Non-Goals

**Goal:** Provide a compact, source-independent homepage News block.

**Non-Goals:** A News menu item, public News page, or reviving the newsletter
form.

## Decisions

### Use the `news` node bundle

Store an editorial title, external source URL, source name, source publication
time, thumbnail, and Tags. Editors enter only the title and URL; managed fields
remain available for administrative correction.

### Reuse video metadata and page standards

Reuse the existing YouTube metadata and thumbnail workflow. For other HTTP(S)
sources, read Open Graph, article, and JSON-LD metadata, with the hostname as a
source-name fallback. Refresh managed values when the URL changes and preserve
existing values when fetching fails.

### Use one homepage View block

Query published `news` nodes newest-first and limit the result with
`HOMEPAGE_NEWS_ITEM_LIMIT`. Do not add a page display or menu link.

### Reuse the News List Item

Map Drupal fields into the existing News List Item. Its thumbnail and title open
the original external URL.

## Risks / Trade-offs

- [External metadata is missing or blocked] -> Preserve existing values and log
  the failed lookup for diagnosis.
- [Old records accumulate] -> They stay editable but remain outside the block.
