# Design System

This is the visual guideline for the jurenites site. It documents the durable
rules. The machine-readable contract for every value lives in
`src/token/tokens.yaml`; this page explains intent and usage.

## Source of truth and flow

```text
src/token/tokens.yaml            <-- editable single source of truth
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
SCSS token variables. The same contract is part of `npm run lint` and rejects
HEX letters that are not uppercase in `src/token/tokens.yaml`.

## Atomic design

Components are organised by Atomic Design and ITCSS layers:

| Layer      | Folder                         | Purpose                                  |
| ---------- | ------------------------------ | ---------------------------------------- |
| settings   | `src/slice/src/scss/settings/` | Hand-written theme settings              |
| tools      | `src/slice/src/scss/tools/`    | Mixins (elevation, motion, focus-ring)   |
| base       | `src/slice/src/scss/base/`     | Reset, global element defaults, typography|
| atoms      | `src/slice/src/scss/atoms/`    | Avatar, badge, button, chip, crossfade dot, date value, divider, icon, select input, surface, text input, two-tone heading |
| molecules  | `src/slice/src/scss/molecules/`| Article teaser, author byline, breadcrumbs, contact widget, form field, media loader, pagination, project card, pull quote, search form |
| organisms  | `src/slice/src/scss/organisms/`| Newsletter signup, site header, and larger page sections |
| components  | `src/slice/src/scss/components/`| Content layout and page-specific compositions |

Storybook mirrors these levels: `Foundations`, `Atoms`, `Molecules`,
`Organisms`, `Components`. Each component has exactly one story; use the
Controls tab for property combinations.

Form controls share one `Molecules/Form Field` composition. Its controls cover nine standard
presentations: text, password, textarea, select, single checkbox, radio group,
checkbox group, choice chips, and file upload. The independent `field_data_type`
control records whether the conceptual Drupal value is a string, long text,
Boolean, list, or file; for example, one Boolean value can be inspected as a
single checkbox, Yes/No radio group, select, or choice chips. Label,
description, required, disabled, selected, and validation-error states remain
on that same page.

The reusable `Atoms/Select Input` renderer supplies the Form Field select rather
than duplicating its markup. It emits a native `<select>` first, so forms remain
usable when JavaScript is unavailable. Progressive enhancement adds an exact
40px trigger and suffix target, a 24px one-stroke chevron with a 36px circular
hover surface, and a keyboard-accessible listbox whose rows are at least 40px.
The listbox extends 4px beyond each trigger edge, aligns option text with the
current value, and distinguishes the selected option with the level-one surface.
On every open, viewport scroll, and resize, it measures the visible room around
the trigger and opens below or above accordingly. If neither side can contain
the full list, the roomier side receives a viewport-bounded scrolling menu while
each option retains its 40px minimum row height.
Drupal `.form-select` controls receive the same enhancement from the shared
theme JavaScript; multi-select controls retain their native browser UI.

`Components/Content Layout` replaces separate blank Storybook shells for generic
pages, nodes, full Articles, Basic pages, and teasers. It exposes semantic
`readable` and `wide` content widths plus an optional sidebar. Drupal's native
`.layout-content` consumes the readable width directly; future Twig templates
can apply the same `.content-layout` classes without adding another story. The
Drupal `/blog` listing uses its own 800px content-width token so article teasers
and pagination have slightly more room without widening standard pages.

Article teasers and full Article nodes share unique, node-derived View Transition
names for their titles and lead images. Same-origin navigation therefore morphs
the teaser title and medium image into the full page title and wide image in
supporting browsers. Drupal still owns the complete document request, rendering,
cache metadata, access checks, and history; browsers without cross-document View
Transitions use normal navigation, and reduced-motion users get an instant swap.
Article Teaser is a square-corner editorial card with a 16:9 image, bordered
surface, and a token-backed 150ms shadow transition. Pointer hover and keyboard
focus-within move from level-zero shadow to the component hover shadow adapted
from the [Shadcnblocks Blog 47 original](https://www.shadcnblocks.com/block/blog47).
The entire card presents a pointer cursor, while hovering or focusing anywhere
on it grows the image inside its clipped frame to 105% without changing grid
geometry. The Blog View and the Storybook three-tile example use the same
responsive auto-fitting grid contract, collapsing naturally when fewer 240px
card columns fit.

Article teaser metadata composes the shared Avatar atom. Storybook's Uploaded
state and Drupal's native compact-user `author_picture` use the same image slot;
if that image cannot load, the component reveals its initials-based Avatar UI.
Drupal retains ownership of the image formatter, cacheability, and access
metadata, but the Avatar intentionally removes the user-profile destination and
delegates its displayed dimensions to `.avatar__uploaded-image` component SCSS.

Full Article pages render `body` and `field_tags` through bundle-specific field
templates so each field owns meaningful BEM markup without Drupal's anonymous
default field wrappers. Article tags reuse the Chip atom as links to
`/blog?tag=<clean-tag-slug>`, such as `?tag=ui-ux-design`. The custom Blog
argument plugin transliterates each Tags label, lowercases it, replaces
non-alphanumeric runs with one hyphen, and resolves that readable value to
Drupal's internal term ID. The Blog View displays the selected tag with a clear
action and keeps filtering usable through normal navigation, reload, history,
and copied URLs without requiring a visible exposed form or custom AJAX. Tags
must have unique labels after slug cleaning so each public value stays
unambiguous.

The Crossfade Dot atom keeps its visible circle at 4px inside the standard
40px interactive target. Inactive dots use the dark-gray elevation surface,
active dots use solid white, and pointer hover adds a 1px solid-white outline.
The shared `.crossfade-dot` class is consumed by both Storybook and Drupal's
two-image crossfade paginator.

The Breadcrumbs molecule also has one shared class contract. Drupal's breadcrumb
preprocess hook adds the resolved current-page title to core's ancestor links,
and `templates/navigation/breadcrumb.html.twig` maps the complete trail to the
same `.breadcrumbs` BEM markup and `aria-current` behavior used in Storybook.
Full Article pages additionally show a top-left text Back link to `/blog` with
the name-addressable Icon Atom. Its `arrow-left` geometry lives in
`src/public/assets/icons/arrow-left.svg`, is copied to the Drupal theme during
the theme build, and remains a current-color, 1px-stroke line icon. Breadcrumb
links use the caption typography role; the current page uses the pale secondary
text role.
For same-origin navigation the link uses browser history, preserving a selected
Blog tag and scroll/history state; direct-entry Articles retain `/blog` as the
normal link fallback.

Form and input labels use the regular 14px `caption` typography role across the
Text Input atom, Form Field molecule, and Drupal's native `.form-item` markup.
This keeps `<label>` and form-group `<legend>` text at font weight 400 while
leaving semibold `subtitle-2` typography available to non-form UI.

Static source assets, including local font files used by Storybook, live in
`src/public/`.

The Top Nav Menu Site Header adapts the compact floating structure of
[Shadcnblocks Navbar 33](https://www.shadcnblocks.com/block/navbar33) to the
project's square-corner dark theme. Drupal's existing Site branding and Main
navigation blocks become the left logo and centered one-level menu, while a
native right-side language selector exposes only `Eng` and `Rus`. The selector
uses Drupal's enabled interface languages and URL negotiation, so it preserves
the current route and query string. On mobile the logo and language selector
remain on the first row while the compact menu moves to a second row and retains
horizontal scrolling only as a narrow-content fallback. Authenticated pages hide Gin's secondary toolbar to keep the public header
visually unambiguous; Gin's primary administration navigation remains available.
The public element defaults are scoped by the `jurenites-theme` body class so
they do not become unqualified page-wide rules. Gin's navigation keeps its own
structure and 14px toolbar typography while its blue and blue-gray color
variables resolve through the Jurenites palette tokens.

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

Each typography role is one CSS-ready `font` shorthand value. Use the generated
role mixins instead of rebuilding the shorthand in components:

```scss
.card__title { @include tools.typography-headline-5; }
```

Roles: `headline-3/4/5/6`, `subtitle-1/2`, `eyebrow`, `body`, `body-2`, `link`,
`caption`, `code`, and `overline`. Base HTML elements (`h1`-`h6`, `p`, `a`) are mapped in
`base/_typography.scss`; component selectors reuse the nearest role and own
non-font treatment such as underlines or uppercase text.

Native heading levels `h3` through `h6` map directly to the matching
`headline-3` through `headline-6` typography roles. The existing `h1` and `h2`
mappings remain in place until corresponding `headline-1` and `headline-2`
roles are defined.

Article Teaser titles are semantic `<h3>` elements styled with `subtitle-1`
(16px semibold). Teaser excerpts and native teaser body paragraphs use `body-2`
(14px), while full Article body paragraphs retain the default `body` role at
16px.

The Two-tone Heading atom defaults to `h3` and therefore uses `headline-3` for
prominent editorial titles. Its component class does not override typography:
changing the semantic heading level applies that element's base typography role.
The atom accepts leading strong, soft, and trailing strong plain-text segments,
with semantic `inline` or `new-line` placement for the latter two segments. This
keeps Drupal authoring structured while supporting either two colored lines or
a soft phrase sandwiched between strong phrases without WYSIWYG markup.

Basic pages use their native node Title as the leading strong segment and store
Title 2, Title 3, and both placement choices in one compound
`field_two_tone_heading` field. The field type keeps each property typed and
translatable in one field table instead of using four separate fields or an
opaque JSON value. The Basic page title remains a semantic `h1`; Storybook's
`heading_level` is a render-context control and is not editorial content.

The source stays deliberately short, for example
`headline-4: '600 32px var(--typography-font-family-sans)'`. The builder emits
`--typography-headline-4` plus a mixin that applies it through the `font`
property. Line height and letter spacing use browser defaults unless a future
role has a concrete reason to override them.

Handwritten CSS and SCSS must not declare numeric `font-size` values or numeric
`font` shorthands. Use a generated typography role mixin or a semantic size
token; the token-contract lint rejects raw `px`, `rem`, and `em` typography.

Open Sans is the only website heading/body family. Roundabout is
demonstration-only and appears solely on the Fonts foundation page. 4pixel is
reserved for its demonstration and compact technical details: the 5px
`overline` role is used by the version watermark and similarly technical labels.
Storybook's manager and Docs interface use Open Sans for UI text and the
`typography.code` role for 14px bold Courier New code and technical metadata.
Text links use the primary white text token in default and hover states. The
version Git-hash link explicitly retains the 4pixel family and a persistent 1px
solid underline so it reads as a technical link without relying on color.

## Color

- HEX only, with letters written in uppercase. Never use the CSS `opacity`
  property; express alpha as 8-digit HEX (used for shadow colors) so composited
  colors stay predictable.
- Color mappings use three explicit layers. `color.palette.*` directly owns each
  reusable palette role as one uppercase HEX string, so the role and HEX each
  occur once without a duplicate value registry. An optional inline comment
  supplies a friendlier swatch label when the role name itself is insufficient.
  `theme.dark.*` owns global semantic surface, text, action, border, brand, and feedback roles, and
  `component.{component-name}.color.*` owns component-specific mappings.
- Palette colors stay on one line, for example
  `system-success-soft: "#7EB991" # Light green`.
  Theme and component assignments are direct YAML key/value pairs such as
  `primary: color.palette.brand-primary`, without quotes or braces. The token
  loader converts the concise source schema to internal DTCG records and fails
  on object-valued or malformed raw colors, old quoted/braced references,
  malformed dot paths, or lowercase HEX letters.
- The same concise syntax applies to every other token family: scalar tokens
  stay on one line, references are unquoted dot paths, lists use inline arrays,
  and elevation shadows are complete quoted CSS values ready for `box-shadow`.
  Explain values with YAML comments.
  Source `$type`, `$value`, and `$description` fields are rejected because the
  builder infers generated metadata.
- Palette cardinality is open-ended: it may define two brand roles, a triad, a
  tetrad, or more without changing the token builder. Only roles referenced by
  the theme must exist.
- Generated CSS preserves each reference as `var(--…)` instead of flattening
  aliases to HEX. Palette tokens emit their HEX directly; for example,
  `theme.dark.brand.primary` emits
  `--theme-dark-brand-primary: var(--color-palette-brand-primary)` while the
  generated JS still exposes its resolved HEX for contrast calculations and Figma sync.
- `generated/token/color-mappings.json` presents the three layers as compact
  key/value tables. It is a generated inspection surface; edit
  `src/token/tokens.yaml`, never the JSON artifact.
- Theme surface names use `theme-dark-surface-background-*`; foreground roles
  use `theme-dark-text-*`; actions use `theme-dark-action-*`; and lines use
  `theme-dark-border-*`. Component-owned colors follow
  `component-{component-name}-color-{property}-{state}`. Watermark identity and
  credit colors therefore live under `component-watermark-color-*`.
- The screenshot signature uses dedicated solid semantic colors with no opacity
  or blend mode. Configured HEX values therefore reach solid glyph pixels
  unchanged; only normal font anti-aliasing affects edge pixels.
- Palette, Abstraction Levels, and Color Contrast reuse one internal Color
  Block renderer. It is not a standalone Storybook story. Its color chip is a 96px
  square by default or a compact 40px square for dense logical-token mapping;
  these are private Storybook layout settings, not public design tokens. The
  information container remains flexible and prioritizes readable names.
  Abstraction Levels presents Palette, Theme → Palette, and Component Mappings.
  Component colors normally map through theme semantics; deliberately
  component-owned colors such as Watermark may map directly to the palette.

The mapping JSON and reference-preserving token records are the safe read model
for a future drag-and-drop Storybook editor. Write-back is intentionally deferred:
it needs schema validation, conflict handling, and an explicit save boundary
before browser controls are allowed to rewrite the YAML source. The same token
tree already supports adding new typed families such as shadows; gradients need
a documented token type and formatter before they become universal theme inputs.

## Homepage background and media noise

The Drupal homepage uses `color.palette.full-black` as a plain background and
does not initialize a canvas. Storybook exposes `plain-black` and the experimental
`particle-attraction` treatment through the `Components/Backgrounds`
`background_style` selector. Particle attraction is a separate Canvas 2D renderer with responsive
particle count, approximately 6px circles, collision separation, and a delayed
200px cursor-attraction field. Particle tones interpolate between semantic
monochrome tokens. A weak home force redistributes the dots after interaction,
and `prefers-reduced-motion` produces a static field.

`Molecules/Media Loader` owns the broken-TV noise treatment for a bounded 16:9
video-upload placeholder. The shader generates a fresh independent grayscale
value from each logical pixel coordinate and frame seed, without translating a
spatial field or ordered pattern. Noise advances at 15 frames per second, one
quarter of the former full-refresh rate, and reduced-motion renders one frozen
frame. The component also exposes filename, upload status, and native progress
markup. The editable renderer lives in `src/slice/src/js/script.js`; generated
theme JavaScript continues to come from `npm run build:theme`.

The planned scenic evolution uses **depth layers** rather than one flattened
background: sky, clouds, distant sea, wave bands, shoreline, sand dunes, and
foreground silhouettes. **Scroll travel** is the page's normalized vertical
progress; each layer receives a different **parallax rate**, with distant layers
moving least and foreground dunes moving most. The pointer texture remains a
surface treatment and must not become a separate visible object above the scene.

## Spacing and gaps

`space.scale.*` keeps only the literal exceptions `zero-pixels`, `one-pixel`,
and `two-pixels`, plus the `base-gap` 8px grid unit. Calculate every larger
spacing value where it is used so the multiplier remains visible instead of
requiring another semantic size name. For example,
`margin-left: calc(var(--space-scale-base-gap) * 2);` produces 16px.

## Shape

- `shape.corner-radius.*`: none, small, base, full. Every radius currently
  resolves to `0px`, giving the website, native Drupal output, and Storybook a
  shared square-corner visual language while keeping semantic consumer names
  stable. Avatar owns a local `9999px` identity-image radius; Select Input owns
  a local 50% radius only for its transient 36px hover indicator inside the
  otherwise square 40px suffix target.
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
level also has a progressively lighter `theme.dark.surface.background-elevation-level-*`
token selected by the active theme. The Storybook Elevation
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
  field/       media/       views/        taxonomy/       navigation/
```

We keep our distinction: editable source in `src/slice/`, compiled minified assets
in the theme `css/` and `js/`. The Drupal-specific `theme.scss` entrypoint
configures relative font URLs, and `npm run build:theme` copies source fonts from
`src/public/assets/fonts/` into the generated theme asset directory.

## Naming convention

Flattened token names are dash-separated and descriptive. Never use a lone
generic word (`orange`, `size`, `card`). Pattern:
`{layer}-{scope}-{part}-{property}-{state}`, e.g.
`component-timeline-marker-size-active`, `theme-dark-action-primary-default`.
