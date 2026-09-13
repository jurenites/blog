# Conway's Game of Life Article

The personal Article at `/blog/conways-game-of-life` is attributed to the
`alexander` account. Its editable English copy, linked sources, original pattern diagrams, and two
supporting films belong to Drupal editors. The initial long draft has since been
shortened by the author; code changes preserve that editorial copy.
Its first-person reflections develop the author's supplied thoughts about
emergence and physics; the physical-world comparison is presented as an analogy.

## Content and placement

The stable node UUID is `b52ac74b-fd4b-4c2a-9225-84646d785adb`. The
`jurenites_life` module adds the experiment to that node's full display above
the byline and body, and to its Blog-list and teaser media slots. It follows the
node across alias changes and does not appear on unrelated Articles. It is a node render component;
there is no separately placed site-wide block.

Edit the Article Body through Drupal using an administrative account with
Basic HTML or Full HTML access. The `alexander` account supplies the public attribution;
its existing restricted content-editor permissions are unchanged. The optional,
repeatable **Supporting videos** field uses native Remote video Media and Media
Library. Keep the main YouTube field empty: it controls whether an Article is
listed under Blog or Videos. Supporting videos render below the Body.

The creator explicitly linked the Lenia film on the Lenia project site. The
other film is Conway's Numberphile interview. Both have visible creator credits
and ordinary YouTube links in the Body as fallbacks for external playback issues.
No remote footage or photographs have been copied into the repository.

## Simulation

- Responsive 16:9 surface matching Article thumbnails; two states, Conway B3/S23,
  eight neighbours, synchronous double-buffer updates, and wrapping edges.
- Each cell has an 8px outer footprint, shared 1px border, and centered 4px live
  square. The grid spacing is 7px: `columns × 7 + 1` gives the complete width.
  The border uses `--theme-dark-border-divider-default`. Raster resolution follows
  device pixel ratio without scaling the CSS cell dimensions.
- The 800px detail surface holds 114 columns across 799px. Only this Article's
  desktop list column grows from 280px to 281px, fitting 40 complete columns.
  Mobile returns to one column. Whole rows fit the 16:9 surface with a small
  unused margin when the height is not an exact grid multiple.
- Resizing retains living cells at surviving coordinates. Newly exposed cells
  start dead; cells outside a smaller field are discarded. Generation and pause
  state survive resize.
- Random initial population at 22% density; up to 12 generations per second.
  There is no automatic reseeding or ongoing random autonomous intervention.
- Pointer movement draws a one-cell-wide line without clicking. Interpolation
  fills gaps between pointer events instead of stamping preset shapes. The cell
  under a stationary cursor is held alive after every generation; the rest of
  the trail evolves normally. Scrolling recalculates the cell beneath the cursor.
  Leaving the canvas, losing focus, or ending/cancelling touch releases the hold.
  Touch can draw while retaining normal scrolling. Each thumbnail owns its board.
- Only generation status in the 4pixel Overline role at top left and a 32px ghost pause/play button at
  bottom right overlay the field. The button uses the supplied `pause-rect` and
  `play-triangle` icons through the shared Icon atom. Accessible labels switch
  between Pause simulation and Play simulation; keyboard activation is native.
  Each counter character has a fixed 5px advance, including the narrower `1`;
  changes in digit shape cannot shift subsequent digits or the left anchor.
- No visible heading, instruction prose, living-cell counter, or other controls.
  Reduced motion starts paused, and offscreen/hidden-tab work stops. Drupal
  detach removes listeners and observers. Without JavaScript, the canvas has
  accessible fallback text and the pause button remains hidden.
- CSS owns displayed dimensions and visual tokens. JavaScript sets only Canvas
  intrinsic bitmap resolution, paints each shared grid line once, and caches the
  grid drawing between generations.

The Storybook example is **Organisms/Game of Life**, with Detail and Thumbnail preview sizes. It shares the engine,
behaviour, and SCSS with Drupal and mirrors the module's semantic template.
Other rule families are discussed and linked in the article; the widget itself
runs Conway's rules, with the currently hovered cell sustained by visitor input.

## Reusable live examples

Place a standalone canvas in a template or in the Article Body using Basic HTML's
**Source** button. No wrapper, pause button, or counter is required:

```html
<canvas class="game-of-life__canvas"
  data-user='{"width":6,"height":6,"size":4,"alive":["b3","c4","d2","d3","d4"]}'
  role="img"
  aria-label="Live glider. Move the pointer to draw cells; reload to restore.">
  Glider example. Enable JavaScript for the interactive simulation.
</canvas>
```

- `width` is the number of columns and `height` the number of rows. Each accepts
  an integer from 3 through 100; both default to 5. Three is the minimum for eight
  distinct neighbours on a wrapping board.
- `size` is integer zoom from 1 through 8, default 1. Size 2 doubles the 8px cell
  footprint, 4px live square, and 1px shared border to 16px, 8px, and 2px. Because
  borders are shared, a 5×5 board is 36×36px at size 1 and 72×72px at size 2.
  The article's 6×6 examples at size 4 are 172×172px, with 32px cell footprints,
  16px living squares, and 4px shared borders.
  The canvas retains the authored dimensions; choose a size that fits its column.
- `alive` lists living cell addresses. Letters identify columns from left to right,
  numbers identify rows from top to bottom: `a1` is the upper-left cell. Addresses
  are case-insensitive; columns after `z` use `aa`, `ab`, and so on. Unlisted cells
  start dead, and an omitted/empty array starts an empty board.
- Use one JSON object with commas and double-quoted keys and cell addresses.
  Malformed JSON, unsupported dimensions/zoom, or out-of-range cells leave that
  canvas inactive with `data-life-error`, without interrupting other simulations.

Examples reuse the existing B3/S23 engine, wrapping edges, cached grid, 12-generation
per-second cap, pointer drawing, and stationary-pointer hold. Each canvas owns its
cells. Interactions are temporary: reloading restores the authored preset. The
6×6 glider above returns to its initial configuration after 24 generations when
undisturbed. Offscreen and hidden-tab animation stops; reduced-motion preference
starts examples stationary while pointer drawing remains available.

**Organisms/Game of Life Example** provides Glider, Blinker, Block, Beehive, Toad, and Boat stories
with editable dimensions, zoom, and living-cell arrays. SCSS attribute selectors
own all displayed sizing, using the existing cell/border tokens and example
defaults in `src/token/tokens.yaml`; JavaScript only sets intrinsic bitmap size.

The module's `jurenites_life_update_11001()` update enables this exact canvas class,
`data-user`, `role="img"`, and `aria-label` in Basic HTML and CKEditor source editing.
Fresh installations configure the same support. Other editor settings and article
copy are preserved. The editor is for authoring; the saved page runs the simulation.

### Article pattern table

`scripts/content/conway-game-of-life-examples.html` is the paste-ready Body fragment:
a short interaction explanation and a semantic table with a title, canvas, and
description for Block, Blinker, Glider, Beehive, Toad, and Boat. All six boards use
6×6 cells at 4× zoom. The table replaces the old `patterns.png` illustration and
its caption, together with the earlier standalone glider in the same paragraph.
Scoped SCSS keeps it readable at desktop and mobile widths without inline sizing.
Pattern terminology follows [Paul Callahan's introduction](https://www.math.com/students/wonders/life/life.html);
the engine tests verify every authored preset's cycle on the finite wrapping board.

The current local body uses Full HTML, which already supports native tables.
`jurenites_life_update_11002()` also enables native table editing in Basic HTML,
preserving the `game-of-life-examples` table class and row/column header scope.
The reusable fragment works in either format.

For the same content replacement in another environment, preview
`drush php:script scripts/replace-life-pattern-image.php`, then run it with
`LIFE_APPLY=1`. The script checks the expected image/introduction/caption, preserves
the other body text and fields, and saves a new revision for rollback. It does
nothing when the table is already present. This content replacement is separate
from database updates, so future deployments do not overwrite editorial changes.

## Reproduce in another environment

1. Build the theme with `npm run build:theme` and deploy the resulting source and
   generated assets through the normal environment workflow.
2. Enable `jurenites_life` with Drush (or apply its database update on existing
   installations). This adds reusable-canvas authoring and the optional supporting-video
   field and displays without replacing other Article configuration.
3. Run `drush php:script scripts/create-life-article.php` from the repository root.
   It creates the stable article and media once, checks alias/title collisions,
   and preserves subsequent editorial changes on rerun.
4. Clear Drupal caches and verify the article, Blog listing, images, and video
   players. External video metadata and playback require provider connectivity.

Initial copy lives in `scripts/content/conway-game-of-life.html`; metadata is in
the adjacent JSON file. Existing Drupal content is authoritative after creation.
The generation command `node scripts/build-life-graphics.mjs` creates the SVG
diagram masters from exact cell coordinates and generated design tokens. Pass
an absolute `package.json` path for an existing Node runtime containing Sharp as
its first argument to also regenerate the PNGs. PNGs are used in Basic HTML
because Drupal's secure-image filter verifies raster dimensions with PHP.
Run `npm run build:theme` afterwards to copy the image assets into the theme.

## Verification

`node --test tests/game-of-life.test.mjs` checks still life, a two-phase oscillator,
four-step glider translation, synchronous updates, wrapping at both edges, exact
799px/281px grid sizing, preservation of cells on resize, preset parsing, exact zoom,
and the 20-generation wrapping glider cycle.
The six table fixtures are also checked against their advertised periods,
including the 24-generation cycle of the 6×6 glider.
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node --test tests/game-of-life-browser.test.mjs`
checks multiple canvases, rectangular sizing, high-DPI painting, independent pointer
edits, preset restoration on reattachment, reduced motion, offscreen suspension,
invalid-input isolation, the full widget's controls, and all six 172px canvases
without horizontal overflow at desktop and 360px mobile widths.
`drush php:script tests/game-of-life-examples.php` checks filtered JSON/canvas markup,
restricted attributes, source-editing settings, and idempotent configuration.
`drush php:script tests/game-of-life-article.php` checks the actual node, render
scope, filtered images, video references, and idempotent content setup.
Theme/Storybook builds, focused lint, desktop interaction, and mobile/reduced
motion checks complete the local review. This iteration does not deploy to PROD.
