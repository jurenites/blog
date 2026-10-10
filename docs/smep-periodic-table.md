# Drupal periodic table block

`jurenites_smep_periodic` is a Drupal 11 module with an independently placeable
**SMEP periodic table** block. Each instance has its own initial card size. The
complete interactive table runs in a same-origin iframe, keeping game styles,
fonts, IDs and events separate from Drupal and other block instances.

## Build and install

From the SMEP application root:

```sh
node scripts/build-drupal-periodic.mjs
```

Copy `integrations/drupal/jurenites_smep_periodic` into the Drupal site's
`web/modules/custom/`, including the generated `ui/` directory. Enable the module
with `drush en jurenites_smep_periodic` and clear caches with `drush cr`.

In **Structure > Block layout > Place block**, choose **SMEP periodic table**.
Choose a title, initial card size, region and page visibility. Multiple instances
are supported. Placement is Drupal configuration, not hardcoded into the module.

Small cards are the default for new instances. The local SMEP page uses full
84 × 108px cards. The block extends beyond the article column to the available
viewport width, with horizontal scrolling when the viewport cannot fit the table.
The iframe follows the table content height, with 64px of vertical padding around
the grid for radiation glow. It does not have a separate vertical scrollbar.
The Expand and Open separately controls are hidden. Opening element cards retains the animated deck and stationary
miniature periodic paginator. Motion pauses when the host block is offscreen or
the browser tab is hidden. Reduced-motion preferences remain respected.

The packaged UI needs no SMEP server, API, Node process, CDN or remote fonts.
Generated files must be deployed with the module. Rebuild them in SMEP instead of
editing them in Drupal. `ui/build.json` identifies the asset bundle, and asset
URLs have a content hash for cache invalidation. The game UI currently uses its
existing English copy; the surrounding Drupal controls and block title support
Drupal translation.

The local jurenites instance places the block after the main content on the SMEP
portfolio page. Deploying the module code does not deploy that local placement or
enable the module on production; those are separate Drupal configuration steps.
