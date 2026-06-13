# LLM Project Memory

This document is for AI/LLM continuity, not for normal developer onboarding. Keep it concise and update it when project direction, Drupal structure, local runtime, Figma/token workflow, or implementation decisions change.

## Current Goal

Build a personal website for Alexander Ilivanov / jurenites using Drupal 11. The site is for personal promotion, professional networking, portfolio presentation, writing, and an interactive CV timeline.

The site should feel personal and opinionated, not like a generic portfolio template. It should expose the thinking process: idea file, naming, tokens, Figma, Storybook, Drupal content structure, custom theme, and custom modules.

## Active Repo

- Path: `/Users/alexanderilivanov/Projects/blog_jurenites`
- Branch: `main`
- Remote: `git@github.com:jurenites/blog.git`
- Drupal local URL: `http://127.0.0.1:8081/`
- Storybook local URL: `http://127.0.0.1:6006/`
- Drupal admin URL: `http://127.0.0.1:8081/user/login`
- Initial local login: `admin` / `admin`

Use `/usr/local/bin/docker` if `docker` is missing from the shell PATH.

## Runtime State

Drupal 11 is installed locally through Docker Compose.

Services:

- `web`: custom Docker image based on `drupal:11-php8.4-apache`
- `db`: `mariadb:11.4`
- `storybook`: `node:22-alpine`

Verified current checks:

- Drupal homepage returns `HTTP/1.1 200 OK`.
- Storybook returns `HTTP/1.1 200 OK`.
- `/jurenites/tokens.json` returns valid JSON.
- Drush bootstrap is successful and database is connected.

## Current Custom Code

Custom Drupal theme:

- `web/themes/custom/jurenites_theme`
- Enabled as default theme.
- The custom theme Search form blocks are disabled in active Drupal config: `block.block.jurenites_theme_search_form_narrow` and `block.block.jurenites_theme_search_form_wide` both have `status: false`.
- Homepage uses `templates/page--front.html.twig` with a Squarespace-like `<div class="section-background-canvas background-fx-canvas">` wrapper; JavaScript injects the WebGL canvas inside it.
- Theme source is separated into `slice/`, outside Drupal core/theme internals. SCSS source lives in `slice/src/scss/`; JS source lives in `slice/src/js/`.
- Run `npm run build:theme` to compile minified Drupal theme assets: `web/themes/custom/jurenites_theme/css/style.min.css` and `web/themes/custom/jurenites_theme/js/script.min.js`.
- `slice/src/js/script.js` implements a clean-room WebGL radial gradient based on the local ALiMP/Squarespace `BackgroundGradient` behavior: accent-to-dark radial gradient, slow ease-out cursor-following center, hash-based animated grain, and mild distortion. It does not copy the minified Squarespace bundle.
- The animation respects `prefers-reduced-motion` by not initializing when reduced motion is requested.

Custom Drupal module:

- `web/modules/custom/jurenites_tokens`
- Enabled.
- Exposes `tokens/tokens.json` at `/jurenites/tokens.json`.

Storybook:

- Config: `.storybook/`
- Stories: `src/stories/` organised by Atomic Design (`Foundations`, `Atoms`, `Molecules`, `Organisms`, `Components`).
- Storybook compiles `slice/src/scss/main.scss` directly, so component CSS is shared with the Drupal theme (one source of truth).
- Foundations (Colors, Typography, Spacing/Elevation) are generated from `tokens/tokens.flat.json`.
- Atoms so far: Button, Surface, Chip, Divider. One story per component; variants via Controls.
- Breakpoint viewports configured: Mobile min/max, Tablet, Desktop min, Desktop Full HD.

Token build engine:

- `scripts/build-tokens.mjs` reads `tokens/tokens.json` (DTCG) and generates `slice/src/scss/settings/_generated-tokens.scss`, `src/styles/tokens.generated.css`, `tokens/tokens.min.json`, and `tokens/tokens.flat.json`.
- Generated files must never be hand-edited. `npm run build:tokens` regenerates them; `npm run build:theme` runs tokens first.
- Full guideline: `docs/design-system.md`.

## Seeded Local Content

The first local Article node was created from the first explicit `Idea blog post` in the Google Doc.

- Node ID: `1`
- Type: `article`
- Title: `My Own Projects Page: Rewinding an Interface Through Time`
- Alias: `/writing/my-own-projects-page`
- Status: published
- Source idea: show the thought process for a project/interface with a time slider, from inspiration such as No Man's Sky, through Moqups, into repeated iterations.
- Intent: early seed content only; the user is expected to rewrite and restructure it in Drupal.

## Important Product Direction

Main site areas:

- About
- Work Timeline
- Portfolio
- Writing
- Culture
- UI Reviews
- Gallery
- Contact / Hire Me

Signature features:

- Interactive CV timeline with slider/bookmarks.
- Company/project logos on timeline events.
- Squarespace-like animated radial gradient background inspired by the local ALiMP page.
- Public design/process cookbook.
- Storybook connected to actual theme components.
- Token JSON workflow connected to Figma and Drupal.
- Progressive image/GIF/media loading concept.

## Drupal Content Modeling Preference

Keep the content model universal and flexible.

Do not overfit node types with too many custom fields early. Add fields only when Drupal must sort, filter, reference, render, or query a value. Storytelling details should usually live in `Body`.

For example, `Timeline Event` needs `Start date` and `End date`, but details like contribution, what happened, or what was learned can remain in body text so each project/event can be written differently.

If the user later creates node types, fields, views, or vocabularies directly in Drupal admin, update `docs/drupal-content-model.md` and this memory file with what exists.

## Token/Figma Direction

Token file:

- `tokens/tokens.json`

Current preference:

- Do not spend time perfecting colors yet.
- Figma is where visual design will evolve.
- Tokens should focus on durable rules and naming conventions.
- 8px grid is the base layout rule.
- Minimum interactive element size is 40px by 40px.
- Icons smaller than that sit inside a 24px by 24px SVG viewport, usually within a 40px container.

Token naming:

- Use dash-separated names.
- Avoid generic one-word names.
- Names should be searchable and describe scope, role/component, property, and state where useful.
- Example: `component-timeline-marker-size-active`.

Future goal:

- Figma can export variables to `tokens/tokens.json`.
- Code can consume `tokens/tokens.json`.
- Eventually code-side token changes should be able to update Figma variables.

## Figma State

The Figma file (`UMshUcV87SZqsg1aDaDpnZ`, pages: Cover, Guideline, Pages) now has
the token foundation as local variables (created via the Figma MCP):

- Collections: `Color` (20 palette primitives + 12 semantic aliases), `Spacing`
  (10), `Shape` (9), `System` (11), `Layout` (6) = 68 variables, single mode.
- Variable names use `/`-paths matching token paths (e.g. `color/palette/white`),
  so the pull script round-trips them (`/`->`-` equals the flat token name).
- All variables have `WEB` code syntax `var(--<flat-name>)` and explicit scopes;
  semantic colors and layout gutters are aliases.
- A `Color / Palette` swatch board on the Guideline page is bound to the palette
  variables (visual proof of bindings).
- Round-trip verified: a synthesized Figma export of the 53 concrete tokens pulls
  back with zero diffs against tokens.json.
- RATE LIMIT (corrected): on Figma Starter the limit is ~6 `use_figma` tool calls
  per MONTH total. `use_figma` counts whether it reads OR writes — it is NOT exempt.
  Only `whoami`, `generate_figma_design`, and `add_code_connect_map` are exempt.
  The 6 monthly calls are already used (discovery + 4 variable writes + swatch board),
  so further Figma work is blocked until the monthly reset or an upgrade to a Pro/
  Org/Enterprise plan with a Full/Dev seat (200-600 reads/day).
- Multi-mode variables are not available on Starter (1 mode only), which is why all
  collections use a single mode.
- PENDING Figma work (build when quota allows, all via sequential `use_figma`):
  create `Atoms` + `Molecules` pages; build components Button (Variant set),
  Avatar, Badge, Chip (atoms) and ProjectCard, HireMeWidget, ArticleTeaser
  (molecules). Bind fills/strokes/padding/itemSpacing/corner radii to the existing
  variables by name; name layers after BEM selectors; tag each component with
  sharedPluginData `jrn.componentKey` and `jrn.bemBlock` (see docs/naming-conventions.md).
  Also add text styles for typography and effect styles for elevation.

## Standing Goal

Build a custom Drupal 11 website that is Alexander Ilivanov's / jurenites's
personal representation, with an interconnected pipeline where the token JSON is
the single source of truth feeding Storybook, Figma, the SCSS slice, and the
compiled Drupal theme. Decisions: GitHub Actions for CI, W3C/DTCG token format
with the Tokens Studio Figma plugin, two-way Figma sync (MCP pull + Tokens Studio
push). Color rule: HEX only, never the CSS opacity property.

## Working Rules For Future LLM Sessions

- Keep this file updated when project facts change.
- Keep developer-facing docs useful, but use this file for AI-specific context.
- Preserve user changes in Drupal/admin/config unless explicitly asked to overwrite them.
- Verify local runtime with HTTP checks, not only Docker container status.
- Prefer Docker commands over requiring global PHP, Composer, Node, or npm on the host.
- If adding new generated Drupal config later, separate generated config from custom source code clearly.
