# Project Workflow

Tasks start in conversation. Small, clear changes go directly through
implementation, verification, and feedback. Substantial features get a brief
outline in chat; content migrations, permission changes, and deployment
architecture get a short plan before implementation. No separate proposal or
specification files are required for routine delivery.

Keep durable decisions and delivered behavior in the relevant existing `/docs`
page so later tasks can recover context. `AGENTS.md` defines the working rules;
Storybook and appropriate source, build, and runtime checks verify the result.

## Product Process

The [public Cookbook](http://jurenites.local/node/22) and its
[article draft](cookbook-product-design-process.md) describe the agreed process.
Start with product purpose, the people affected, and the intended outcome, then
use these twelve milestones at the level of detail the task needs:

1. Identify people, roles, and permissions.
2. Collect the nouns and verbs: entities, actions, and relationships.
3. Explore screens and interactions in grayscale.
4. Define forms, fields, and the initial data model.
5. Establish a shared glossary.
6. Create reusable design tokens.
7. Develop the Figma design system and its states.
8. Build and inspect components in Storybook.
9. Consolidate documentation and connect the supporting artifacts.
10. Shape the backlog into epics and deliverable work where useful.
11. Assemble the Drupal implementation with real content and behavior.
12. Verify the result against explicit expectations and record the evidence.

These are milestones, not mandatory documents or a rigid waterfall. Small
changes can pass through only the affected steps. Feedback from users, QA,
development, management, design exploration, or AI-generated code returns to
the earliest affected decision, then flows through implementation and checks.
A prototype may start in code; review its assumptions and reconcile the design,
content model, tokens, and docs before treating them as agreed behavior.

Testing runs throughout this process. The proposed visual testing layer connects
Figma frames, Storybook components, and the Drupal theme rendered with real
data. The first local component-status dashboard and Storybook/Drupal capture
case are implemented; Figma comparison remains blocked pending a matched export.
See [Visual Testing Plan](visual-testing-plan.md) for commands and boundaries.

## Product Direction and Ideas

Capture the initial idea in the task conversation: the problem, the people it
affects, and the intended outcome. Keep durable decisions and deferred ideas in
the relevant existing `/docs` page, with future work clearly distinguished from
delivered behavior.

Rules:

- Discuss raw ideas in the task conversation.
- Record final architecture in the relevant documentation.
- Carry agreed decisions into tokens, the content model, or implementation.

## Tool Responsibilities

The sections below describe ownership and useful commands; their order does
not replace the product process above.

### Tokens

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

- Use dot notation in the YAML source; generated CSS/SCSS names flatten those
  paths with dashes.
- Each namespace segment must contain at least two word parts (for example `base-unit`, `marker-size`). Never use a single character or a lone word as a segment (invalid: `a`, `x`, `orange`).
- Each token name must describe scope, component or role, property, and state when applicable.

Example:

```json
{
  "component-timeline-marker-size-active": "40px"
}
```

Avoid generic names like `orange`, `small`, `primary`, or `card` until the semantic role is clear.

### Storybook

Storybook is the place to prove component behavior before Drupal integration. It compiles `src/slice/src/scss/main.scss` directly, so component CSS has a single source of truth shared with the Drupal theme.

Stories are organised by Atomic Design: `Foundations`, `Atoms`, `Molecules`, `Organisms`, `Components`. Each component has exactly one story; property combinations are explored via the Controls tab.

Current Foundations: Colors, Color Abstraction, Color Contrast, Typography,
Fonts, and Spacing. Their JS reads `generated/token/tokens.js`; their styles read
`generated/styles/_tokens.scss`.

Current Atoms: Avatar, Badge, Button, Chip, Divider, Icon, Date Time Value,
Surface, Tooltip, Version Watermark.

Current Molecules: Article Teaser, Article Blog List Item, Author Byline, Contact
Me Widget, Pagination, Project Card, Pull Quote.

Current Organisms: Top Nav Menu Site Header, Font Preview, and Pixel Glyph
Editor.

Pagination shares one BEM class contract between its Storybook markup helper and
Drupal's `templates/navigation/pager.html.twig` override. At the token-defined
mobile breakpoint it collapses numbered links into previous/next controls and a
current-page status so the component remains usable at the 360px minimum width.

Static source assets, such as local fonts, live in `src/public/` and are served
by Storybook as root-relative assets.

The Font Preview progressively enhances useful server markup with the pinned,
self-hosted `opentype.js` parser. It fetches only an allowlisted same-origin TTF,
caches the parse promise, builds the glyph grid from real drawable cmap
mappings, and reports the binary's embedded name-table metadata exactly. The
large parser is emitted as a separate Drupal library and attached only by the
Font Preview Paragraph; it is not part of the global theme bundle. The 4×4
Pixel Glyph Editor remains a deterministic in-memory interaction with no saved
browser or server state.

Timeline examples live in `src/stories/timeline/`. The implemented Drupal
chronology and its content model are documented in `docs/drupal-content-model.md`.

The Storybook interface and every preview screen display release identity in the
bottom-right corner: the shared project version, deployed Git commit hash,
collaboration credit, and release time in GMT.

The tracked `web/themes/custom/jurenites_theme/release-info.json` is the shared
release record. Drupal reads that file and resolves the current checkout hash
directly from `.git` without running Git or writing host metadata. Its global
HTML template renders the Version Watermark automatically in every environment,
so page authors never add it manually. The non-secret release JSON is also
available at `/themes/custom/jurenites_theme/release-info.json`.

Storybook must embed the identity into its static output, so its local or CI
build uses `scripts/build-information.mjs`. GitHub Actions and GitLab CI are
supported through `GITHUB_SHA` and `CI_COMMIT_SHA`; another artifact builder can
pass `JURENITES_GIT_COMMIT`. `npm run build:info:check` verifies the generated
Storybook identity against the build commit.

`package.json` is the editable project-version source. Version `1.0.0` marks the
first production release. Run `npm run version:bump` for the normal minor
release progression (`1.1.0`, `1.2.0`, and so on), or pass `patch`, `minor`, or
`major` explicitly. The command synchronizes `package.json`, `package-lock.json`,
`docs/version.md`, and the tracked theme `release-info.json`; CI rejects a
mismatch before building or deploying.

### Figma

Figma is used for layout, visual exploration, and design review.

Reuse the project’s existing components, variables, and styles. Confirm any
external library is available in the target file before depending on it.

Token sync goal:

- Code-side token updates can update Figma variables and styles through
  `scripts/figma/design-system-sync.js`.
- Storybook and Drupal consume generated artifacts derived from
  `src/token/tokens.yaml`.
- Token names must stay stable, because component implementations depend on
  them.

### Drupal

Drupal is the content and runtime layer.

The current content types, Paragraphs, and editorial responsibilities live in
[Drupal Content Model](drupal-content-model.md). The custom theme is
`jurenites_theme`; project modules provide features including tokens, font
projects, Timeline, and the Cookbook. Use that documentation and installed
configuration when planning an integration.

Theme source workflow:

- Editable theme source lives outside the Drupal theme in `src/slice/`.
- SCSS source lives in `src/slice/src/scss/`.
- JavaScript source lives in `src/slice/src/js/`.
- The Drupal theme should reference generated assets: `web/themes/custom/jurenites_theme/css/style.min.css` and `web/themes/custom/jurenites_theme/js/script.min.js`.
- The Drupal build configures theme-relative font URLs and copies the canonical
  font files from `src/public/assets/fonts/` into the theme's generated assets.
- Run `npm run build:theme` after source edits.

Apply the font-project content model and missing-only initial content with:

```bash
docker exec blog_jurenites_web ./vendor/bin/drush recipe ../recipes/jurenites_font_projects -y
docker exec blog_jurenites_web ./vendor/bin/drush cache:rebuild
```

The recipe uses stable content UUIDs and is safe to reapply: existing seeded
Projects and Paragraphs remain editor-owned. Confirm `/portfolio`, both stable
project aliases, the local font downloads, and 4pixel's editor after applying
it in each environment. Optional Windows imagery is later editorial media, not
a recipe or interactive-component dependency.

LLM-specific continuity notes live in `docs/llm-project-memory.md`. Keep that file updated when the site structure or implementation decisions change.

### Local Development

Start the local Docker services from the repository root:

```bash
docker compose up -d
```

Then verify the site with an actual HTTP check, not just running containers.
The Compose stack uses `jurenites.local` for Drupal and
`storybook.jurenites.local` for Storybook, routed through one local port-80
proxy. These names deliberately mirror the future `jurenites.com` domain shape.

### Visual Testing

The planned visual testing workflow lives in `docs/visual-testing-plan.md`.
The local dashboard lists actual Storybook components and runs the first
Storybook/Drupal rendering and screenshot case for Article Blog List Item.
Figma comparisons, pinned content revisions, and automatic CI ingestion remain
future work. Keep each result tied to its actual build and captured data.

An existing browser inspection script checks Storybook health. It does not
compare pixels with Figma or Drupal. `playwright` is now a declared development
dependency. The existing setup instructions are:

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

### Token Contract Check

`npm run build:tokens` regenerates token artifacts and runs the fast token
contract check. It scans handwritten SCSS for `var(--...)` references and fails
when a referenced custom property is not emitted by `src/token/tokens.yaml`.

### Environments and Release

DEV is for implementation and local evidence, STAGE for production-like review,
and PROD for the reviewed public result. Keep database content, uploaded media,
secrets, and host configuration owned by each environment. Source, generated
assets, and release identity must agree before delivery.

Use [CI/CD](ci-cd.md) for the actual pipelines and
[Command Cheat Sheet](command-cheat-sheet.md) for environment-specific commands.
A local result does not establish that another environment was deployed or
verified. The proposed visual testing layer will begin locally; add CI gating
only after repeatable scenarios and reviewed baselines exist.
