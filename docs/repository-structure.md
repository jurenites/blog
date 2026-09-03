# Repository Structure

The root `README.md` is the only project-owned README. Detailed folder contracts
live in `/docs` so source directories contain implementation files rather than
separate documentation islands.

## Token Source

`src/token/tokens.yaml` is the editable source of truth for design tokens.

Generated token artifacts live at:

- `generated/styles/_tokens.scss` for CSS and SCSS consumers.
- `generated/token/tokens.js` for Storybook and other JavaScript consumers.

Rebuild both artifacts after changing the YAML source:

```bash
npm run build:tokens
```

Do not edit the generated token artifacts by hand.

## Theme Source

`src/slice/` contains editable frontend source shared by the Drupal theme and
Storybook.

- SCSS source: `src/slice/src/scss/`
- JavaScript source: `src/slice/src/js/`
- Drupal theme output: `web/themes/custom/jurenites_theme/css/style.min.css` and
  `web/themes/custom/jurenites_theme/js/script.min.js`

Build the Drupal theme with:

```bash
npm run build:theme
```

Keep editable styles and scripts under `src/slice/`. The Drupal theme contains
Twig templates and generated minified assets.

`jurenites_theme` is self-contained (`base theme: false`) and does not inherit
from Drupal's deprecated Stable 9 theme. Its handwritten Twig templates and
generated shared assets define the public rendering contract directly.

## Drupal Recipes

Project-owned Drupal setup recipes live under `recipes/`. Apply the media setup
to an installed site with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
```

This enables Media Library and configures reusable Image media for JPEG and
other web-image uploads, plus Remote video media for YouTube and Vimeo URLs.

Apply progressive responsive image delivery with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_progressive_images
```

This recipe enables the maintained Image Blurry Placeholder module and Drupal's
standard responsive image styles. The initial HTML contains the image's width
and height plus an embedded 20px blurry derivative, so the browser reserves the
correct aspect ratio and paints a preview without another network request. The
project-owned `web/modules/custom/jurenites_progressive_images` module adds a
1px loading-state line and pre-generates the preview when Drupal first saves an
image file. This also covers locally cached YouTube/Vimeo thumbnail files in
the Media Library. The browser then selects the appropriate 325px, 650px,
1300px, or 2600px WebP candidate for the layout width and pixel density.

The loading line reports discrete states, not downloaded bytes. Native
responsive image requests intentionally remain under browser control, where
JavaScript does not receive reliable byte-level progress events.

The blurry derivative is painted in a separate decorative layer. The native
`img` remains unfiltered, so browser-provided alt text and broken-image feedback
are never blurred. Local PHP allows 512 MB for GD because large source photos
are decompressed into memory while Drupal creates responsive derivatives.

Apply the accessible two-image comparison feature with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_image_comparison
```

This recipe enables Image Compare Accessible Slider and its Media integration,
then creates an Image comparison content type with a two-item Image media field.

Apply Paragraphs and the lightweight automatic two-image crossfade with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_paragraphs_crossfade
```

The recipe adds Content sections to Articles and Basic pages. The project-owned
`web/modules/custom/jurenites_crossfade` module supplies the exact-two-image
validation, formatter, two-second holds, half-second opacity transitions,
infinite loop, image-load guard, and reduced-motion fallback without a carousel
dependency. Hold and transition durations are formatter settings under Manage
display. Two 4px pagination dots expose the active image and allow direct
selection; automatic rotation pauses while the pointer is over the image area.

The Composer project also installs stable Layout Paragraphs 2.x. DEV enables it
with core Layout Discovery so the existing Paragraph reference field can later
adopt its visual drag-and-drop widget and formatter. Installation alone does not
change the Content sections form or public rendering: those continue using the
classic Paragraphs configuration until the project adds an explicit layout
section component and switches the field displays.

Add repeatable Number and Description tiles to those Content sections with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_numeric_values
```

The Numeric Values section uses a nested Numeric Value Paragraph for each tile.
An optional Start year calculates elapsed years automatically, allowing the
`2010` professional-experience value to stay current without content edits.

Apply the structured Basic page heading controls with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_two_tone_heading
```

The `jurenites_two_tone_heading` module provides one compound field type and
widget. Basic page editors keep using the native Title for the first strong
segment, then edit Title 2, Title 3, and their placement controls in one field.
The active theme renders that data through the shared Two-tone Heading component
as the page's semantic `h1`.

Apply the project administration setup to install Gin, force its dark
appearance, and add Jurenites browser and toolbar branding:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_admin
```

The recipe enables the project-owned `web/modules/custom/jurenites_admin`
module. Its Gin-only library replaces the Drupal toolbar droplet with
`web/themes/custom/jurenites_theme/favicon.svg`. Gin's browser tab uses the
fixed inverted `favicon-admin.svg` mark so admin tabs stay visually distinct
from the adaptive public-site favicon. The same module keeps Article comments
open, grants public read access, and reserves comment posting and own-comment
editing for the Content editor role. Other content comment fields remain
closed.

Apply the public privacy-policy route with:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_privacy
```

The `jurenites_privacy` module creates an editable, published Basic Page at
`/privacy-policy`, adds its link to Drupal’s secondary Footer menu, creates the
Cookie Policy Notice as a reusable Basic Content Block, and places both blocks
in the theme’s Footer region. Editors own the notice title through the block
placement label and its paragraphs through the Content Block body. The notice
does not set cookies or create a browser identifier. Its
single “Whatever” action stores the versioned boolean
`jurenites-cookie-notice-dismissed-v2` preference in `localStorage` and hides
the notice; when storage is unavailable, dismissal lasts only for the current
page view. The block starts hidden and is revealed only after that preference is
checked, preventing a dismissed notice from flashing during page load. It floats
above the bottom viewport edge while remaining a non-modal footer block. The
notice and policy page remain separate Drupal content responsibilities.

## Media Upload Infrastructure

Image media has an explicit 200 MB Drupal field limit. Supporting request limits
are source controlled across the local stack:

- `docker/php-upload.ini`: 200 MB file and 210 MB POST limits.
- `docker/apache-upload.conf`: 210 MiB request-body limit.
- `docker/local-proxy.conf`: 210 MiB Nginx body limit and 300-second timeouts.
- `recipes/jurenites_media/recipe.yml`: 200 MB Image media field validation.

The request limits intentionally exceed the file limit to allow multipart form
overhead. Any future File, Document, Audio, or local Video media field needs its
own Drupal field limit even though the server-level limits already allow it.

## Generated Artifacts

Files under `generated/` are derived from editable source and must not be edited
by hand. The token build currently produces:

- `generated/styles/_tokens.scss`, consumed by the Drupal theme and Storybook.
- `generated/token/tokens.js`, consumed by Storybook controls and token-driven
  JavaScript.

The source for both files is `src/token/tokens.yaml`. Regenerate them with
`npm run build:tokens`.

## Dependency Documentation

Composer dependencies under `vendor/` and Drupal scaffold files under `web/`
may contain upstream README files. They are ignored, third-party files rather
than project documentation, and dependency installation may recreate them.
