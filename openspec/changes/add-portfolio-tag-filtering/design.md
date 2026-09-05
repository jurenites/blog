## Context

The completed `add-interactive-font-projects` change provides the `project` bundle, shared `field_tags`, a published-Project View, and the two font Projects. Article tag filtering already resolves readable tag slugs through `jurenites_blog`; the footer is a Drupal menu rendered by the Footer Navigation organism.

## Goals / Non-Goals

**Goals:**

- Reuse the existing vocabulary, slug resolver, Chip, Badge, and Footer Navigation contracts.
- Keep the footer count correct for the currently published matching Projects and Drupal's render cache.
- Make the follow-up deployable to sites where the font-project recipe has already run.

**Non-Goals:**

- Separate Blog and Portfolio vocabularies.
- A general taxonomy landing page or a count of font files, Paragraphs, or CSS families.

## Decisions

### Declare the shared values once

- `PORTFOLIO_LISTING_PATH = "/portfolio"`
- `TAG_QUERY_PARAMETER = "tag"`
- `FONT_TAG_LABEL = "#Font"`
- `FONT_TAG_SLUG = "font"`
- `FONT_FOOTER_LABEL = "Fonts"`
- `FONT_BADGE_VARIANT = "gray"`

### Extend the existing readable-tag filtering path

Add the same taxonomy-term argument used by Blog and Videos to the Portfolio View. Project tag fields use `PORTFOLIO_LISTING_PATH`, while Article routing remains bundle- and video-aware. Above the listing, query tags from all accessible published Projects and keep those choices visible as shared Chip links even while results are filtered. The active Chip uses the selected state without a close icon and links to `PORTFOLIO_LISTING_PATH` so activating it again clears the filter; activating another Chip replaces the single `TAG_QUERY_PARAMETER` value.

Reusing `jurenites_blog.tag_slug_resolver` avoids a competing slug algorithm. The Project module therefore declares the Blog module dependency instead of moving a stable shared service during this focused change.

The tag-choice list varies with Project publication, tag assignment, term access, and `TAG_QUERY_PARAMETER`. It carries Project node-list, Tags vocabulary, permission, node-grant, language, and selected-query cache metadata so filtering never leaves a stale or permission-inappropriate choice row.

Main-navigation active state follows Drupal's route active trail, not an exact rendered URL match. Because `TAG_QUERY_PARAMETER` changes only the Portfolio query and not its route, the `/portfolio` menu link keeps `aria-current="page"` and the shared active class on every valid filtered Portfolio URL.

### Count published tagged Projects at render time

The footer Badge count comes from an access-checked query for published `project` nodes referencing the resolved `FONT_TAG_LABEL` term. It is not stored on the menu link and is not derived from the two seeded UUIDs. Cache metadata varies by relevant node, taxonomy, and access contexts so publishing or retagging a Project invalidates the displayed count.

The Drupal footer menu link is created idempotently and identified by its internal URI, not by a node ID. The footer template composes the existing gray Badge only for that item; Storybook uses the same Footer Navigation markup helper and Badge helper.

### Update existing installations without replacing editor tags

An idempotent update resolves the shared term by `FONT_TAG_SLUG`, appends it to Roundabout and 4pixel by their stable UUIDs when missing, ensures the footer link, and updates the installed Portfolio View. Existing unrelated tags remain untouched. Recipe default content carries the same reference for fresh installations.

## Risks / Trade-offs

- [The shared resolver lives in a Blog-named module] -> Declare the dependency now; service extraction is outside this feature.
- [A duplicate term can produce an ambiguous slug] -> Reuse the stable term UUID during deployment and fail the filter closed if duplicate labels already exist.
- [A cached footer can show a stale count] -> Attach node-list and taxonomy cache tags plus access-related cache contexts to the rendered menu.

## Migration Plan

Apply this change only after `add-interactive-font-projects`. Deploy code/config, run the idempotent Drupal update, clear caches, and verify unfiltered and filtered Portfolio pages plus the footer count anonymously. Rollback disables the footer link and removes the View argument; it does not delete the shared term or remove editor-owned tags.
