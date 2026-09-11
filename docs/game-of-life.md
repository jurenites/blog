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
Basic HTML access. The `alexander` account supplies the public attribution;
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

## Reproduce in another environment

1. Build the theme with `npm run build:theme` and deploy the resulting source and
   generated assets through the normal environment workflow.
2. Enable `jurenites_life` with Drush. This adds the optional supporting-video
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
799px/281px grid sizing, and preservation of cells on resize.
`drush php:script tests/game-of-life-article.php` checks the actual node, render
scope, filtered images, video references, and idempotent content setup.
Theme/Storybook builds, focused lint, desktop interaction, and mobile/reduced
motion checks complete the local review. This iteration does not deploy to PROD.
