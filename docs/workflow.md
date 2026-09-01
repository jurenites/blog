# Project Workflow

## 1. Idea File

`idea-file.md` is the rough source of truth for product direction, content ideas, feature ideas, and implementation notes. It is intentionally allowed to be messy.

Rules:

- Add raw ideas quickly.
- Do not put final architecture only in chat.
- Promote stable ideas into docs, tokens, content model, or implementation tasks.

## 2. Tokens

`src/token/tokens.yaml` is the editable single source of truth for reusable
design decisions. Every token uses a concise direct key/value form; `$type`,
`$value`, and `$description` are generated implementation details and are forbidden in this file.
The builder infers token types and normalizes the source into internal DTCG records.

`scripts/build-tokens.mjs` resolves plain dot-path references and generates (never hand-edit these):

- `generated/styles/_tokens.scss` for CSS custom properties, SCSS breakpoint
  vars/map/mixins, typography role mixins, and consumed palette/spacing/shadow
  utility classes
- `generated/token/tokens.js` for Storybook JS, Drupal token JSON output, and
  Figma sync input

Run `npm run build:tokens` after editing `src/token/tokens.yaml`. `npm run build:theme` runs tokens first automatically.
Token generation immediately runs `npm run tokens:check`, so copied HEX values,
lowercase HEX letters in the token source, CSS opacity declarations, and
undefined SCSS token references fail the build. Verbose token metadata fields
and redundant `key: key` self-mappings also fail; use YAML comments for
explanations and keep Storybook option arrays with their stories. `npm run lint`
runs the same check.

Token groups:

- `system.icon`, `system.breakpoint`, `system.naming`
- `color.*` (palette primitives + semantic surface/text/action/border)
- `typography.*` (CSS-ready font shorthand roles plus demonstration font families)
- `space.*`, `shape.*`, `elevation.*`, `motion.*`, `layout.*`
- `component.*`

See `docs/design-system.md` for the full guideline.

Token naming rules (see `system.naming` in `src/token/tokens.yaml`):

- Use dash-separated namespaces, not dots.
- Each namespace segment must contain at least two word parts (for example `base-unit`, `marker-size`). Never use a single character or a lone word as a segment (invalid: `a`, `x`, `orange`).
- Each token name must describe scope, component or role, property, and state when applicable.

Example:

```json
{
  "component-timeline-marker-size-active": "40px"
}
```

Avoid generic names like `orange`, `small`, `primary`, or `card` until the semantic role is clear.

## 3. Storybook

Storybook is the place to prove component behavior before Drupal integration. It compiles `src/slice/src/scss/main.scss` directly, so component CSS has a single source of truth shared with the Drupal theme.

Stories are organised by Atomic Design: `Foundations`, `Atoms`, `Molecules`, `Organisms`, `Components`. Each component has exactly one story; property combinations are explored via the Controls tab.

Current Foundations: Colors, Color Abstraction, Color Contrast, Typography,
Fonts, and Spacing. Their JS reads `generated/token/tokens.js`; their styles read
`generated/styles/_tokens.scss`.

Current Atoms: Avatar, Badge, Button, Chip, Date Display, Divider, Icon, Surface, Tooltip,
Version Watermark.

Current Molecules: Article Teaser, Article Blog List Item, Author Byline, Contact
Me Widget, Pagination, Project Card, Pull Quote.

Current Organisms: Top Nav Menu Site Header.

Pagination shares one BEM class contract between its Storybook markup helper and
Drupal's `templates/navigation/pager.html.twig` override. At the token-defined
mobile breakpoint it collapses numbered links into previous/next controls and a
current-page status so the component remains usable at the 360px minimum width.

Static source assets, such as local fonts, live in `src/public/` and are served
by Storybook as root-relative assets.

Current timeline work lives in `src/stories/timeline/` and uses the same token
and Storybook conventions while it is still being shaped.

The Storybook interface and every preview screen display build identity in the bottom-right corner:
the shared project version, deployed Git commit hash, collaboration credit, and
creation time in GMT. This metadata is generated automatically when Storybook
starts or builds and is not committed to Git.

Storybook and Drupal obtain version, commit, and GMT build metadata from
`scripts/build-information.mjs`. Drupal's global HTML template renders the
Version Watermark automatically, so page authors never add it manually.

## 4. Figma

Figma is used for layout, visual exploration, and design review.

Current file:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

The file already has Material 3 Design Kit available. The project should reuse the parts that help, but the site should still feel personal and specific.

Token sync goal:

- Code-side token updates can update Figma variables and frames through
  `scripts/figma/design-system-sync.js`.
- Storybook and Drupal consume generated artifacts derived from
  `src/token/tokens.yaml`.
- Token names must stay stable, because component implementations depend on
  them.

## 5. Drupal

Drupal is the content and runtime layer.

Initial content types:

- Article
- Timeline Event
- Project
- Gallery Item
- External Reference

Initial custom theme:

- `jurenites_theme`

Initial custom modules:

- `jurenites_tokens`

Planned custom modules:

- `jurenites_timeline`
- `jurenites_media_loader`

Theme source workflow:

- Editable theme source lives outside the Drupal theme in `src/slice/`.
- SCSS source lives in `src/slice/src/scss/`.
- JavaScript source lives in `src/slice/src/js/`.
- The Drupal theme should reference generated assets: `web/themes/custom/jurenites_theme/css/style.min.css` and `web/themes/custom/jurenites_theme/js/script.min.js`.
- The Drupal build configures theme-relative font URLs and copies the canonical
  font files from `src/public/assets/fonts/` into the theme's generated assets.
- Run `npm run build:theme` after source edits.

LLM-specific continuity notes live in `docs/llm-project-memory.md`. Keep that file updated when the site structure or implementation decisions change.

## 6. Local Development

Local development should run in Docker first. The target developer command should eventually be one command, for example:

```bash
docker compose up -d
```

Then verify the site with an actual HTTP check, not just running containers.
The Compose stack uses `jurenites.local` for Drupal and
`storybook.jurenites.local` for Storybook, routed through one local port-80
proxy. These names deliberately mirror the future `jurenites.com` domain shape.

## 7. Visual Testing

The planned visual testing workflow lives in `docs/visual-testing-plan.md`.
Treat it as an implementation plan until the first real scenario is built and
verified. When visual testing scripts are added later, update that plan into a
runbook and add the commands to `package.json`.

Current browser inspection setup:

```bash
npm install --save-dev playwright
npm run playwright:install
npm run storybook:inspect
```

`npm run storybook:inspect` rebuilds static Storybook, discovers foundation,
atom, molecule, and organism stories from Storybook's generated index, and checks every
story at the token-defined 360px mobile minimum, 1280px desktop minimum, and
1920px desktop maximum. It fails on browser errors, blank renders, horizontal overflow, or missing CSS
custom properties. Browser binaries are stored under `.cache/ms-playwright/`
and ignored by Git.

## 8. Token Contract Check

`npm run build:tokens` regenerates token artifacts and runs the fast token
contract check. It scans handwritten SCSS for `var(--...)` references and fails
when a referenced custom property is not emitted by `src/token/tokens.yaml`.

## 9. Staging

Staging needs two tracks:

- Vercel for Storybook/static design previews.
- Drupal-capable hosting for full CMS staging when needed.

## 10. Production

Production target is a low-cost hosting server for `jurenites.com`.

Production needs:

- PHP supported by Drupal 11.
- Database.
- File storage.
- Backups.
- HTTPS.
- Simple deploy runbook.
