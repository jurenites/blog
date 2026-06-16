# Blog jurenites

Personal site for Alexander Ilivanov / @jurenites.

This repository is the working system for a personal blog, portfolio, CV timeline,
and public design/development process. The repo is intentionally readable: design
tokens, Storybook components, Figma sync, and the Theme should all point
back to one understandable source instead of several competing mirrors.

## Direction

- CMS: Drupal 11.
- Purpose: personal promotion, networking, portfolio, and long-form writing.
- Design source: Figma file `blog-jurenites`.
- Design token source: `src/token/tokens.yaml`.
- Component proving ground: Storybook.
- Runtime target: Docker development first, stage preview second, production hosting later.

Current Figma file:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

## Repository Shape

```text
src/token/tokens.yaml             Editable design-token source of truth
generated/styles/_tokens.scss     Generated SCSS token artifact
generated/figma/design-system-sync.js
                                  Generated Figma sync script
src/slice/                        Source SCSS/JS for the Theme and Storybook
src/stories/                      Storybook examples grouped by type
src/styles/storybook.scss         Storybook-only documentation/canvas styling
src/public/                       Static assets served to Storybook
web/                              Drupal public web root
web/themes/custom/jurenites_theme Built custom Drupal theme
web/modules/custom/jurenites_tokens
                                  Small Drupal token bridge module
vendor/                           Local Composer dependencies, ignored by Git
node_modules/                     Local npm dependencies, ignored by Git
```

`vendor/` stays at the repository root, outside `web/`, because `web/` is the
public document root. This is the safer standard Drupal/Composer layout.

## Token Pipeline

`src/token/tokens.yaml` is the only editable token file. Do not edit generated
token artifacts by hand.

The current build path is:

```text
src/token/tokens.yaml
  -> generated/styles/_tokens.scss
  -> Storybook preview CSS and Drupal theme CSS
  -> generated/figma/design-system-sync.js when Figma sync is needed
```

There are no generated token JSON mirrors in the normal workflow. Storybook
foundation pages read the actual CSS variables produced by the token build, so
Ctrl+F stays focused on the real source and real usage.

Useful commands:

```bash
npm run build:tokens      # YAML -> generated/styles/_tokens.scss
npm run storybook         # build tokens, then run Storybook on port 6006
npm run build-storybook   # build tokens, then build static Storybook
npm run build:theme       # build tokens, then compile Drupal theme CSS/JS
npm run build:figma-sync  # build tokens, then generate Figma sync script
scripts/sync.sh all       # build tokens + theme + Figma sync
```

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
curl -I http://127.0.0.1:8081/
```

The local Drupal site uses port `8081`.

Initial local admin login:

- URL: `http://127.0.0.1:8081/user/login`
- User: `admin`
- Password: `admin`

Run Storybook through Docker:

```bash
docker compose up storybook
curl -I http://127.0.0.1:6006/
```

Or run Storybook directly from the host:

```bash
npm run storybook
```

## Generated And Ignored Files

Committed generated files are limited to artifacts that are useful for the
current workflow, mainly:

- `generated/styles/_tokens.scss`
- `generated/figma/design-system-sync.js`
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

Drupal 11, Docker Compose, Storybook, a custom theme, custom fonts, design tokens,
and a minimal Drupal token bridge module are installed locally. The project is
still early and expected to change heavily, but the current rule is simple:
edit source under `src/`, keep token truth in YAML, and treat generated files as
artifacts.
