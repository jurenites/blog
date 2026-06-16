# Design System

This is the visual guideline for the jurenites site. It documents the durable
rules. The machine-readable contract for every value lives in
`src/token/tokens.yaml`; this page explains intent and usage.

## Source of truth and flow

```text
src/token/tokens.yaml            <-- editable single source of truth (DTCG format)
  -> scripts/tokens-yaml-to-json.mjs
       -> generated/tokens/tokens.json               (generated machine contract)
  -> scripts/build-tokens.mjs
       -> generated/styles/_tokens.scss              (CSS vars + SCSS breakpoint/typography mixins)
       -> generated/styles/tokens.css                (CSS custom properties)
       -> generated/tokens/tokens.min.json            (minified contract)
       -> generated/tokens/tokens.flat.json           (resolved name -> value map)
  -> src/slice/src/scss/main.scss
       -> Storybook (consumes the SCSS directly)
       -> scripts/build-theme.mjs -> web/themes/custom/jurenites_theme/css/style.min.css
```

Never hand-edit generated files. Edit `src/token/tokens.yaml`, then run
`npm run build:tokens` (or `npm run build:theme`, which runs tokens first).

## Atomic design

Components are organised by Atomic Design and ITCSS layers:

| Layer      | Folder                         | Purpose                                  |
| ---------- | ------------------------------ | ---------------------------------------- |
| settings   | `src/slice/src/scss/settings/` | Hand-written theme settings              |
| tools      | `src/slice/src/scss/tools/`    | Mixins (elevation, motion, focus-ring)   |
| base       | `src/slice/src/scss/base/`     | Reset, global element defaults, typography|
| atoms      | `src/slice/src/scss/atoms/`    | Button, surface, chip, divider           |
| molecules  | `src/slice/src/scss/molecules/`| Small compositions of atoms              |
| organisms  | `src/slice/src/scss/organisms/`| Larger sections (timeline, hero)         |
| components  | `src/slice/src/scss/components/`| Page-specific compositions              |

Storybook mirrors these levels: `Foundations`, `Atoms`, `Molecules`,
`Organisms`, `Components`. Each component has exactly one story; use the
Controls tab for property combinations.

Static source assets, including local font files used by Storybook, live in
`src/public/`.

How components map across Figma, SCSS, Storybook, and Drupal (the BEM bridge) is
defined in `docs/naming-conventions.md`. Read it before adding any component.

## Breakpoints

| Range    | Min      | Max      | Notes                              |
| -------- | -------- | -------- | ---------------------------------- |
| Mobile   | 360px    | 640px    | Never design below 360px           |
| Tablet   | 641px    | 1279px   | Between mobile and desktop         |
| Desktop  | 1280px   | 1919px   | Primary design width               |
| Wide     | 1920px+  | -        | Full HD and ultra-wide             |

SCSS usage:

```scss
@use "../tools";

.example {
  @include tools.breakpoint-up("desktop-min") { /* >= 1280px */ }
  @include tools.breakpoint-between("tablet-min", "tablet-max") { /* tablet */ }
}
```

Storybook ships matching viewport presets (Mobile min/max, Tablet, Desktop min,
Desktop Full HD).

## Layout

- Container max widths: tablet 640px, desktop 1180px, wide 1440px.
- Gutters scale per breakpoint (mobile 16px, tablet 24px, desktop 32px).
- Everything is laid out on an 8px grid.

## Typography

The type scale follows Google Material Design M2 roles. Use the role mixins,
not raw values:

```scss
.card__title { @include tools.typography-headline-5; }
```

Roles: `headline-1..6`, `subtitle-1/2`, `body-1/2`, `button-label`,
`caption-default`, `overline-default`. Base HTML elements (`h1`-`h6`, `p`) are
already mapped in `base/_typography.scss`.

Default family is the Open Sans stack. The display family is a separate token,
and the Storybook foundations also expose the imported custom Roundabout and
4pixel fonts for future display/technical uses.

## Color

- HEX only. Never use the CSS `opacity` property; express alpha as 8-digit HEX
  (used for shadow colors) so composited colors stay predictable.
- Primitives live in `color.palette.*` (warm, cool, neutral ramps, feedback).
- Semantic tokens reference primitives: `color.surface.*`, `color.text.*`,
  `color.accent.*`, `color.border.*`. Always consume semantic tokens in
  components, not raw palette values.

## Spacing and gaps

`space.scale.*` is the 8px-based scale: `none`, `hairline` (1px exception),
`extra-small` (4px), `small-default` (8px), `medium-default` (16px),
`large-default` (24px), `extra-large` (32px), `huge-default` (48px),
`giant-default` (64px), `colossal-default` (96px).

## Shape

- `shape.corner-radius.*`: none, extra-small (4px), small (8px), medium (12px),
  large (16px), extra-large (28px), pill-full (9999px).
- `shape.border-width.*`: hairline (1px), thick (2px).

## Elevation and shadow

`elevation.shadow.level-0..level-6`, Material-style. Apply with
`@include tools.elevation("level-2");`. Shadow alpha uses 8-digit HEX.

## Motion

- Durations: instant, short (150ms), medium (250ms), long (375ms), extra-long (500ms).
- Easings (cubic-bezier): standard, decelerate, accelerate, sharp.
- Apply with `@include tools.motion-transition(color, background-color);`.
- All motion must respect `prefers-reduced-motion`.

## Drupal theme structure (inspiration)

The nearby `senate` Drupal 11 theme (`oksenate`) is a good structural reference:
it organises Twig templates by entity type and keeps a separate build `dist/`.
As `jurenites_theme` grows, mirror that template organisation:

```text
web/themes/custom/jurenites_theme/templates/
  html/        page/        region/
  block/       node/        paragraph/
  field/       media/       views/        taxonomy/
```

We keep our distinction: editable source in `src/slice/`, compiled minified assets
in the theme `css/` and `js/`.

## Naming convention

Flattened token names are dash-separated and descriptive. Never use a lone
generic word (`orange`, `size`, `card`). Pattern:
`{layer}-{scope}-{part}-{property}-{state}`, e.g.
`component-timeline-marker-size-active`, `color-action-primary-default`.
