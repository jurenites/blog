## Why

Projects already share the `tags` vocabulary with Articles, but Portfolio visitors cannot filter the listing by those terms or discover the font projects directly from the footer.

## What Changes

- Show all tags used by accessible published Projects as a persistent Chip list above the Portfolio and filter the listing by its selected shared tag while keeping Article tags routed to Blog or Videos.
- Keep Portfolio marked as the active main-navigation section when a tag query filters its listing.
- Route Project tag links to the matching filtered Portfolio listing.
- Add a Fonts footer link to the Portfolio's font filter with a gray Badge showing the current number of published matching Projects.
- Ensure the initial Roundabout and 4pixel Projects use the shared font term.

## Capabilities

### New Capabilities

- `portfolio/tag-filtering`: Context-aware Project tag links, Portfolio filtering, and the dynamic Fonts footer count.

### Modified Capabilities

None.

## Impact

- Extends the `jurenites_font_projects` Drupal module, Portfolio View, theme preprocess/templates, and footer menu setup.
- Extends the Footer Navigation Storybook example by composing the existing Badge atom.
- Depends on `add-interactive-font-projects` being implemented before this change is applied.
