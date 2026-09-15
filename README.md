# Personal site Alexander Ilivanov / @jurenites.

Please Don't hack me, I've showed to internet my code in form of opensource, because I have nothing to hide and demonstration the way of work delievered and you may evaluate it.
I'm fine with that if you are white hakerr foudn wornulabilities,  would be glad to hear from you.

This repository is the working system for a personal blog, portfolio, CV timeline,
and public design/development process. The repo is intentionally readable: design
tokens, Storybook components, Figma sync, and the Theme should all point
back to one understandable source instead of several competing mirrors.

## Direction

- CMS: Drupal.
- Purpose: personal promotion, networking, portfolio, and long-form writing.
- Design source: Figma file `blog-jurenites`.
- Design token source: `src/token/tokens.yaml`.
- Component proving ground: Storybook.
- Runtime environments: local Docker DEV, STAGE review, and PROD delivery with
  separate content, media, and host configuration.

The agreed [workflow](docs/workflow.md) follows the twelve milestones in the
[Cookbook](docs/cookbook-product-design-process.md): product purpose, roles and
concepts, grayscale exploration, forms and glossary, tokens, Figma, Storybook,
documentation and backlog, Drupal with real data, and verification. Feedback
can return to any affected decision. Small tasks use only the relevant steps.

The first local [component-status dashboard](docs/visual-testing-plan.md) lists
Storybook components and records rendering and screenshot checks against Drupal.
Run `npm run status:build`, `npm run status:serve`, and `npm run status:test`.
Figma pixel comparison and automatic CI ingestion remain future work.

Current Figma file:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

## Repository Shape

```text
src/token/tokens.yaml             Editable design-token source of truth
generated/styles/_tokens.scss     Generated SCSS token artifact
generated/token/tokens.js         Generated JS token artifact for Storybook logic
scripts/figma/design-system-sync.js
                                  Figma sync helper that reads generated tokens
src/slice/                        Source SCSS/JS for the Theme and Storybook
src/stories/                      Storybook examples grouped by type
src/styles/storybook.scss         Storybook-only documentation/canvas styling
src/public/                       Static assets served to Storybook
docs/                             Project documentation and planned runbooks
web/                              Drupal public web root
web/themes/custom/jurenites_theme Built custom Drupal theme
web/modules/custom/jurenites_tokens
                                  Small Drupal token bridge module
vendor/                           Local Composer dependencies, ignored by Git
node_modules/                     Local npm dependencies, ignored by Git
```

`vendor/` stays at the repository root, outside `web/`, because `web/` is the
public document root. This is the safer standard Drupal/Composer layout.

Detailed folder contracts are maintained in
[`docs/repository-structure.md`](docs/repository-structure.md). This root file is
the only project-owned README; longer-lived project documentation belongs under
`docs/`.

## Token Pipeline

`src/token/tokens.yaml` is the only editable token file. Do not edit generated
token artifacts by hand.

The current build path is:

```text
src/token/tokens.yaml
  -> generated/styles/_tokens.scss for CSS, Storybook preview styling, and Drupal theme CSS
  -> generated/token/tokens.js for Storybook controls and token-driven JS
  -> generated/storybook/storybook-tokens.css for the Storybook manager at build time
  -> scripts/figma/design-system-sync.js reads generated tokens when Figma sync is needed
```

There are no generated token JSON mirrors in the normal workflow. JS consumers
read `generated/token/tokens.js`, not the compiled SCSS/CSS output, so the data
flow stays direct: YAML to CSS for styling, YAML to JS for logic.

Useful commands are collected in the
[`docs/command-cheat-sheet.md`](docs/command-cheat-sheet.md), with DEV and PROD
kept separate. Common source commands:

```bash
scripts/sync.sh all       # build tokens + theme + Figma prep
npm run build:tokens      # generate tokens, then validate the token contract
npm run tokens:check      # reject copied/lowercase HEX and missing CSS token variables
npm run storybook         # build tokens, then run Storybook on port 6006
npm run build-storybook   # build tokens, then build static Storybook
npm run figma:prepare     # build tokens before running the Figma sync helper
npm run docs:check        # check docs version and source/docs drift
npm run build:theme       # compile Drupal CSS/JS and copy deployable theme fonts
npm run build:info        # refresh generated Storybook version/commit metadata
npm run build:info:check  # reject metadata generated for an older Git HEAD
npm run version:check     # verify package, lockfile, docs, and release versions agree
npm run version:bump      # prepare the next minor release version

```

The `jurenites_media` recipe enables Drupal's Media Library and provides two
reusable media types: Image for JPEG and other web-image uploads, and Remote
video for YouTube or Vimeo URLs. Drupal stores the remote video URL and embeds
the hosted video; it does not upload video files to YouTube.

The `jurenites_progressive_images` recipe reserves intrinsic image space,
embeds a cached 20px blurry preview in the initial HTML, and enables responsive
WebP candidates for normal and high-density displays. Its 1px loading line
shows placeholder, image-request, complete, and error states without replacing
the browser's native responsive-image selection. Preview generation runs when
Drupal saves image files, including locally cached remote-video thumbnails.
Article blog-list images use a layout-specific responsive candidate set so the
browser can select a 325px, 650px, or 1300px derivative for the rendered width
and pixel density, including the stacked layout below 641px. The preview uses
its own decorative layer, leaving native image alt/error rendering unfiltered.
PHP has a 512 MB local memory allowance so GD can process large source
photographs into responsive derivatives.

The `jurenites_image_comparison` recipe enables the stable Image Compare
Accessible Slider and its Media integration, then provides an Image comparison
content type. Create one at `/node/add/image_comparison`, select exactly two
aligned Image media items, and order them left image first and right image
second. Visitors can drag the divider with a pointer or use the keyboard.

The `jurenites_paragraphs_crossfade` recipe enables Paragraphs and adds Content
sections to Articles and Basic pages. Its Two-image crossfade section requires
exactly two aligned Image media items, holds each image for two seconds,
crossfades for half a second, and loops indefinitely. The animation starts only
after both images load and remains static when reduced motion is requested.
Manage display exposes the hold and crossfade durations. Two 4px pagination
dots show the active image and can select either frame, while pointer hover
pauses automatic rotation.

Layout Paragraphs is installed and enabled alongside Paragraphs, providing the
supported visual layout widget and formatter for future drag-and-drop content
sections. Existing Article and Basic page Content sections retain their classic
Paragraphs widget until a layout-section Paragraph type and the corresponding
form/view display configuration are deliberately introduced.

## Media Upload Limit

Drupal Image media accepts files up to 200 MB. The runtime allows 210 MB for the
complete multipart request so a 200 MB file still has room for form overhead:

- Drupal Image field: `200 MB`.
- PHP `upload_max_filesize`: `200M`.
- PHP `post_max_size`: `210M`.
- Nginx `client_max_body_size`: `210m`.
- Apache `LimitRequestBody`: `220200960` bytes (210 MiB).

These values are defined in the media recipe and under `docker/`. Rebuild and
restart the web/proxy containers after changing them. Remote YouTube media stores
a URL and is unaffected because the video file is not uploaded to Drupal.

For Article YouTube references, saving a new video URL stores an editable
creator name, creator link, original source date, and local thumbnail. Public
list/detail bylines credit that source instead of presenting the Drupal node
owner as the writer; the owner remains available to Drupal for normal editorial
history. Personal Articles without a YouTube URL retain the standard owner
byline and display an editor-attached Image on both the Blog preview and full
Article page.

## Styling Rules

Storybook templates in `src/stories/**/*.template.html` should stay structural:

- no embedded `<style>` blocks
- no inline `style=""` attributes
- styling lives in SCSS/CSS
- dynamic token demos use generated utility classes, not inline styles

Each visible Storybook example owns a dedicated folder inside its type group.
For example, Button lives in `src/stories/atoms/button/`, and Article Teaser
lives in `src/stories/molecules/article-teaser/`. Shared helpers stay one level
up only when multiple stories need them.

Project ignore rules are consolidated in the root `.gitignore`. Nested `.gitignore`
files are avoided for project-owned source so there is one obvious place to look.

## Local Development

Install dependencies:

```bash
composer install
npm install
```

Run Drupal locally:

```bash
docker compose up -d
docker compose ps
curl -I http://jurenites.local/
```

After installing Drupal, enable local automated cron with the standard
three-hour interval:

```bash
docker compose exec web vendor/bin/drush config:set automated_cron.settings interval 10800 -y
```

The same setting is available at
[`/admin/config/system/cron`](http://jurenites.local/admin/config/system/cron) by
selecting **Every 3 hours**. The Docker web container does not run a separate
cron daemon; Drupal triggers automated cron after a web request when the
configured interval has elapsed. Keep this request-triggered setup for local
development. Stage and production should instead schedule `drush cron` through
their hosting environment and avoid running both schedulers.

The local Docker stack routes semantic hostnames through its port-80 proxy:

- Drupal: `http://jurenites.local`
- Storybook: `http://storybook.jurenites.local`

Add both names to the host machine once if they are not already present:

```text
jurenites.local storybook.jurenites.local
```

Run Storybook through Docker:

```bash
docker compose up storybook
curl -I http://storybook.jurenites.local/
```

Or run Storybook directly from the host:

```bash
npm run storybook
```

Direct host execution still listens on port `6006`; the semantic Storybook URL
is provided by the complete Docker Compose stack.

## Generated And Ignored Files

Committed generated files are limited to artifacts that are useful for the
current workflow, mainly:

- `generated/styles/_tokens.scss`
- `generated/token/tokens.js`
- `scripts/figma/design-system-sync.js`
- `web/themes/custom/jurenites_theme/css/style.min.css`
- `web/themes/custom/jurenites_theme/js/script.min.js`

Ignored local dependency/build folders include:

- `vendor/`
- `node_modules/`
- `storybook-static/`
- Drupal scaffold/dependency folders such as `web/core/` and contrib folders

## Stage Environment

Drupal needs PHP, a database, and persistent file storage. Vercel is useful for
Storybook/static component preview, but it is not the natural host for a full
Drupal runtime.

Stage plan:

- Vercel: Storybook/static component preview.
- Drupal-capable hosting: full CMS stage.
- Later production: low-cost hosting server for the final domain.

## Status

Drupal, Docker Compose, Storybook, a custom theme, custom fonts, design tokens,
and a minimal Drupal token bridge module are installed locally. The project is
still early and expected to change heavily, but the current rule is simple:
edit source under `src/`, keep token truth in YAML, and treat generated files as
artifacts.
