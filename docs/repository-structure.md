# Repository Structure

The root `README.md` is the project entry point. Detailed documentation belongs
in `/docs`; working conventions belong in `AGENTS.md`.

## Editable source and generated output

| Source | Responsibility | Output or consumer |
| --- | --- | --- |
| `src/token/tokens.yaml` | Editable design-token inventory | Generated SCSS, JS records, and color mapping table |
| `src/slice/src/scss/` | Shared component styles and Drupal entrypoints | Storybook, public theme CSS, CKEditor CSS |
| `src/slice/src/js/` | Shared frontend behavior | Storybook imports and built theme JavaScript |
| `src/stories/` | Story files, templates, shared markup helpers | Storybook navigation and previews |
| `src/public/` | Fonts, images, SVGs, and public source assets | Storybook static assets and built Drupal assets |
| `src/brand/technology-stack/` | Fixed logo artwork and brand constants | Generated Technology Stack SVGs |
| `web/themes/custom/jurenites_theme/` | Handwritten Twig and Drupal theme integration | Public rendering and deployable generated assets |
| `web/modules/custom/` | Drupal fields, renderers, routes, editors, and migrations | Installed Drupal functionality |
| `recipes/` | Explicit Drupal setup recipes | Environment configuration and initial content |
| `translations/` | Reviewed English/Russian catalogues | Guarded Drupal imports and generated review exports |
| `scripts/figma/` | Token-sync plugin source and build | Explicit Figma variable/style updates |
| `scripts/component-status/`, `src/status-dashboard/` | Local capture service and review UI | Component-status dashboard and reports |
| `tests/` | Focused unit, Drupal, and browser checks | Evidence for the behavior exercised |
| `scripts/blender/`, `output/` | Artwork tooling and working assets | Local editable scenes and exports |

Project-owned code lives beside generated deployable files in the theme; do not
assume every file under the theme directory can be regenerated. The theme uses
`base theme: false` and does not inherit Stable 9.

## Token and theme builds

```bash
npm ci
npm run build:tokens
npm run build:theme
npm run build-storybook
```

The token builder writes:

- `generated/styles/_tokens.scss`: CSS variables, SCSS helpers, and utilities.
- `generated/token/tokens.js`: token records for JavaScript and Figma consumers.
- `generated/token/color-mappings.json`: a readable generated mapping table.

`build:tokens` also checks the token contract, builds Technology Stack artwork,
and generates the QR Studio palette. `build:qr-studio` additionally rebuilds the
4pixel glyph data. Do not hand-edit generated artifacts or add a second editable
token mirror.

The theme builder produces public `css/style.min.css`, CKEditor CSS, and
`js/script.min.js`; it also prepares icon markup/sprites and copies fonts,
images, icons, and other required assets into the theme. Commit deployable
outputs with their source changes. Run Drupal cache rebuild after deploying
changed assets or templates. See [CI/CD](ci-cd.md).

Theme templates use `templates/layout`, `content`, `field`, `form`, `navigation`,
`misc`, `block`, `paragraph`, `views`, and `components`. The `components` directory contains shared Twig
partials; it is not a complete Drupal SDC library. Module-owned templates remain
under their owning module.

## Storybook and local testing

Story files live in dedicated component folders under `src/stories/`. Their
`title` defines the visible navigation, which can differ from the source folder's
Atomic Design group. Named story exports describe useful scenarios. Composed
stories import shared `*.markup.js` helpers instead of duplicating atom HTML.

`npm run storybook` serves the development application. `npm run build-storybook`
writes the deployable `storybook-static/` application. `.storybook/` contains
configuration and must not be used as a hosting document root.

`npm run status:build` builds Storybook, stamps its source identity, and generates
`generated/status-dashboard/`. `npm run status:serve` starts the local Node
service. Saved mappings, uploaded references, reports, and captures live in
`.cache/component-status/`. These are ignored local artifacts, not Drupal
content. See [Visual testing](visual-testing-plan.md).

## Drupal setup and editorial ownership

Apply only the recipes needed for the target site, from its matching source
checkout. For example, on local DEV:

```bash
docker compose exec web vendor/bin/drush recipe /opt/drupal/recipes/jurenites_media
docker compose exec web vendor/bin/drush cr
```

Recipes and install hooks establish fields, configuration, and initial content.
Update hooks migrate already-installed environments through `drush updatedb`.
Seed-once content remains editor-owned after creation; do not reapply old recipes
to undo later content-model migrations. In particular, follow the documented
Article/Video split sequence before using the separate Video type.

Feature setup and ownership live in [Content model](drupal-content-model.md),
[About](about-page.md), [Hero](hero-section.md), [Contact](contact-form.md),
[footer](footer-menu.md), and [localization](localization.md). Composer's presence
on disk does not establish module enablement or environment configuration.

## Media infrastructure

The local stack's upload ceilings are defined in source:

- `docker/php-upload.ini`: 200 MB file and 210 MB POST limits, with 512 MB memory.
- `docker/apache-upload.conf`: 210 MiB request-body limit.
- `docker/local-proxy.conf`: 210 MiB body limit and 300-second timeouts.
- `recipes/jurenites_media/recipe.yml`: 200 MB Image media validation.

Drupal fields impose their own limits below the server ceiling. Inline GIFs and
images use 5 MB; inline MP4/WebM media use 20 MB. See the content-model document.
Production PHP and web-server limits must be verified separately.

## Dependencies and local artifacts

`composer.lock` and `package-lock.json` pin installed dependencies. Upstream
README files inside Composer packages or scaffolded Drupal files are dependency
documentation, not additional project documentation to maintain.

Artwork under `output/` mixes retained source with ignored render products.
Check its local ignore rules before removing anything; Git history cleanup does
not back up untracked files. Database backups, uploads, credentials, and active
Drupal configuration remain environment-owned. See the
[command runbook](command-cheat-sheet.md).
