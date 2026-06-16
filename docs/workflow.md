# Project Workflow

## 1. Idea File

`idea-file.md` is the rough source of truth for product direction, content ideas, feature ideas, and implementation notes. It is intentionally allowed to be messy.

Rules:

- Add raw ideas quickly.
- Do not put final architecture only in chat.
- Promote stable ideas into docs, tokens, content model, or implementation tasks.

## 2. Tokens

`src/token/tokens.yaml` is the editable single source of truth for reusable design decisions, in W3C/DTCG format. `generated/tokens/tokens.json` is generated from it as the contract between Figma, Storybook, and Drupal.

`scripts/build-tokens.mjs` resolves `{references}` and generates (never hand-edit these):

- `generated/styles/_tokens.scss` (CSS custom properties, SCSS breakpoint vars/map/mixins, typography role mixins)
- `generated/styles/tokens.css` (CSS custom properties)
- `generated/tokens/tokens.min.json` (minified contract for transport)
- `generated/tokens/tokens.flat.json` (resolved `name -> {type, value, css}` map for Storybook foundations and Figma sync)

Run `npm run build:tokens` after editing `src/token/tokens.yaml`. `npm run build:theme` runs tokens first automatically.

Token groups:

- `system.grid`, `system.icon`, `system.breakpoint`, `system.naming`
- `color.*` (palette primitives + semantic surface/text/accent/border)
- `typography.*` (Material M2 roles)
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

Current Foundations: Colors, Typography, Spacing and Elevation (all generated from `generated/tokens/tokens.flat.json`).

Current Atoms: Button, Surface, Chip, Divider.

Static source assets, such as local fonts, live in `src/public/` and are served
by Storybook as root-relative assets.

Planned components:

- `GradientBackground`
- `TimelineRail`
- `TimelineMarker`
- `TimelineProjectCard`
- `ProgressiveMedia`
- `HireMeWidget`
- `ArticleTeaser`
- `GalleryEffectCard`

## 4. Figma

Figma is used for layout, visual exploration, and design review.

Current file:

https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites

The file already has Material 3 Design Kit available. The project should reuse the parts that help, but the site should still feel personal and specific.

Token sync goal:

- Figma can export design variables back into the token pipeline.
- Code can read generated `generated/tokens/tokens.json` and generate CSS variables/Storybook theme values.
- Later, code-side token updates should be able to update Figma variables when needed.
- Token names must stay stable, because component implementations will depend on them.

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
- Run `npm run build:theme` after source edits.

LLM-specific continuity notes live in `docs/llm-project-memory.md`. Keep that file updated when the site structure or implementation decisions change.

## 6. Local Development

Local development should run in Docker first. The target developer command should eventually be one command, for example:

```bash
docker compose up -d
```

Then verify the site with an actual HTTP check, not just running containers.

## 7. Staging

Staging needs two tracks:

- Vercel for Storybook/static design previews.
- Drupal-capable hosting for full CMS staging when needed.

## 8. Production

Production target is a low-cost hosting server for `juernites.com` or a final domain chosen later.

Production needs:

- PHP supported by Drupal 11.
- Database.
- File storage.
- Backups.
- HTTPS.
- Simple deploy runbook.
