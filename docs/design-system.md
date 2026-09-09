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
hardcoded colors outside the YAML source, CSS opacity declarations, hardcoded
pixel dimensions in shared theme SCSS, and missing SCSS token variables. The
same contract is part of `npm run lint` and rejects HEX letters that are not
uppercase in `src/token/tokens.yaml`.

### Dimension ownership

Reusable absolute dimensions in the shared theme SCSS belong in
`src/token/tokens.yaml`. Name a component-owned value with the existing
`component.<component>.<part>-<property>-<state>` pattern, such as
`component.article-teaser.list-media-min-width-default`; use `system`, `layout`,
`space`, or `shape` only when the decision is genuinely shared at that layer.
SCSS consumes the generated dash-separated custom property and must not copy its
resolved pixel value.

Intrinsic CSS mechanics remain local: `0`, percentages, viewport units, flex
fractions, grid line numbers, aspect ratios, transforms, and spacing-grid
multipliers do not become tokens merely because they contain a number. Use the
generated breakpoint mixins instead of copying breakpoint widths into media
queries.

## Atomic design

Components are organised by Atomic Design and ITCSS layers:

| Layer      | Folder                         | Purpose                                  |
| ---------- | ------------------------------ | ---------------------------------------- |
| settings   | `src/slice/src/scss/settings/` | Hand-written theme settings              |
| tools      | `src/slice/src/scss/tools/`    | Mixins (elevation, motion, focus-ring)   |
| base       | `src/slice/src/scss/base/`     | Reset, global element defaults, typography|
| atoms      | `src/slice/src/scss/atoms/`    | Avatar, badge, button, chip, crossfade dot, date display, divider, icon, select input, surface, text input, tooltip, two-tone heading |
| molecules  | `src/slice/src/scss/molecules/`| Article teaser, author byline, breadcrumbs, contact widget, input text, media loader, pagination, project card, pull quote, search form |
| organisms  | `src/slice/src/scss/organisms/`| Font preview, pixel glyph editor, newsletter signup, site header, and larger page sections |
| components  | `src/slice/src/scss/components/`| Content layout and page-specific compositions |

Storybook mirrors these levels: `Foundations`, `Atoms`, `Molecules`,
`Organisms`, `Components`. Each component has exactly one story; use the
Controls tab for property combinations.

Font Preview is a shared Storybook/Drupal organism selected through an
allowlisted font identifier. Its initial HTML contains one editable preview input
rendered directly in the selected font, with no synchronized duplicate text,
status, Data table fallback, real local download, and one reusable dialog.
The custom-font input text and glyph-tile characters share
`component.font-preview.preview-character-size-default`, scoped to the
Roundabout and 4pixel variants rather than the global Text Input contract.
The Font Preview wrapper fills its component width and removes the composed
control's maximum width only inside `.font-preview__input`; shared Text Input
width variants keep their existing limits elsewhere.
Progressive enhancement parses the local TTF, creates responsive semantic glyph
buttons from drawable cmap mappings with only the mapped character visible in
each dark-black tile. The initial browser groups numbers, Latin capitals, Latin
lowercase, the font-specific language alphabet (Cyrillic for 4pixel and Greek for
Roundabout), and printable keyboard symbols in that order. A shared chevron
Button exposes every remaining mapping in a collapsed additional-glyphs region.
The accessible button name retains identification details, and the
dialog renders the selected outline, points, metrics, Unicode mappings, and path
data. Its 280px SVG viewport anchors the baseline after six 40px rows: four
font-body rows plus two overshoot rows for tall marks, followed by one 40px
descender row below the baseline. The renderer performs one OpenType-to-SVG
Y-axis conversion so the upright outline, guides, and point markers stay in the
same coordinate system for both fonts. Dialog metadata repeats the Data table's Caption
key and machine-readable value pairing. Path data starts collapsed behind a
40px shared ghost Button using `chevron-down.svg`; its machine-readable code
uses a dark-black `<pre>` surface. Embedded font names, copyright, and license values
are displayed as file-derived data; editorial claims remain separate authored copy. The download
action composes the shared Button and Icon contracts with `arrow-download.svg`.

Pixel Glyph Editor is a 4pixel-specific organism with exactly 16 toggle buttons
in a single 4×4 drawing surface. Click, keyboard, and pointer dragging edit the
same blank in-memory state; each button exposes its current state through
`aria-pressed`. A standard 40px Font Preview glyph tile sits to the grid's right,
vertically centered, and mirrors that state as a 16px 4×4 miniature after every
change. The component has no separately titled Preview section or filled-cell
counter. It does not persist, upload, or generate a font file.
Both organisms keep normal geometry in SCSS and tokens, with no presentational
sizing attributes in their initial markup.

Form controls share one `Molecules/Input fields/Input text` composition.
Its controls cover nine standard presentations: text, password, textarea,
select, single checkbox, radio group, checkbox group, choice chips, and file
upload. The independent `field_data_type` control records whether the
conceptual Drupal value is a string, long text, Boolean, list, or file; for
example, one Boolean value can be inspected as a single checkbox, Yes/No radio
group, select, or choice chips. Label, description, required, disabled,
selected, and validation-error states remain on that same page.

The reusable `Molecules/Input fields/Select Input` story supplies the select
renderer used by Input text rather than duplicating its markup. It emits a
native `<select>` first, so forms remain usable when JavaScript is unavailable.
Progressive enhancement adds an exact
40px trigger and suffix target, a 24px one-stroke chevron with a 36px circular
hover surface, and a keyboard-accessible listbox whose rows are at least 40px.
The listbox extends 4px beyond each trigger edge, aligns option text with the
current value, and distinguishes the selected option with the level-one surface.
On every open, viewport scroll, and resize, it measures the visible room around
the trigger and opens below or above accordingly. If neither side can contain
the full list, the roomier side receives a viewport-bounded scrolling menu while
each option retains its 40px minimum row height.
Drupal `.form-select` controls and the Site Header language picker receive the
same enhancement from the shared theme JavaScript; multi-select controls retain
their native browser UI. The header composes the same Storybook renderer and
keeps only a scoped presentation override: its trigger and menu are borderless,
and its wrapper shrinks to the selected language plus the shared suffix target.
Select, text, textarea, unchecked choice, and choice-chip control surfaces use
`color.palette.light-black`, one neutral palette tone above the default page
surface. The Select Input's selected listbox row uses `color.palette.deep-gray`
so it remains distinct from the lighter control and menu surface.

`Components/Content Layout` replaces separate blank Storybook shells for generic
pages, nodes, full Articles, Basic pages, and teasers. It exposes semantic
`readable` and `wide` content widths plus an optional sidebar. Drupal's native
`.layout-content` consumes the readable width directly; future Twig templates
can apply the same `.content-layout` classes without adding another story. The
Drupal `/blog` listing uses the 800px readable content-width token; `/videos`
uses the 960px wide token for its responsive grid. Drupal's content region and
full-node content stacks own a
two-base-gap vertical rhythm between sibling blocks, fields, structured Project
sections, and Project tags. Individual children do not add compensating layout
padding, so nested components remain responsible only for their internal
spacing.

Article teasers and full Article nodes share unique, node-derived View Transition
names for their titles and lead images. Same-origin navigation therefore morphs
the teaser title and medium image into the full page title and wide image in
supporting browsers. Drupal still owns the complete document request, rendering,
cache metadata, access checks, and history; browsers without cross-document View
Transitions use normal navigation, and reduced-motion users get an instant swap.
Article Teaser is a square-corner editorial card with a 16:9 image, bordered
surface, and a token-backed 150ms shadow transition. It is reserved for the
homepage three-tile composition and Storybook's `three_tile_grid` example.
The Blog and Videos Views use a separate borderless Article Blog List Item: a
horizontal media-and-content row with the same metadata contract, collapsing to
one column on mobile. This keeps both listings readable without treating every
post as a homepage card. Drupal gives this presentation its own `blog_list`
view mode, keeping its markup and render cache independent from the homepage
`teaser` cards.

`Organisms/Blog/Video Grid` composes those list items into three, two, or one
columns. Its Lazy Loading story runs the same scroll behavior as Drupal with
three simulated pages; Pagination Fallback and Loading Failure show the native
pager recovery. A polite status region announces loading, completion, and errors
without moving keyboard focus. The shared pagination renderer provides the
same `rel="next"` link contract as Drupal.
The completion message uses the shared gray text token.
Run `npm run test:video-grid` with the optional Playwright browser setup used by
`storybook:inspect`. `PLAYWRIGHT_MODULE_PATH` can select a bundled Playwright
module, and `PLAYWRIGHT_CHROME_CHANNEL=chrome` can use installed Chrome.

Article teaser metadata composes the shared Avatar atom. Storybook's Uploaded
state and Drupal's native compact-user `author_picture` use the same image slot;
if that image cannot load, the component reveals its initials-based Avatar UI.
Drupal retains ownership of the image formatter, cacheability, and access
metadata, but the Avatar intentionally removes the user-profile destination and
delegates its displayed dimensions to explicit size modifiers. The image slot
forces uploaded portrait or landscape thumbnails into a 1:1 image box with a
cover crop, while the Avatar shell clips that box to its circular radius. Small,
medium, large, and big map to 16px, 24px, 32px, and the 40px
`shape.basic-tile` token; medium remains the default but still renders the
`.avatar--medium` class.

Article detail pages use Drupal's native Comment entities for personal notes
about the linked video or written post. The Comment Message molecule reuses the
Article Teaser metadata layout with the existing 24px medium Avatar and Date
Display atoms, reads the public Full name from the comment author's user entity,
and renders that user's uploaded picture independently of Drupal's global
comment-picture theme toggle. Initials remain visible only when the profile has
no picture or its image cannot load. The molecule places the body in a white,
black-text speech bubble with a softly rounded tail. Its relative timestamp
describes when the website comment was posted, independently of the Article's
or YouTube video's publication date. Anonymous and authenticated visitors can
read published comments; only the restricted Content editor role can post,
publish without approval, or edit its own comments. The administrator account
retains Drupal's built-in privileged access, and automation accounts must use a
separate role without these posting permissions.

Full Article pages render `body` and `field_tags` through bundle-specific field
templates so each field owns meaningful BEM markup without Drupal's anonymous
default field wrappers. Article tags reuse the Chip atom as links to
the Article's listing, such as `/blog?tag=ui-ux-design` or
`/videos?tag=music`. The custom Blog argument plugin transliterates each Tags
label, lowercases it, replaces
non-alphanumeric runs with one hyphen, and resolves that readable value to
Drupal's internal term ID. Blog and Videos display the selected tag with a clear
action. Portfolio instead keeps all tags used by accessible published Projects
visible as Chip choices, marks the active Chip without a close icon, and clears
it when that selected Chip is activated again. Every listing keeps filtering
usable through normal navigation, reload, history, and copied URLs without a
visible exposed form or custom AJAX. Tags must have unique labels after slug
cleaning so each public value stays unambiguous.

The Crossfade Dot atom keeps its token-backed visible marker inside the standard
interactive target. Inactive dots use the dark-gray elevation surface, active
dots use solid white, and pointer hover uses the shared hairline outline width.
The shared `.crossfade-dot` class is consumed by both Storybook and Drupal's
two-image crossfade paginator.

The Icon Atom Storybook gallery presents the selected icon first, including its
machine name. Gallery items are keyboard-accessible clickable controls, and
hover/focus uses the next elevation surface to make the interaction visible.

Icons required by the current page render their own SVG geometry immediately.
`scripts/build-icon-sprite.mjs` generates `icon-geometry.html.twig` from the
editable files in `src/public/assets/icons/`; the shared Twig Icon component
renders only the requested icon branch, including one shared Figma geometry for all states.
The whole icon catalog is not embedded in the HTML shell. Internal SVG IDs are
scoped per instance so repeated icons cannot clash with the deferred sprite.

The cookie notice close button is server-rendered with its cross geometry before
the notice is revealed. Enhanced Select chevrons and the JavaScript fallback for
the cookie close button use a generated two-icon module, shipped inside the
normal theme script. They never wait for a sprite request, window.load or hover.
SCSS continues to own dimensions and colors. Storybook's Icon helper renders the
same generated geometry directly; its gallery and composed examples therefore
have the same initial-loading behavior as Drupal.

The versioned catalog sprite is still fetched after window.load for later
client-created symbols and HTTP cache reuse. Failure or delay of that optional
request cannot hide current-page icons. It retries once after 1.5 seconds, with
an eight-second timeout per attempt. Next-page asset warming retains its bounded
idle/intent behavior. The load event covers eager resources, not lazy images.

Theme and Storybook builds generate immediate markup and the versioned sprite
from the same source geometry. Rebuild and clear Drupal caches after SVG changes;
restart Storybook after editing sources. Ship the generated Twig and JavaScript
alongside the sprite manifest and hashed files. Retain older hashed files for
cached HTML. Deployment cache headers control retention and revalidation.

After the icon loader settles, `asset-warming.js` uses idle time to inspect one likely next
public page (the first Article title, otherwise a header navigation link).
Hover or keyboard focus can prepare a second destination. Each page view has a
budget of two destination requests, one at a time, with a five-second timeout
and a 256 KiB HTML inspection limit. Up to six previously unseen same-origin
stylesheet, script and image URLs per destination receive low-priority HTTP
prefetch hints; at most two images are hinted. Existing resource requests and
already hinted URLs are deduplicated. This prepares the image `src` fallback;
responsive derivatives, CSS-referenced fonts/backgrounds and videos are not
recursively fetched. Browsers may decline prefetch hints or evict cached assets.

Warming pauses for hidden tabs, offline connections, Save-Data and reported
2G/3G connections, and is disabled for signed-in pages. Only header navigation
and Article title/image links qualify. External URLs, downloads, query/hash
links, administration/account/action paths, redirects and private/no-store
responses are excluded. A `data-no-prefetch` ancestor opts a link out. Native
navigation remains unchanged; HTTP cache headers govern reuse and revalidation.
There is no service worker or custom persistent cache. Verify deployment cache
headers separately; local behavior does not prove production cache policy.


The Breadcrumbs molecule and Drupal share the same class contract. Nested pages
show a trail when Drupal resolves an accessible parent beyond Home, for example
`Guidelines / Logo Icon`. First-level pages have no breadcrumb trail. The final
item is the current page title with `aria-current="page"`. Footer links highlight
the current page and ancestors resolved by Drupal's breadcrumb or menu active
trail: `aria-current="page"` identifies the destination itself, while `location`
identifies its parent section. Route and path cache contexts keep these states
and breadcrumb titles separate between sibling pages. Full Article pages show only a
top-left Back link to `/blog` for personal Articles or `/videos` for YouTube
reference Articles, with the name-addressable Icon Atom. Its
`arrow-left` geometry lives in
`src/public/assets/icons/arrow-left.svg`, is copied to the Drupal theme during
the theme build, and remains a current-color, 1px-stroke line icon.
The Back link uses the caption typography role.
The Back link follows the Article-kind destination and does not use browser
history, so an Article opened from another page still returns to its public
listing.

Form and input labels use the regular 14px `caption` typography role across the
Text Input atom, Input text molecule, and Drupal's native `.form-item` markup.
This keeps `<label>` and form-group `<legend>` text at font weight 400 while
leaving semibold `subtitle-2` typography available to non-form UI. Storybook's
Select Input and Input text examples wrap each label/control pair in
`.input-text__label-control`, which owns their 8px gap. Form labels use an
explicit 16px height and line-height so control placement does not depend on the
font's intrinsic line box.

Static source assets, including local font files used by Storybook, live in
`src/public/`.

The Top Nav Menu Site Header adapts the compact floating structure of
[Shadcnblocks Navbar 33](https://www.shadcnblocks.com/block/navbar33) to the
project's square-corner dark theme. Drupal's existing Site branding and Main
navigation blocks become the left logo and centered one-level menu, while a
right-side language picker exposes only `Eng` and `Rus`. It composes the shared
Select Input atom with a borderless, intrinsic-width header treatment and uses
Drupal's enabled interface languages and URL negotiation, so it preserves the
current route and query string. Drupal's route active trail supplies current-page
styling, so listing query values such as `/portfolio?tag=font` do not deactivate
the Portfolio menu item. The Home menu item is hidden above the mobile breakpoint;
the desktop logo links to the front page. Home remains in the mobile menu, identified
in Drupal by its front-page route rather than its translated label.
Through the token-defined 640px mobile maximum, the
24px three-line menu icon replaces the logo on the left while the language
selector remains on the right. The icon stays white in every state. Activating
it turns it into a cross and opens the one-level Main navigation
as a vertical, full-viewport header surface without a separate overlay. Menu
items and the menu-toggle background move one grayscale surface level lighter
on hover or keyboard focus. Escape,
selecting a menu link, or returning to tablet width closes it. Authenticated pages hide Gin's secondary toolbar to keep the public header
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
Drupal renders first/last numbered links only when those pages are outside the
visible numbered range, preventing duplicate boundary pages. The last-page
label uses the pager's total page count.

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

Roles: `headline-1/2/3/4/5/6`, `subtitle-1/2`, `eyebrow`, `body`, `body-2`,
`link`, `caption`, `code`, `machine-readable`, `badge`, `overline`, and
`numeric-display`. Base HTML
headings and paragraphs are mapped in `base/_typography.scss`. Anchors inherit
their surrounding typography by default, so a link inside a heading keeps that
heading's size and weight. Apply `.text-link` when a standalone link should opt
into the dedicated `link` role. Component selectors can choose their nearest
role and own non-font treatment such as underlines or uppercase text.

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

Numeric Values is a responsive Home-page-ready tile section. Each semantic `h2`
number uses the 64px `numeric-display` role backed by Ubuntu Sans Mono, while
its Text uses `subtitle-1`. The reusable Drupal Content Block accepts one to
eight nested items and the grid caps each row at four tiles. Each item can add
one optional project-owned asset through the shared Icon component; the current
two homepage items intentionally omit icons. Date Time Value uses the caption scale and
the same monospaced family for absolute dates, elapsed time, and read/watch
durations. Numeric Value items expose Number, Text, Icon, and an optional Start
year used to calculate elapsed years automatically.

The source stays deliberately short, for example
`headline-4: '600 32px var(--typography-font-family-sans)'`. The builder emits
`--typography-headline-4` plus a mixin that applies it through the `font`
property. Line height and letter spacing use browser defaults unless a future
role has a concrete reason to override them.

Handwritten CSS and SCSS must not declare numeric `font-size` values or numeric
`font` shorthands. Use a generated typography role mixin or a semantic size
token; the token-contract lint rejects raw `px`, `rem`, and `em` typography.

Open Sans is the only website heading/body family. Most typography roles below
24px use the attached Open Sans Light face at weight 300; the compact `badge`
role uses semibold 14px for stronger component labels. Roles at 24px and above
retain their existing weights. Roundabout is demonstration-only and appears on
the Fonts foundation page and its Project's Font Preview. 4pixel is reserved
for its demonstration, Project preview, and compact technical details: the 5px
`overline` role is used by the version watermark and similarly technical
labels.
Storybook's manager and Docs interface use Open Sans for UI text and the
`typography.code` role for 14px bold Courier New code and technical metadata.
Compact system values and identifiers use the regular 14px
`typography.machine-readable` role backed by Ubuntu Sans Mono; the Font Preview
metadata table pairs that role with Caption keys.
Links use a 1px token-backed underline and the primary white text token in
default and hover states without replacing the surrounding typography. The
version Git-hash link explicitly retains the 4pixel family and a persistent 1px
solid underline so it reads as a technical link without relying on color.

Footer Navigation uses four titled columns of vertically stacked list links:
Social networks, Get in touch, How I work, and Information. The columns stack on
mobile, with the rights message below. Storybook imports the same social profile
data as Drupal.
Social links compose the shared Icon atom with locally stored monochrome
`social-*.svg` assets. Only the explicitly classed social-network icon is reduced
to 16px, along with the How I work brand icons. Figma alone uses an 18px-high
viewport and the complete `brand-figma.svg` geometry in both states: its fills
inherit `currentColor` at rest and restore token-backed brand colors on hover
or keyboard focus. The External Link icon retains the Icon atom's 24px default
and appears only inside the hover/focus label for all three external-link groups.
`currentColor` supports black or white presentation; the dark footer uses white,
switching the icon and label to each network's color
on hover and keyboard focus while the platform label changes to the account
name: LinkedIn, Facebook, and VK blue, YouTube red, SoundCloud orange, and
Steam's interface blue. The account label ends with the shared External Link
icon, and each social profile opens in a new window. These colors live in the
`component.footer-navigation` tokens. Icon geometry comes from Simple Icons 11.15.0;
provenance and its CC0 notice are stored in `social-icons-license.txt` alongside
the assets.
Get in touch includes Telegram and Gmail (`mailto:jurenites@gmail.com`). Gmail
reveals the email address on hover and keyboard focus, with Google red from its
footer token (`#EA4335`), with anchor specificity that overrides the global yellow
hover color. Its updated 2026 Icon inherits the white text color at rest and
reveals token-backed gradients on hover or keyboard focus. It retains its
original aspect ratio and a separate 12px
height token for optical size adjustment. The
email link opens the mail app and omits the external-window mark and target.

Footer Navigation composes the Badge atom inside its Fonts link. Drupal supplies
the gray Badge's numeric label from the current count of accessible published
Projects tagged `#Font`; Storybook exposes the same label, destination, and
composed markup as controls rather than duplicating Badge HTML.
Numeric badges use `badge--numeric`: the Numeric Display role's Ubuntu Sans Mono
family, with tabular digits and a slashed zero, while retaining the compact Badge
size. The Fonts count enables this style in both Drupal and Storybook.
The Fonts label and its underline turn yellow on hover and keyboard focus;
the nested Badge keeps its own colors. The anchor itself has no text
decoration, so the Badge number never receives an underline. Global link defaults
explicitly exclude badged footer links; do not replace this with a specificity
override. Badge uses both flex alignment axes to center its label within its
minimum width and height.

Author Byline keeps its name and metadata in one wrapping inline row in both
Storybook and Drupal. Date Time Value owns the three semantic variants used by
article metadata: absolute dates, elapsed time, and durations. Elapsed YouTube
reference dates use calendar years, months, and days; shorter values fall back
to hours and minutes. The duration variant owns the split number, unit, and
remaining label markup: the integer and `min` use secondary text while `to read`
or `to watch` uses gray text. Each date and duration remains a machine-readable
`time` element while surrounding molecules retain author, topic, and layout
responsibilities.

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
  aliases to HEX. Palette tokens emit their HEX directly; semantic theme and
  component tokens are kept only when a real consumer needs them. The generated
  JS still exposes resolved HEX values for contrast calculations and Figma sync.
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

At the mobile breakpoint, the homepage hero block has eight base gaps (64px)
of top padding. The hero photo plane is 70 base gaps (560px) wide and centered
on the viewport, with its light overlay aligned and image `max-width` disabled.
The hero clips the excess width to prevent horizontal page scrolling.
The screen-light toggle is hidden at the mobile breakpoint (640px and below).

The Drupal homepage uses `color.palette.full-black` as a plain background and
does not initialize a canvas. Storybook exposes `plain-black` and the experimental
`particle-attraction` treatment through the `Components/Backgrounds`
`background_style` selector. Particle attraction is a separate Canvas 2D renderer with responsive
particle count, approximately 6px circles, collision separation, and a delayed
200px cursor-attraction field. Particle tones interpolate between semantic
monochrome tokens. A weak home force redistributes the dots after interaction,
and `prefers-reduced-motion` produces a static field.

`Molecules/Media Loader` owns the bounded 16:9 loading frame. Image loading uses
an image-derived average color with a restrained gradient skeleton, then
crossfades to the completed image. The progressive-image behavior calculates
the color automatically from Drupal's cached 20px inline derivative, so editors
do not need to enter a HEX value for every upload. The default Storybook story
also exposes the average color as a color control for visual tuning.

External video loading retains a separate broken-TV noise treatment. Its shader
generates a fresh independent grayscale value from each logical pixel coordinate
and frame seed, without translating a spatial field or ordered pattern. Noise
advances at 15 frames per second, one quarter of the former full-refresh rate,
and reduced-motion renders one frozen frame. The editable renderer lives in
`src/slice/src/js/script.js`; generated theme JavaScript continues to come from
`npm run build:theme`.

Full Article YouTube embeds reuse that noise renderer as an initial no-signal
layer. The layer occupies the responsive player figure's actual layout box, so
its dimensions and aspect ratio follow the Drupal field formatter rather than a
duplicated 720x405 size. It disappears when the iframe loads, then destroys its
canvas and stops rendering frames. The handoff uses a 200ms opacity-filter
transition so the loaded YouTube thumbnail replaces the static without a hard
visual cut; reduced-motion removes that transition.

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

- `shape.corner-radius.*`: none, small, base, full. Every global radius currently
  resolves to `0px`, giving the website, native Drupal output, and Storybook a
  shared square-corner visual language while keeping semantic consumer names
  stable. Chip uses its `component.chip.corner-radius-default` pill radius;
  Avatar owns a local `9999px` identity-image radius; Select Input owns
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

## Button hover states

Ghost buttons use the same gray hover background token as secondary buttons
(`--theme-dark-action-secondary-hover`) across Drupal and Storybook.

## Naming convention

Flattened token names are dash-separated and descriptive. Never use a lone
generic word (`orange`, `size`, `card`). Pattern:
`{layer}-{scope}-{part}-{property}-{state}`, e.g.
`component-timeline-marker-size-active`, `theme-dark-action-primary-default`.
