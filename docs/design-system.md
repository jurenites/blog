# Design System

This is the visual guideline for the jurenites site. It documents the durable
rules. The machine-readable contract for every value lives in
`src/token/tokens.yaml`; this page explains intent and usage.

## Source of truth and flow

```text
src/token/tokens.yaml            <-- editable single source of truth (DTCG format)
  -> scripts/build-tokens.mjs
       -> generated/styles/_tokens.scss              (CSS vars + SCSS mixins/utilities)
       -> generated/token/tokens.js                  (JS token records and values)
       -> scripts/figma/design-system-sync.js        (Figma sync helper)
       -> scripts/build-storybook-info.mjs
            -> generated/storybook/storybook-tokens.css (temporary manager CSS)
  -> src/slice/src/scss/main.scss
       -> Storybook (consumes the SCSS directly)
       -> scripts/build-theme.mjs -> web/themes/custom/jurenites_theme/css/style.min.css
```

Never hand-edit generated files. Edit `src/token/tokens.yaml`, then run
`npm run build:tokens` (or `npm run build:theme`, which runs tokens first).
The token build also runs `scripts/check-token-contract.mjs`, which rejects
hardcoded colors outside the YAML source, CSS opacity declarations, and missing
SCSS token variables.

## Atomic design

Components are organised by Atomic Design and ITCSS layers:

| Layer      | Folder                         | Purpose                                  |
| ---------- | ------------------------------ | ---------------------------------------- |
| settings   | `src/slice/src/scss/settings/` | Hand-written theme settings              |
| tools      | `src/slice/src/scss/tools/`    | Mixins (elevation, motion, focus-ring)   |
| base       | `src/slice/src/scss/base/`     | Reset, global element defaults, typography|
| atoms      | `src/slice/src/scss/atoms/`    | Avatar, badge, button, chip, date value, divider, surface, text input |
| molecules  | `src/slice/src/scss/molecules/`| Article teaser, author byline, breadcrumbs, contact widget, pagination, project card, pull quote, search form |
| organisms  | `src/slice/src/scss/organisms/`| Newsletter signup, site header, and larger page sections |
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
| Desktop  | 1280px   | 1920px   | Includes Full HD; maximum tested width |

SCSS usage:

```scss
@use "../tools";

.example {
  @include tools.breakpoint-up("desktop-min") { /* >= 1280px */ }
  @include tools.breakpoint-between("tablet-min", "tablet-max") { /* tablet */ }
}
```

Storybook ships matching viewport presets (Mobile min/max, Tablet min, Desktop
min/max). Screens wider than 1920px retain desktop behavior; centered content
stops growing and the remaining area uses the page background.

Responsive components must be checked at exactly 360px before completion. The
Pagination molecule uses the generated `mobile-max` breakpoint mixin: numbered
pages and visible Previous/Next labels appear on larger screens. At 640px and
below, CSS automatically exposes exactly four `li.pagination__item` elements:
left arrow, current-page number, total-page number, and right arrow. Arrow links
retain accessible labels, but no Previous/Next text is visually displayed.

## Layout

- Container max widths: tablet 640px and desktop 1440px. The desktop container
  also applies above 1920px, so ultra-wide space remains background-only.
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

Typography dimensions use explicit `px` values throughout the token source and
generated outputs. This keeps the displayed values pixel-exact and removes any
implicit root-font-size conversion from Storybook, Figma sync, and theme CSS.

Theme semantics form the next abstraction layer and use the `semantic-*`
namespace. `semantic-blog-title` maps to Open Sans at 32px/500. The generated
Typography Mapping Storybook page shows these assignments without a repeated
role list.

Badge labels use `component-badge-label-font-family-default` to apply the
custom 4pixel face while retaining the shared 5px Overline dimensions. Keep
this override component-scoped so article and newsletter overlines do not
inherit the pixel font unintentionally.

Default family is the Open Sans stack. The display family is a separate token,
and the Storybook foundations also expose the imported custom Roundabout and
4pixel fonts for future display/technical uses.

## Color

- HEX only. Never use the CSS `opacity` property; express alpha as 8-digit HEX
  (used for shadow colors) so composited colors stay predictable.
- Primitives live in `color.palette.*` (warm, cool, neutral ramps, feedback).
- Semantic tokens reference primitives: `color.surface.*`, `color.text.*`,
  `color.action.*`, `color.border.*`. Always consume semantic tokens in
  components, not raw palette values.
- The screenshot signature uses dedicated solid semantic colors with no opacity
  or blend mode. Configured HEX values therefore reach solid glyph pixels
  unchanged; only normal font anti-aliasing affects edge pixels.
- Palette, Abstraction Levels, and Color Contrast reuse one internal Color Block
  renderer. It is not a standalone Storybook story. Its color chip is a 96px
  square by default or a compact 40px square for dense logical-token mapping;
  the information container remains flexible and prioritizes readable names.
  Abstraction Levels presents the intended mapping flow as Palette Primitives,
  Semantic Logic, and Element Usage.

## Front-page background language

Use these terms when reviewing or tuning the interactive background:

- **radial field**: the huge grayscale circle that controls the underlying tone;
  it scales from the viewport diagonal and is not capped at Full HD.
- **grain field**: the static one-logical-pixel monochrome noise visible at rest.
- **dither field**: a structured pixel-art texture calculated from the
  scene's local tone.
- **dither brush**: the hard-edged circular cursor area that replaces resting
  grain with ordered four-by-four-pixel pattern families.
- **mark size**: one dither cell in CSS logical pixels. Every cell pixel and
  resting-grain pixel maps to one screen logical pixel.

The live background combines a radial field, one-logical-pixel grain, and an
ordered dither brush. Local radial tone selects between four related pattern
families: small crosses, rotated crosses, diagonal weave, and offset checker.
Each family has 16 ordered grayscale ranks. Unlike binary dithering, its darkest
and lightest pixels use the same local `gradient tone -/+ 0.085` range as the
resting noise. The brush boundary uses a binary pixel test with no alpha or
gradient-to-transparency, but that matching tonal range prevents a contrasting
ring at the edge. As the brush moves, only the logical pixels it has uncovered
receive new random grain; untouched areas and the pattern still under the cursor
remain stable. Brush history is sampled every 50ms, independent of distance
travelled. Each sampled circle remains at the full 92px radius for 180ms and
then shrinks in hard logical-pixel steps over 820ms. Trail pixels never fade
through transparency. The editable implementation lives in
`src/slice/src/js/script.js`; generated theme JavaScript must continue to come
from `npm run build:theme`.

Storybook exposes the available full-page treatments as `Components/Backgrounds`
with one `background_style` selector. Its `dithering` option invokes the same
exported renderer as Drupal, while `plain-black` renders the page surface token.
The `particle-attraction` option is a separate Canvas 2D renderer with responsive
particle count, approximately 6px circles, collision separation, and a delayed
200px cursor-attraction field. Particle tones interpolate between semantic
monochrome tokens. A weak home force redistributes the dots after interaction,
and `prefers-reduced-motion` produces a static field. The dither shader therefore
retains one maintained implementation rather than a Storybook copy that can
drift from the live front page.

The planned scenic evolution uses **depth layers** rather than one flattened
background: sky, clouds, distant sea, wave bands, shoreline, sand dunes, and
foreground silhouettes. **Scroll travel** is the page's normalized vertical
progress; each layer receives a different **parallax rate**, with distant layers
moving least and foreground dunes moving most. The pointer texture remains a
surface treatment and must not become a separate visible object above the scene.

## Spacing and gaps

`space.scale.*` is the project spacing scale: `empty-space`, `line-size`,
`tight-gap`, `compact-gap`, `base-gap`, `medium-gap`, `large-gap`, `roomy-gap`,
`touch-size`, `section-gap`, `display-gap`, `page-gap`.

## Shape

- `shape.corner-radius.*`: none, extra-small, small-default, medium-default,
  large-default, extra-large, pill-full.
- `shape.border-width.*`: hairline-default, thick-default.

### Canvas shape language

Use this glossary for procedural WebGL artwork:

- **silhouette**: the closed outer boundary of a shape.
- **hard edge**: an abrupt transition at the silhouette, with no blur or alpha
  feathering.
- **face**: one projected 2D polygon representing a visible side of a 3D-looking
  object.
- **edge function**: a signed mathematical test that says whether a canvas pixel
  lies inside or outside a face.
- **signed distance field (SDF)**: a function returning distance to a shape's
  boundary; negative values are inside, positive values are outside.
- **color field**: the smoothly varying color evaluated independently inside a
  face.
- **alpha field**: the smoothly varying transparency inside a face. It may fade
  to transparent while the silhouette itself remains geometrically sharp.
- **grain continuity**: background and shape use the same logical-pixel noise
  scale and seed space, preventing the shape from looking pasted on.
- **projected solid**: several 2D faces arranged to imply a cube, dune, crystal,
  or other 3D form without requiring a full 3D engine.

The current technical choice is custom WebGL 1 in one canvas. Projected faces
and SDF primitives are sufficient for the reference cube, soft internal light,
hard face boundaries, transparency fields, dither, and parallax layers. Adopt a
3D scene library only when real camera rotation, perspective geometry, depth
occlusion, or dynamic lighting becomes a concrete requirement.

## Elevation and shadow

`elevation.shadow.level-0..level-6`, Material-style. Apply with
`@include tools.elevation("level-2");`. Shadow alpha uses 8-digit HEX. Each
level also has a progressively lighter `color.surface.elevation-level-*` token
from the approved `color.palette.dark-gray-*` scale. The Storybook Elevation
tiles consume the generated background and shadow utility classes directly.

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
in the theme `css/` and `js/`. The Drupal-specific `theme.scss` entrypoint
configures relative font URLs, and `npm run build:theme` copies source fonts from
`src/public/assets/fonts/` into the generated theme asset directory.

## Naming convention

Flattened token names are dash-separated and descriptive. Never use a lone
generic word (`orange`, `size`, `card`). Pattern:
`{layer}-{scope}-{part}-{property}-{state}`, e.g.
`component-timeline-marker-size-active`, `color-action-primary-default`.
