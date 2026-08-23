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

Apply the project administration setup to install Gin, force its dark
appearance, and add Jurenites browser and toolbar branding:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_admin
```

The recipe enables the project-owned `web/modules/custom/jurenites_admin`
module. Its Gin-only library replaces the Drupal toolbar droplet with
`web/themes/custom/jurenites_theme/favicon.svg`. Gin's browser tab uses the
fixed inverted `favicon-admin.svg` mark so admin tabs stay visually distinct
from the adaptive public-site favicon.

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
