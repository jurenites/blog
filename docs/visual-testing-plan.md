# Visual Testing: Local Tools and Remaining Work

Status: the local dashboard supports multiple real website examples and native
interaction states per component, alongside Storybook and pinned Figma references.
Its appearance mode accepts different labels and content-driven widths while
checking measured styles. Exact pixels remain a separate, content-matched mode.
Figma references can be missing; implementation comparisons remain available.
Pages and organisms also have frozen Before / After milestones with scrubbable
transitions, semantic blueprint layers, Git evidence and editable design rationale.
The language-picker suite also has pinned Figma exports and three recorded
interaction states at two viewports. Automatic Figma exports, Windows VM tests,
and CI ingestion remain future work. Current results belong to saved reports,
not to historical findings in this document.
This layer defines milestone 12, **Testing**, of the
[Cookbook](cookbook-product-design-process.md), supplies evidence for milestone
13, final verification, and supports checks throughout the
[project workflow](workflow.md).

## Purpose

Compare the intended design, the isolated component, and the Drupal theme with
real data. A reviewer should be able to inspect all three representations of
the same case and see exactly what an automated result checked.

| Comparison | What it checks |
| --- | --- |
| Figma frame ↔ Storybook component | Component appearance and designed states |
| Figma page or section frame ↔ Drupal page or section | Composition with actual content and theme rendering |
| Storybook component ↔ the same component in Drupal | Integration preserves the shared component contract |

A page frame must be compared with an equivalent page capture, and a component
with the corresponding clipped component region. Different text, media, states,
or bounds make a case unmatched; they must not produce a passing pixel result.

The detail heading places its group before the component name with a `/`
separator, preserving their existing typography. Autosave feedback is visually
hidden but remains available to assistive technology. The preview has no scale,
layout or stale-status sentence above it; the selected component's recorded
capture date appears at the bottom of the page and clears for uncaptured or
milestone-only entries. Detailed evidence still carries its recorded status.
Dashboard actions render the shared Storybook Button and Icon-button helpers,
including capture submission, suite execution and the temporarily hidden matrix
controls. Capture actions use the primary Button variant; their text selection,
hover, focus and disabled behavior come from the atom without local restyling.
The website-example remove icon uses the existing secondary-hover color on hover
and keyboard focus, one palette step lighter than its elevated example surface.
Website examples show their number in the “Example URL N” field label. The remove
icon button follows the URL input with an 8px gap, aligned with the input rather
than the far edge of the settings surface. Their
fieldset legend and “Live web” heading are visually hidden; numbering updates
when examples are removed. Required labels use the shared Input text red asterisk
for Storybook URL and selector, website example URL and selector, and capture
viewport height. Optional labels remain unmarked; native required validation is preserved.

Capture controls appear at the end of Storybook source settings, after its URL
and component selector, revealed by the Storybook gear. Standard comparisons
have no separate Capture settings disclosure. The controls retain their form
association and autosave behavior. The language-picker test suite retains its
standalone test-run disclosure.

Capture settings uses “Appearance · allow different copy” for all new captures;
the comparison-mode picker and exact-pixel confirmation are hidden. The state
checkboxes are hidden, and dashboard drafts and submissions always request only
the default state, regardless of previously saved interaction selections. The
action labeled “Capture all examples” is hidden. Valid Storybook URL, selector, viewport
and website-example edits now trigger a default-state capture after one second
of inactivity. Opening a component, switching layout or toggling disclosures does
not run tests. Captures are serialized; newer edits queue the latest settings
and superseded results do not replace the active form. Incomplete website examples
are saved as drafts and omitted from the run so they do not block Storybook.
Progress and capture errors appear beside the Storybook preview; the PNG and
Recorded checks refresh after completion. Missing Storybook captures expose a
shared upload Icon-button. Uploaded PNGs persist separately from Figma, are
explicitly labeled as untested manual images, and are replaced by the next
successful Storybook capture. There is no
nested Advanced capture settings disclosure. Shared
Range Slider atoms select width presets (360, 768, 1280, 1920px) and height presets
(640, 720, 900, 1080, 1440, 2160px). The height slider is vertical and 120px tall,
paired with an 80px-wide number input that still accepts exact heights. Width also
has an 80px number input, accepting any positive whole-pixel value independently
of the slider presets. Manual values retain their exact width while the slider
indicates the nearest preset. Interactive preview uses that exact iframe width;
its surrounding disclosure fits the viewport plus 16px content padding on each
side, capped by the available column width. Wider viewports scroll without
scaling, in both list and column layouts.
Collapsible surface headers meet the top and both side edges; summary
text has an 8px left inset, while expanded content has its own 16px padding. Review sections use existing elevated surface colors instead of outline
borders, with a lighter nested surface for website examples. The Overlay toolbar
is hidden; source visibility controls remain available. Figma, Storybook and
Website each have a named vertical column containing their preview and their
own source settings. Columns use the page background without a raised surface
or card padding. Settings forms have their own elevated surface with 16px padding.
Source headings place the source icon/link before the title, followed by a
controls wrapper aligned to the left with no gap between its controls.
Each column's shared gear Icon-button reveals its source
settings using the supplied outline gear when closed and filled gear when open.
Visibility controls use the supplied eye and eye-closed artwork. The gear reveals
settings below its preview, initially hidden; Escape closes them and returns
focus to the gear. Captured images and live previews precede source settings
in all three columns.
The Interactive preview disclosure lives in the Storybook column above source
settings and opens by default. Its iframe follows the capture viewport width
and height, with scrolling inside the column for larger viewports. Button keeps
its existing live combinations preview.
The Figma live canvas remains separate from those settings. Live Figma canvas
and Interactive preview share the same full-width
disclosure surface and explicit shared preview-heading style: 56px minimum header
height, 8px left padding, body typography, matching surface and hover colors,
and shared chevron controls. Screenshot capture areas reserve at least 80px. Viewport width and height
changes, disclosure contents, gear settings panels and disclosure chevrons use
the existing 250ms standard motion tokens. Native CSS size interpolation keeps
closing content visible through its collapse; reduced-motion users and browsers
without disclosure interpolation retain immediate native toggles. Their
expanded contents have 16px padding. Interaction targets
are hidden. Columns stack on narrow screens. The combination table,
Table layout, combination slider and website-example picker are temporarily
hidden, retaining their existing workspace data for later use. Preview columns
open side by side while Overlay is hidden. Two mutually exclusive controls at
the start of the detail heading switch between Columns and List. List stacks
the three source panes at the full available comparison width. Source titles share an
80px minimum width so their adjacent controls align in list view. Two 1px solid
dividers separate the sources using the existing outline token: vertical across
the full pane height in columns, horizontal in list view and the mobile stack.
Dividers sit in the existing gaps without adding an outer border or shifting content.
The page, component catalogue, captured images and interactive preview viewport
reuse the Storybook Horizontal Scrollbar atom for both axes: square 8px thumbs,
transparent tracks and the existing divider color. Embedded external pages such
as Figma retain control of their own internal scrollbars.
The comparison layout switch uses the supplied column and rows SVGs in shared
Icon-button atoms. Exactly one button is pressed, with a highlighted background
and icon color. A random anonymous visitor ID and the last layout are stored in
browser localStorage (`jurenites-comparison-preferences`); this browser preference
takes priority over shared component workspace layout and applies across components.
The ID stays in the browser and requires no login. Clearing site data resets it;
when storage is unavailable, the layout remains usable for the current visit.

## Catalogue source indicators

Each component name includes its registered variant count in parentheses.
Button counts its three shared styles × enabled/disabled combinations, so it
shows **Button (6)**; pointer interaction states and website instances do not
multiply that count. Other components count their unique registered Storybook
examples. This is an inventory count, not a count of passing captures.

Rows show the shared Figma, Storybook and Web SVG icons in that order. Their
colors describe source attachments from the effective configuration and saved
draft: green means attached, orange means incomplete settings, and red means
missing. A Figma URL or retained PNG attaches Figma; a registered or configured
story attaches Storybook; website examples need both a URL and selector.
These indicators do not imply that a source has passed its visual tests.
Source/status descriptions remain in hover titles and accessible row labels;
visible status text and the single overall square are removed. Integration and
naming checks remain in the detail panel and overall status filter. Saved
milestone entries retain their own label without invented counts or test states.

## Before / After milestones

The **Before / After** entry button in Testing is hidden; Presentation replaces
it in the current workflow. The existing history tool remains available at its
direct URL. Previously, the button appeared beside the component's
name. The dashboard and player have no global header or manual Refresh button.
Existing selector IDs remain independent of template position. History links are available for Organisms, Pages and composed
Components; atom and molecule details keep their existing review flow.

The link carries the selected target ID, name and scope. The player stays scoped
to that item, provides **Back to details**, and pre-fills its capture identity.
For an uncaptured organism, source URL and root selector remain empty for the
reviewer to supply; another page's captures are never substituted. Saved targets
without a Storybook entry, including Homepage, appear as **Saved milestones**
in their catalogue group and have their own detail view without a test status.
The player remains available at `/history.html`. This view is for pages and
organisms. The atom/molecule appearance checks remain in the component review.
Choose the same target, scope, root selector and viewport for both versions;
**Choose versions** selects the exact two captures, with environment, name and
capture time. The pair is preserved in the page URL; unavailable saved IDs do
not silently switch to newer captures. The initial
Homepage pair is a real anonymous production capture and local development
capture at 1280 × 900, captured on 2026-10-13.

The project Button atom contains one replacing **Before** / **After** word and
a monospaced version. It moves between endpoints without an underline. Dates,
numbers, measurements and version evidence throughout Testing use the existing
number font. **Play** pauses/resumes, the slider scrubs either direction, and speed ranges from ¼× to
2×. Reduced motion snaps playback to its endpoint while keeping manual scrubbing
available. **Fullscreen** leaves the controls and Git console around the
native-size canvas; Escape exits.

The default workspace shows the selected pair, playback controls and canvas.
**Details**, **Choose versions** and **Keep a milestone** open focused dialogs;
there is no permanently expanded capture form or inventory of version cards.
The Git console follows the currently displayed side.
The regular screenshot view is 1 CSS pixel per
captured pixel, with scrolling for large pages. Browser zoom must remain 100%.

Captures are presentation evidence, not a live interactive historical website
or a new pass/fail test. Endpoints display the untouched original screenshots.
Intermediate frames use measured layer geometry and raster patches, with
background crossfades. Text can differ, such as “Button” and “Contact me,” without
creating a test failure. Live hover/focus/state checks remain in the existing
component comparison workflow. A raster transition can stretch type/artwork;
reflow, shadows outside an element's measured bounds, dynamic media and unmapped
regions are not reconstructed as a historical DOM animation.

### Logical layers and reasoning

The capture form accepts explicit stable layer IDs with selectors, labels and
depth. Selectors are relative to the root and must find one visible element.
Keep an ID when an element changes position or selector; use a new ID for a
conceptual replacement. Matched disjoint leaves move and resize; replacements
fade. Missing, hidden or ambiguous selectors produce visible warnings. Nested
parents and overlapping regions remain available as blueprint shapes but do
not produce duplicate moving image patches. Patches omit unchanged background
pixels. Full-page backgrounds crossfade beneath those patches.

**Blueprint** presents those same semantic layers at an isometric angle in
grayscale, using their captured bounds and corner radius. Hover or focus a
border, or select its entry in **Reasons**, to read measured movement,
size/shape changes and the authored reason. These are reviewer-defined semantic
layers, distinct from Chrome's compositor layers described in the
[DevTools Layers panel](https://developer.chrome.com/docs/devtools/layers).
The paused animation timeline uses the
[Web Animations currentTime API](https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime).

**Reasons** enables selectable outlines over the saved page and a compact
element list. Click an outline or a blueprint shape to edit the reason directly
beside the canvas. Reasons belong to the exact selected Before → After pair
and layer ID, stored as `comparison_notes[before_id][layer_id]` on the After
milestone. Different baselines retain separate explanations, including explicit
clears. Legacy per-layer reasons remain the fallback when no pair-specific value
exists. **Save reason** does not save unrelated milestone-form drafts.

**Details** edits either selected milestone: its name, **what**, and **why**.
Saving updates a separate revisioned notes
file. Stale writes fail instead of replacing a newer explanation. Switching
versions retains unsaved drafts for the current browser session; leaving the
page warns about them. The tool does not infer design intent from a commit.

### Live screens and sequences

The current milestone player uses saved captures. A future multi-screen demo
can sequence explicit screen pairs; each live side needs its own pinned build
URL to represent a historical version. Reusing a changing development URL does
not preserve the older UI. No live version hosting or sequence builder is
implemented in this iteration.

An iframe can keep its real page interactive, and its outer frame can crossfade
as a whole. Element-to-element movement across separate documents requires
cooperating pages exposing stable element identities and geometry, or a snapshot
overlay during the transition followed by handover to the live page. Cross-origin
DOM access is restricted by the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy);
embedding also depends on the source site's framing policy. The existing
component-review live previews remain available independently.

### Retention and Git identity

`visual-history/<milestone-id>/` holds immutable `capture.json`, original
`full.png`, a `base.png` and moving layer images, plus editable `notes.json`.
Keep this directory with the reviewed project changes (or archive it alongside
a release artifact); it is not a disposable cache. Capture production milestones
when a meaningful release is deployed and development milestones when a design
is ready for review. This is an explicit capture action, not an automatic
production deployment hook. There is no pruning or retention timer.

Persistent worktrees are unnecessary for presentation. Use a temporary worktree
only when rebuilding an old commit; a Git checkout alone does not preserve the
Drupal database, content, media or browser rendering. Captured images preserve
what was actually shown even while `develop` moves forward. Historical live-site
reconstruction would additionally require archived builds and content/media.

Metadata records observed watermark version/commit link, release-file version,
source URL, capture time, environment selected by the reviewer, viewport,
browser version, locale, timezone, device scale, screenshot SHA-256, and measured
layers. For local sources it also records checkout branch/commit and whether
tracked working changes existed. The local checkout can differ from the served
build; the UI states this explicitly. A remote branch stays **unrecorded** when
not exposed, and capture time is not represented as deployment time.

The first pair rendered production **1.195.2** / `1902566` and local **1.200.0** /
`ad2da0c` on `develop`. The local release file was **1.202.0** at capture time;
that discrepancy is retained and displayed, not overwritten with a guessed
version. The measured navigation moved up and widened; the hero and subsequent
content moved up 48px. Design rationale remains unrecorded until authored.

History writes share Testing's same-origin/token check and serialized capture
lock. A failed capture removes its temporary output and never publishes a
partial milestone. `npm run test:component-status` includes milestone validation,
identity/motion and notes revision tests. `npm run test:component-history` runs
real browser captures against controlled movement/replacement fixtures, then
checks scrub/reverse/pause/speed, reduced motion, 1× endpoints, blueprint shapes
and keyboard annotations, inline pair-specific reasons and clears, exact pair
URLs, shared buttons, numeric typography, persisted notes, fullscreen and mobile
layout.
`npm run test:component-status-layout` verifies the rearranged template hooks,
scoped navigation, empty targets, saved page entries, refresh, filters and mobile
layout.

Comparison evidence displays property corrections as current → target. The current
implementation value uses the shared Inline Code atom with an error background;
the expected reference value uses a success background. Accessible labels identify
current and target values independently of color.

## Using the Comparison Form

### Figma reference inventory

The stored reference inventory records the user's
[Components v2 manual page](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1730-1342),
inspected on 2026-10-11. It is retained as capture metadata, without a separate
dashboard section. The exact component reference URL selects the design version
to compare. The 13 families are Avatar, Badge, Chip, Tooltip,
Code, Button-icon, Paginator, Checkox, Button-text, Two-tone Heading,
Version Watermark, date-time-value, and Link. Original Figma names and variant
spelling are preserved. Footer menu and Footer copyright are recorded separately
as composed components that happen to sit in the Atoms frame.

Eleven families have representative Storybook mappings. Code maps to Inline Code,
Button-text to Button, Checkox to Checkbox, and Paginator to the Square Pagination
molecule. Button-icon is represented by `Atoms/Icon-button`; Link still lacks a standalone
story and remains an explicit gap.
Storybook atoms without a definition in this manual frame remain unmapped; they
are not silently linked to the older AI page.

`config/component-status.json` stores the inventory, component/variant Figma
links, precise Storybook URLs and selectors, source paths, and coverage notes.
`tests/visual-baselines/manual-atoms/manifest.json` records native 1× PNG exports,
node IDs, dimensions, and content hashes. `figma-inventory.json` preserves the
read-only source inspection. These are pinned references, not an automatic sync.
The Chip and Version Watermark **Manual Reference** stories match the selected
Figma copy while retaining the original default stories.

### Appearance, content and interaction coverage

The main comparison, source mappings, differences, and recorded checks are visible.
Only advanced settings, live previews and technical evidence use disclosures;
their chevrons come from the project's Icon atom. Catalogue groups start expanded
and use shared ghost Button and chevron Icon atoms to collapse each heading's list.
The same controls work in Storybook, including Enter/Space and `aria-expanded`.
Collapsed groups survive catalogue refreshes during the session; search reveals
matching groups. Each group can be expanded or collapsed individually.
The three capture panes remain side by side on desktop and stack on mobile, with
native-size scrolling rather than image scaling. Use browser zoom 100% for one
image pixel per CSS pixel.

Manual atom cases default to **Appearance · allow different copy**. For example,
Figma “Button Submit”, Storybook “Button”, and Drupal “Contact me” may differ in
text and intrinsic width without failing. The real images and labels are retained.
Computed surface styling, minimum dimensions, gaps, alignment and typography
are compared; clipping still fails.
Consecutive identical text styles are grouped so harmless text-node splitting
does not count as a copy regression. This is measured-property coverage, not a
claim that all pixels, artwork, layout, or behavior match. Media content and
content-driven dimensions remain available for human inspection.

`appearance.json` pins read-only Figma measurements inspected on 2026-10-13.
Figma checks compare the available explicit properties, such as solid fill,
square corners, font family, size, weight and explicit line height. Auto-layout
padding is not assumed equivalent to CSS padding. Those measurements are trusted
only when the selected node URL and PNG bytes match the configured reference.
A custom PNG upload supports pixel review but has no inferred appearance metadata.

The read-only route inspection covered Home, About, Contact, Blog, Portfolio,
and Cookbook. The configured examples include three primary buttons (Contact me,
Contact and Order), homepage and portfolio chips, article avatars and reading
durations, footer badge and watermark, Cookbook inline code, the About heading
and tooltip, and homepage pagination. Selectors identify one actual DOM region;
structural selectors may need refreshing after CMS layout changes. No public
checkbox instance was found on those routes. That gap remains not checked.

Cases can save up to eight website examples and capture Default, Hover, Keyboard
focus, Pressed, and Checked. Each example/state keeps separate images and results.
Playwright applies native pseudo-states, checks that the state was reached, and
checks visible hover/focus feedback. Pressed captures release outside the control
without activating links or submitting forms. Checked is limited to native
checkboxes/radios. Unsupported states are blocked. These checks do not establish
complete keyboard navigation, click behavior, accessibility, or disabled-state
coverage. Component crops may exclude outer shadows/outlines; their measured
styles still contribute to feedback detection.

Figma states have explicit node mappings. Chip Hover has its own native PNG and
measurements; an unavailable Figma hover/focus/pressed reference is reported as
missing, never replaced with the default image. Website and Storybook state
checks remain usable independently. Missing Figma coverage keeps overall status
incomplete. Remove all website examples for a Storybook-only run.

On the first capture, a configured `figma_reference_path` is imported into local
saved references if its Figma URL matches the selected case. Subsequent runs
preserve saved uploads and explicit removals. Changing the Figma URL drops the
previous node's baseline. Run any mapped case with the existing command, for
example `npm run status:test -- atoms-tooltip`.

### Capture settings

Open a component in `http://test.jurenites.local/` (or `http://127.0.0.1:7779/`).
The visible **Linked sources** form accepts website examples (URLs or paths
relative to `http://jurenites.local` with unique component selectors), a local
Storybook iframe URL including args, a Storybook selector, and a viewport.
Settings save automatically. Completing a valid capture-setting edit runs
Playwright after a one-second pause, using fresh anonymous browser contexts.
Merely opening the dashboard does not start tests; no submit button is needed.

Viewport width uses the shared Select Input control, including its 40px trigger,
40px chevron area and keyboard-operated options; form values stay numeric.
Figma PNG selection uses the shared File Input: a 40px secondary Choose file
button and a 40px drop area. Both selection methods populate `figma_png`; files
are sent only when Capture and compare is submitted.
The content-matching confirmation and optional saved-reference removal use the
shared Checkbox renderer: a 24px active square inside a non-interactive wrapper,
40px tall with zero start padding beside a clickable label. Their form names
remain `inputs_matched` and `remove_baseline`; the saved confirmation sets the
initial checked state.

The website loads as a complete page. The runner scrolls to and captures the
selected element in place, preserving applied CSS, inherited rules, layout
constraints, and any visible overlays. It does not copy the element into an
isolated document. Fonts, images, progressive-image loading, and Font Preview
readiness settle before capture. Selectors must match exactly one region.
Cookie notices and other overlays remain visible; align that state before
claiming parity. Interactions performed in a separate browser tab do not carry
into the fresh capture session.

The comparison leads with **Figma → Storybook → Website**, each at native size.
Screenshot previews are non-clickable image containers; the separate source links
open the original Figma, Storybook, or website location.
Desktop captures use three equal panes; mobile captures stack in that order. A 1920px capture remains 1920 CSS pixels wide, scrolling
inside its pane when necessary. Layout recalculates after image loads, state
changes and container resizing. The main preview toolbar has independently
toggleable **Figma**, **Storybook**, and **Website** buttons and an **Overlay**
mode. Overlay aligns the active captures at their top-left corner without
resizing: three sources use one-third opacity each, two use 50%, and one uses
100%. Additive blending gives each layer equal weight. Missing or broken captures
are disabled and excluded from the opacity count; disabling every source shows
an empty-state message. Side-by-side mode retains full opacity. The separate
Visual inspection section, wipe, balance slider, and pixel-difference viewer
have been removed; automated comparison results remain unchanged. Live Storybook HTML and source links are available below the
images. The current viewer opens Drupal in a separate tab. DEV Drupal sends
`X-Frame-Options: SAMEORIGIN`; `jurenites.local` and `test.jurenites.local` are
different origins even though both are under our control. This is a configurable
framing restriction, not a general prohibition on embedding our own sites.
An explicit response policy such as `Content-Security-Policy: frame-ancestors
'self' http://test.jurenites.local` can permit the testing origin while excluding
unrelated sites. This policy change has not been applied. CORS is not the switch
for iframe display; cross-origin DOM access is a separate restriction. See
[frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors).

Figma supports an interactive design iframe targeting `node-id`. The existing
Live Figma reference uses that embed, with zoom controls, footer and fullscreen
enabled. A small frame can appear magnified in the viewer; its zoom is independent
of the pinned 1× PNG. Figma's design embed documentation provides pan/zoom controls
but does not specify a fixed 100% initial zoom parameter. See
[Figma file embeds](https://developers.figma.com/docs/embeds/embed-figma-file/).

In **Exact pixels** mode, matching inputs must be explicitly checked before a
comparison can pass. Otherwise it produces exploratory differences marked **blocked**, while
independent rendering checks can pass. A missing Figma reference is **missing**,
not a failed implementation test. Overall coverage still requires all requested checks; inspect the website/Storybook result independently when working
from code. Unmapped components remain not checked until configured and captured.

For **Organisms / Font Preview / 4pixel**, the current English DEV mapping is
`/portfolio/my-first-font` with `.font-preview--4pixel` on both surfaces.
`/portfolio/4pixel` is its translated alias, not the English route. Verify the
current route, available width, content, and overlay state before comparing;
these belong to the case inputs and are not automatically corrected by the tool.

### Optional Figma Reference and Code-First Work

A Figma reference may be any matching frame, not necessarily a reusable Figma
Component. Select the frame, export PNG at 1×, and choose it in the form. Keep
its content, state, background, and bounds consistent with the captured region.
Optionally record its Figma URL too. The uploaded PNG is content-hashed and
saved locally; both implementation captures are compared against it. A linked
frame without a PNG is still a missing pixel reference. Export guidance:
[Figma static exports](https://help.figma.com/hc/en-us/articles/360040028114-Export-static-designs-from-Figma).

When work begins in code: compare Storybook and the actual website first, review
which behavior and appearance are intended, then create/update the corresponding
Figma frame/components using the shared tokens. Review that Figma result and
export/link its reference. A missing Figma design must never be fabricated or
silently replaced by an implementation screenshot labelled as a design baseline.
Automatic frame export/sync is a later integration; manual PNG upload works now.

Mappings are saved under `.cache/component-status/review-cases.json`; reports
use `report-review-<component-id>.json`, with captures/content evidence under
`artifacts/review-…/` and uploaded references under `artifacts/baselines/`.
All are local and ignored by Git. These reports describe live inputs, not pinned
Drupal revisions. Changing source still requires `npm run status:build` before
another trusted capture. The capture endpoint requires a same-origin JSON
request with the current server token and runs one comparison at a time.

Run a saved case from the terminal with:

```bash
npm run status:test -- organisms-font-preview-4pixel
```

The original default Article Blog List Item CLI case retains its special
content-mirroring loader. Generic cases use the explicit Storybook URL/args;
they do not automatically convert arbitrary Drupal content into story inputs.

## Iframe Review Surface

The proposed review page has three labeled panes: **Figma**, **Storybook**, and
**Drupal with real data**. Each pane has a descriptive iframe title and a direct
link to the source. Select a case, viewport, content language, and component
state to load the matching references. Keep the case's CSS viewport size fixed;
three narrow panes must not accidentally turn a desktop case into mobile
layouts. Allow scrolling or opening a pane separately for large frames.

Use a Figma file embed targeting the mapped node. Figma documents `embed-host`
and `node-id` for this purpose in [Embed a Figma file](https://developers.figma.com/docs/embeds/embed-figma-file/).
Load isolated Storybook `iframe.html?id=…&viewMode=story` URLs, and the mapped
Drupal route or section. Frame sizing belongs in SCSS and tokens, following the
project DOM styling rules.

Confirm embedding works in the intended review environment before claiming it
is available. Figma access, Drupal frame restrictions, origin boundaries, and
browser mixed-content rules may prevent a pane from loading. A blocked pane
must show a direct link and its blocked status. Do not relax production frame
policy just to make a local review page work. Keep any needed embedding changes
scoped to the review environment.

The iframe surface is for interactive review. Its surrounding viewer controls,
zoom, and authentication screens are excluded from pixel baselines. A parent
page must not depend on direct DOM access across origins or promise synchronized
interaction across the three systems. Automated captures open implementation
URLs directly and reproduce the case's state independently.

### Manual Comparison Mode and Remaining Live-Frame Work

The local case form implements captured-image review. The full live-frame surface
and persisted reviewer decisions remain planned:

- Select expected design, Storybook, or actual website as either comparison
  layer. Keep a third pane available for context and source links.
- Where embedding is permitted, stack the matching Storybook and Drupal iframes
  at the same viewport and scroll position. Offer layer toggling for inspection;
  cross-origin interaction still requires independent setup in each frame.
- For precise review, overlay the exported design and captured implementation
  images at their recorded bounds. Offer a wipe slider, blink toggle, and a
  highlighted pixel-difference view at 1:1 zoom. Any reviewer zoom must affect
  both layers equally and leave the underlying comparison unchanged.
- Keep comparison controls in the review tool. Use image/canvas composition for
  adjustable blending without weakening the site's static-opacity contract or
  adding presentation attributes to production components.
- Record the reviewer's outcome and notes against the capture identity. A
  manual acceptance must remain distinguishable from an automated pixel pass.

Current Drupal frame restrictions make screenshot overlays the initial route
for its comparison layer. Figma's viewer chrome must never become part of the
expected image. A blocked iframe can fall back to saved images and direct links.

### Automatic Comparison Mode

Reuse the installed [pixelmatch](https://github.com/mapbox/pixelmatch) library
with `pngjs` for image decoding and Playwright for browser captures. The existing
`scripts/component-status/images.mjs` already produces a difference image for
equal-sized Storybook/Drupal PNGs, using `threshold: 0` and `includeAA: true`.
The generic review runner now uses that path for all three comparison pairs
when a PNG is uploaded. Approved browser regression baselines remain future work;
a second image comparison library is not needed initially.

For every pair, save expected, actual, and difference images, image dimensions,
different-pixel count and ratio, comparator settings, and capture metadata.
Geometry mismatches fail before comparison. Missing references remain blocked
or not checked. Keep automatic results and manual review decisions visible
together, and require explicit review before changing a baseline.

## Pixel Comparison Contract

Export the mapped Figma node as a PNG baseline, recording its file version,
node ID, export scale, and image hash. The [Figma image endpoint](https://developers.figma.com/docs/rest-api/file-endpoints/#get-images-endpoint)
provides node renders; persist the artifact and its identity rather than relying
on a live embed or a temporary image URL as the baseline.

Capture Storybook and Drupal with the same browser version, operating system,
CSS viewport, device scale, color scheme, locale, and state. Wait for fonts,
images, and the component's ready condition. Fix the test clock where dates or
relative times affect the chosen region. Settle transitions for appearance
captures; test motion and interaction separately.

Compare equal-sized images without stretching or automatic resizing. A size
mismatch is a failed geometry check. Crop only to the agreed component or
section bounds, including intentional shadows. Record the bounds in the case.

Pixel-perfect layout is the goal. Start with exact comparison for deterministic
regions, then document narrowly justified per-case tolerances for rasterization
noise. Do not introduce a universal percentage that silently accepts layout
errors. [Playwright's visual comparison documentation](https://playwright.dev/docs/test-snapshots)
explains why browser and platform differences affect screenshots; Figma exports
and browser text rendering also require review of the observed differences.

Keep two distinct kinds of baseline: the Figma reference checks design parity;
an approved browser screenshot checks regressions within a fixed environment.
A browser regression pass alone does not prove Figma parity. Do not replace
baselines automatically after a mismatch; review whether the design or code
should change and retain the decision with the new reference.

## Real Data and Repeatability

Use selected actual Drupal content on DEV, including its real text, media,
Paragraph structure, language, and formatter output. Record entity UUIDs,
revision IDs, and media identities for each case. Use a stable DEV content
snapshot or pinned test revisions so an unrelated edit cannot move the baseline.
Do not make the test depend on mutable production content.

Derive Storybook fixture values from that selected content and put the same text
and media into the Figma reference. Maintain the existing Storybook convention:
visible demo constants near the top of the story, passed through its args, with
shared markup helpers for nested components. The application still renders its
real Drupal entities; the comparison fixture supplies the matching design and
Storybook inputs.

Keep an additional exploratory review against current live DEV data to find
long titles, optional fields, missing media, translated copy, and dense content.
Label it as live review when its inputs differ from the repeatable case.

Mask only an explicitly documented, unavoidable dynamic region outside the
behavior being tested. Do not mask real content, failed images, typography, or
layout to obtain a green result. Test loading and error states as separate cases.

## Case Mapping and Evidence

A future case definition needs:

- A meaningful case name and the expectation being checked.
- Figma file, node, version, and exported baseline identity.
- Storybook story ID and exact args or fixture identity.
- Drupal route, semantic component selector, content UUIDs/revisions, and language.
- Viewport width and height, device scale, theme, user role, and state setup.
- Capture bounds, readiness conditions, and any documented masks or tolerances.
- Source commit, generated build identity, browser environment, and capture time.

Start at the existing 360px, 1280px, and 1920px inspection widths where matching
Figma references exist. Add discovered regression widths and relevant token
breakpoints. A design without a matching breakpoint reference is **not checked**
for Figma parity at that width, even when browser layout checks pass there.

The proposed report includes the three source links, baseline and actual
screenshots, an overlay or difference image, mismatch counts, and the full case
identity. Report **passed**, **failed**, **not checked**, or **blocked**, with the
reason. Missing references, unavailable content, denied Figma access, or an
unavailable environment can never become a passing comparison.

Visual evidence accompanies functional and accessibility checks. Screenshots
cannot establish keyboard behavior, permission enforcement, successful content
saving, or correct links. Existing browser-error, blank-render, overflow, and
token checks remain useful and separate. Add focused coverage for actual overlap
bugs; intentional nesting is not a failure just because rectangles intersect.

## Dashboard hosting

### Official language-picker case

The first three-state Figma-backed case is the language picker inside
**Organisms / Top Nav Menu Site Header**. Open
`http://127.0.0.1:7779/#organisms-top-nav-menu-site-header` and select
**Run language-picker tests**, or run:

```bash
npm run status:build
npm run status:test -- organisms-top-nav-menu-site-header
```

`config/component-status.json` selects the real Drupal homepage and the complete
Storybook header story. The comparison region is `.site-header__language`, not
the hidden `.select-input__native.site-header__language-select`. Both sources
retain their page CSS and surrounding header. The runner uses native mouse and
keyboard actions without changing component markup or styling.

Pinned, unmodified 1× PNG exports and their SHA-256 provenance are stored in
`tests/visual-baselines/language-picker/`. The Figma file is
`UMshUcV87SZqsg1aDaDpnZ`:

| State | Figma node | Expected crop |
| --- | --- | --- |
| Default, Eng selected | `1394:1424` | 80 × 40 |
| Pointer over suffix icon | `1401:4526` | 80 × 40 |
| Expanded, Eng option active/hovered | `1394:1444` | 80 × 130 |

Each state runs at 1280 × 900 and 360 × 900, Chromium at device scale 1,
English locale, UTC, dark scheme, and reduced motion. The expanded crop includes
the union of the picker and absolutely positioned menu, including their gap.
Images are never resized for comparison. A changed baseline hash blocks the run;
approve a new design export explicitly before updating the PNG and manifest.
Baselines participate in source fingerprints and are not replaced automatically.

The report records dimensions, text and option values, computed styles, browser
errors, platform/browser versions, source identity, and exact pixel differences.
Rendering checks also cover header containment, navigation/brand overlap, page
overflow, expanded state, and Escape / ArrowDown / End / focus restoration.
Full-header screenshots provide context; these checks do not assert full-header
visual parity. Drupal content outside the picker remains live.

The dashboard's **Recorded state** selector switches the Figma, Storybook, and
website images together, including the main preview’s source toggles and 1:1 overlay mode.
`report-language-picker.json` and captures live in `.cache/component-status`.
Missing captures stay blocked, and exact raster differences remain failed even
when they may include font antialiasing. The CLI returns 1 for failed checks and
2 for blocked checks, so this same command can be used as a pipeline gate once
the required Drupal environment and built Storybook are available.

With the dashboard running, its end-to-end interaction check is:

```bash
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/language-picker.browser.mjs
```

This exercises the capture button, six state/viewport choices, three-image
previews, Figma pixel differences, overlay, and mobile dashboard overflow. It
requires all captures to complete but deliberately does not require design parity
to pass: a functioning dashboard must display failing comparisons correctly.

Inspect the latest report for actual geometry and pixel differences. A passing
render or matching capture size does not establish a passing Figma comparison.
Do not mask contextual shadows or adjust source styles inside a test to obtain
a pass.

### Serving the dashboard

`npm run status:serve` starts a custom Node.js `node:http` server in
`scripts/component-status/server.mjs`, bound to `127.0.0.1:7779`. It serves the
built dashboard and Storybook files, saved reports, and the Playwright capture
API. This is a separate process from Drupal and the Storybook development server.

The Docker Nginx configuration includes `test.jurenites.local`, proxying to
`host.docker.internal:7779` on Docker Desktop. The Node service remains on the
host with its installed Chromium. To activate the route:

1. Add `test.jurenites.local` to the `127.0.0.1` entry in the Mac's `/etc/hosts`.
2. Build with `npm run status:build` and start/restart `npm run status:serve`.
3. Run `docker compose exec local_proxy nginx -t`, then
   `docker compose exec local_proxy nginx -s reload`.
4. Verify `curl -I http://test.jurenites.local/` and open the dashboard. Confirm
   that `/api/status` loads and a component capture completes through this URL.

The server accepts this exact local hostname and the existing loopback URLs.
Capture POSTs must match the request's origin and include the current review
token. Captures still fetch the bundled Storybook through internal loopback.
An alternate `COMPONENT_STATUS_PORT` also requires changing the Nginx upstream.
Both Docker's local proxy and the host's `npm run status:serve` process must
remain running. Recheck host resolution and `/api/status` after restarting them;
checked-in proxy configuration does not establish current service availability.

### Public static dashboard

`npm run status:export` builds Storybook and the dashboard locally, then writes
`generated/status-public/`. This is the deployment target for
`http://test.jurenites.com` on the existing shared hosting plan. It needs no Node
process, PHP API, database or Chromium installation on the server.

The exporter combines the current case mappings, saved workspace drafts and
recorded checks. It copies referenced PNGs, including uploaded Figma and
Storybook references, plus fonts and UI assets. Only an explicit public data
schema is serialized to `status.json`: review tokens, raw workspace files,
pipeline logs and filesystem diagnostics are excluded. Artifact paths must stay
inside the report directory, including after resolving symlinks; missing
references stop the export. Local Storybook URLs become
`http://storybook.jurenites.com/` links, preserving story IDs and args; local
website links become `https://jurenites.com/`. Figma node links and embeds remain
available subject to the Figma file's existing permissions.

Public builds use a separate read-only controller. Search, status filters,
column/list layout, image visibility and preview disclosures work. The public
page never connects workspace-save, upload, delete or capture handlers. Settings
and mutation controls are disabled and described as “Disabled for public use”.
Published workspace values cannot be replaced by a visitor's local draft.
The initial catalogue request runs even when Chrome restores the tab in the
background; only subsequent automatic refreshes pause while the tab is hidden.
Public JavaScript and CSS URLs include content hashes so shared-hosting static
caches cannot keep an older bundle after publication.
Layout preference may still be stored in the visitor's browser. The export does
not include history editing or any API endpoint. Its Apache configuration
rejects non-GET/HEAD requests and directory listings.

Update captures and links in DEV, export again, and upload the complete output
with a backup of the prior public directory. Publish the matching static
Storybook build when story IDs or source components changed. The live DEV
`status:serve` behavior remains available for editing and capturing. See the
[deployment guide](../deploy/component-status/README.md) for deployment and
rollback. The older interactive Node/systemd templates are retained only for a
future host that can support them; they are not the shared-host deployment.

## Implemented Local Component Status

The dashboard uses the supplied `test_logo_16.svg` artwork as its SVG favicon,
stored in `src/status-dashboard/favicon.svg` and copied by the dashboard build.

Start with:

```bash
npm run playwright:install  # first setup only
npm run status:build        # rebuild Storybook, stamp source identity, build dashboard
npm run status:serve        # http://127.0.0.1:7779
npm run status:test         # first case: Article Blog List Item
npm run status:diagnose     # populate local report/image, docs, and version checks
```

The dashboard discovers components from the built Storybook `index.json`, groups
story variants, and excludes documentation-only entries and the entire
`Foundations` hierarchy. Foundations remain available in Storybook. Its searchable list
follows the Storybook title hierarchy in expandable folders, including nested
groups such as `Molecules/Blog`. Component rows place the name on the left and
the status label and indicator on the right. Filtering retains the matching
components' ancestor folders; documentation-only pages are not testable rows.
The desktop catalogue sits alongside the selected comparison, with a visible
filtered/total count. Clear the search field and select **All** in the status
filter to restore the full catalogue; there is no separate **Show all** button.
The Molecules group has no extra list padding, so its Blog heading aligns with
the parent heading; component rows within Blog retain their own indentation.
The component count is derived from the current built Storybook index. This is
the eligible Storybook inventory,
not automatic discovery of every Figma frame or Drupal region. All three source
panes remain present even when a design reference or website mapping is missing.
A linked Figma frame without its PNG is identified separately from a missing link.
The header component's current test is explicitly **Language picker**, with three
states at two viewports; it does not certify the entire header. Overlay controls sit above the main previews; advanced capture settings,
detailed evidence and diagnostics use disclosures so the images
remain the primary review surface. On narrow screens the scrollable catalogue
appears above the comparison.

Responsive layout and catalogue coverage are checked with:

```bash
PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/component-status-layout.browser.mjs
```

This checks real inventory/filtering/missing mappings and intercepted image
fixtures at 80px, 360px and 1920px. Fixtures test the viewer, not component parity.

Comparison PNGs display at their natural dimensions (`width: auto`, no maximum
width scaling), with overflow scrolling. An 80 × 40 image occupies 80 × 40 CSS
pixels. Recorded evidence images also retain their natural size.

Playwright captures the complete page at the configured viewport and device
scale 1, measures the selected region, and crops that region automatically.
The expanded language picker includes the dropdown's bounds. The output PNG
starts at `(0,0)` without relocating or restyling the source element. Shrinking
an iframe to the crop dimensions would instead change the page's responsive
layout; cross-origin frame policies also prevent a generic parent-page crop.
The current automatic runs recapture Storybook and Drupal; Figma exports remain
pinned design references and are refreshed explicitly rather than silently
replacing the expected images during a test.

The searchable list
uses green for complete passing coverage, red for a current failed check, and
gray for unchecked, incomplete, blocked, or stale results. Indicators are square,
matching the Crossfade Dot corner treatment. Green and red indicators have a
matching glow; inactive gray indicators remain unlit. Every name opens check details,
source links, timestamps, source identity, and captured evidence. Color is always
accompanied by text. Results load when the page is opened and refresh every
60 seconds while the document is visible. Switching to a hidden tab pauses its
timer; returning refreshes immediately and restarts the timer. Closing the page
ends polling. This uses browser JavaScript and ordinary HTTP requests, with no
server scheduler, webhooks, or WebSockets. There is no manual Refresh button;
reloading the page also loads the latest saved reports without launching tests.
Automatic refresh preserves unsaved comparison inputs and does not overlap an active
refresh or capture.

The first case is **Article Blog List Item**, configured in
`config/component-status.json`. At 360px and 1280px it selects the Blog list item
for **Reviewing an Interfaces**, node 1 (`/node/1`), using its explicit
`data-article-id="1"` selector on `/blog`. It captures its rendered text and media values and supplies
those values to the existing Storybook story through an optional test loader.
It checks both rendered components, then compares their PNG captures without
resizing. Different dimensions fail before pixel comparison. Equal dimensions
use an exact pixel comparison and produce a difference image. The report records
viewport, browser, locale, article ID/URL, and a content hash; each run saves its
fixture. This first case is a live DEV snapshot, not a pinned Drupal revision.

The selected article stays fixed when the Blog ordering changes; another article
cannot silently become the test fixture. The full `/node/1` page uses a different
view mode, so the component capture continues to use its list-item rendering on
`/blog`. Current dimensions and comparison results are recorded with each run.

The supplied Figma reference is
[Article Blog List Item, node 1186:1660](https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1186-1660).
The default CLI case has an empty `figma_baselines` map in
`config/component-status.json`. Its Figma check remains blocked until a matching
baseline is supplied. The generic dashboard capture path accepts a PNG and
compares all three pairs; the language-picker suite uses pinned exports. A live
embed alone is not proof of parity. Drupal sends `X-Frame-Options: SAMEORIGIN`, so the separate-origin local
dashboard provides Drupal captures and a direct link instead of weakening that
policy to embed it.

The local server binds only to `127.0.0.1`; it is an independent development tool,
not a public Drupal route or a deployment. Generated dashboard files live in
`generated/status-dashboard/`, with local reports, fixtures, and screenshots in
`.cache/component-status/`; both are ignored by Git. The grid also has a shared
Storybook example at `Organisms/Testing Component status dashboard`, whose states are labeled as
demonstration data and do not become real reports.

Each component currently requires Storybook rendering, Drupal rendering,
Storybook/Drupal comparison, and Figma parity before its overall light is green.
Unmapped components remain not checked. A source-fingerprint change or a report
older than 24 hours makes its evidence stale and its light gray. A Storybook
build stamp prevents the runner from certifying an old bundle against new
source. Every successful `npm run build-storybook` writes that stamp. Manual
capture checks the stamp before changing saved mappings or reports; missing,
unreadable, or outdated build information returns an actionable error and keeps
previous captures available. The browser captures use the same environment and real input values;
this does not yet provide pinned content revisions or full accessibility testing.

`status:test` exits 0 only for complete passes, 1 for a failed check, and 2 for
blocked checks. The default CLI case remains incomplete while its Figma baseline is missing;
other failures and blocked states depend on the current capture. The report is saved for the dashboard in each case.

## CI/CD and Troubleshooting Reports

The page has a separate CI/CD & diagnostics section. `status:diagnose` runs the
local report/image tests, docs check, and version check and saves their actual
outputs there. This is local evidence, not a remote CI status. Import a completed
external report with:

```bash
npm run status:import -- /absolute/path/to/report.json
```

Reports use schema version 1 with `source_name`, `checked_at`,
`source_fingerprint`, optional `source_commit`/`source_dirty`/`run_id`, a
`components` array, and optional `pipeline_checks`. Each component record has a
`component_id` from the dashboard API and a `checks` array. Each check contains
`check_key`, `check_label`, `status`, and `message`, with optional JSON `details`
and `artifacts`. Valid states are `passed`, `failed`, `blocked`, `not_checked`, and `missing`.
`missing` identifies an absent design reference; consumers must preserve it as
incomplete coverage rather than a failed implementation or a complete pass.
Required component check keys are `storybook`, `drupal`, `integration`, and `figma`.

Use a distinct source name for each producer; an import replaces that producer's
previous report and preserves its original time and fingerprint. When two
producers report the same component check, the newer result wins. Pipeline checks
retain their producer identity. Local runner reports are owned by the runner.

A CI producer must record the fingerprint of its actual checkout using the
exported `source_fingerprint` function in `scripts/component-status/report.mjs`.
Do not copy a current local fingerprint onto an old result to make it look fresh.
This interface can show external results; no GitHub/GitLab workflow is connected
automatically yet. Imported reports must retain all results the producer wants
to display. Artifact entries use `artifact_label` and an `artifact_path` beneath
`artifacts/`; copy associated files into `.cache/component-status/artifacts/`
separately. The importer does not fetch external assets or execute commands.

The report reader rejects invalid states, duplicate check keys, and unsafe
artifact paths. Invalid reports are reported visibly and excluded. Viewing the page never launches tests or changes CI settings. The explicit
**Capture and compare** action saves a local mapping/reference and starts a
local capture; it does not write website content or change CI settings.

## Remaining Work

- [ ] Add a content-matched Figma baseline to the default Article Blog List Item case.
- [ ] Pin Drupal content revisions and media identities for repeatable baselines.
- [ ] Review and resolve differences shown by current captures without silently
  replacing approved references.
- [x] Integrate native-size overlays and independent source toggles into the main previews.
- [ ] Add permitted live-frame stacking and saved manual review decisions.
- [x] Compare all three pairs when a Figma PNG is supplied.
- [ ] Add approved browser regression baselines.
- [x] Add generic per-component mappings and the real 4pixel page example.
- [ ] Gather screens from Windows: automate Edge captures in the local Parallels
  VM and import their evidence into Testing without AI-driven execution.
- [ ] Connect CI producers, artifact retention, and review before delivery gating.
- [ ] Add focused functional and accessibility coverage alongside visual checks.
- [ ] Compare the repository Cookbook draft with the editor-owned page and its
  translation before publishing a reviewed revision. Documentation edits do not
  establish their current database content or publish it.

## TODO: Windows Virtual Machine and Pipeline Integration

### Gather screens from Windows

Status: planned. Start with the existing local Parallels Windows VM and installed
Microsoft Edge. Extend the JavaScript/Playwright testing tools with a deterministic
runner inside Windows using the `msedge` channel. Routine capture and comparison
must not depend on Codex, computer-use reasoning, or AI token usage.

1. Configure each case's page URL, optional component/section selector, viewport,
   language, content identity, and interaction steps. Use the existing pixel
   comparison contract for readiness, scale, state, and capture bounds.
2. Launch Edge in a fresh test context, open the configured local site, wait for
   fonts and images, and reproduce the specified state. Capture page content,
   excluding browser chrome and the surrounding Parallels desktop.
3. Save the PNGs with case, build/content, Windows, Edge, viewport, and device-scale
   metadata. Preserve capture errors as blocked or failed results.
4. Import the saved evidence into Testing and reuse `pixelmatch` to show the
   reference, actual image, highlighted differences, and differing-pixel count.
   Compare matching Figma PNGs for design parity and separately approved Windows
   Edge screenshots for regressions. Never update references automatically.
5. Expose an ordinary command or Windows shortcut for repeat runs. A Testing
   button or Windows Task Scheduler may invoke the same runner after its launch
   and result-transfer integration is implemented.

Acceptance: rerunning a configured case captures and compares it without an AI
session, and Testing identifies the result as native Windows Edge evidence.
Interactive computer use remains available for diagnosis but is not the runner.

### Later CI integration

Use a GitHub Actions `windows-2022` runner for the first Windows CI job.
[GitHub-hosted Windows runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
are virtual machines; this checks browser rendering on Windows itself. If later
findings need Windows 11 desktop-specific behavior, reproduce them in a Windows
11 VM and record that result separately from Windows Server CI coverage.

Use Playwright with Chromium first, then add installed Edge through its browser
channel. Record the OS image, browser version, fonts, viewport, device scale,
locale, timezone, and rendering settings. Keep Windows browser baselines separate
from macOS/Linux baselines; compare Storybook and Drupal within the same Windows
environment. User-agent emulation or a Linux container does not establish
Windows rendering coverage. See [Playwright CI](https://playwright.dev/docs/ci).

Planned pipeline sequence:

1. Build Storybook and Drupal assets from the candidate commit. The current
   Storybook workflow skips its build on pull requests; enable candidate PR
   builds as part of this integration, without publishing them to production.
2. Provision an isolated Drupal review environment with those exact assets and
   a versioned snapshot of selected real content/media. Make it reachable from
   the Windows runner and verify its release/content identity before captures.
   A separate Linux job's localhost is not reachable from a Windows job; use
   the review environment's URL or an authorized runner on the same network.
3. Download the same Storybook artifact onto Windows and serve it locally.
   Parameterize runner URLs instead of relying on `jurenites.local`. Convert
   POSIX-style environment assignments in npm test commands to portable Node
   setup or workflow `env` entries, then install and launch Windows browsers.
4. Run matched cases at 360px, 1280px, and 1920px where references exist, with
   selected actual Drupal content mirrored in Storybook and the design export.
   Capture every required pair and report any unavailable case explicitly.
5. Upload reports, fixtures, expected/actual/difference images, and browser
   diagnostics even on failures. Retain them for a proposed 30-day review window.
   Import them using the existing report contract with the actual checkout
   fingerprint and environment identity; confirm cross-platform fingerprints
   agree for identical source files.
6. Begin with a manually dispatched evidence-producing job. After repeatable
   runs and approved baselines, run on pull requests and require the selected
   visual checks before deployment. Failed, blocked, or missing required checks
   prevent that gate from passing; baselines are never auto-approved.

Before combining platform reports, extend report aggregation to preserve the
OS/browser dimension: its current newest-result-wins rule for each component
check would otherwise let a newer Linux pass hide a Windows failure. Distinct
producer names alone do not solve that. Overall coverage must require every
selected environment, while showing each environment's evidence separately.

Acceptance for this TODO: a Windows VM run captures both Storybook and the real
Drupal rendering, checks a matched design reference, publishes inspectable
artifacts, and detects an intentional visual change without updating the
baseline. A reviewer can inspect overlays and record a decision. Until that
evidence exists, Windows and full three-way visual coverage remain not checked.

## Existing Tools and Optional Services

Existing `npm run storybook:inspect` remains the broader Storybook health check;
it does not yet write component-status reports. `playwright`, `pngjs`, and
`pixelmatch` are now declared development dependencies. Tests for report
aggregation, stale evidence, input validation, and exact PNG comparison run with
`npm run test:component-status` and `node --test tests/component-appearance.test.mjs`.
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/component-states.integration.mjs`
checks multiple examples, different labels, native states and an intentional style
regression. Browser checks are available as
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/component-status-review.browser.mjs`
(real DEV 4pixel page), and `node tests/component-status-review.integration.mjs`
(temporary identical-render / PNG import fixture).

Chromatic provides an existing [Storybook visual-testing and CI workflow](https://www.chromatic.com/docs/visual/).
It is an option for hosted screenshot review. The local dashboard adds the
project's component catalogue, Drupal evidence, Figma mapping, and diagnostics
view without requiring a hosted service account.

Review source links share the Testing Component status dashboard Storybook renderer,
with theme link styling and the existing Icon atom. External suffixes appear on
hover and keyboard focus, reserving a token-based 4px gap without layout shifts.

### Editable review workspace

The Button table uses `button_style` rows and pointer-state columns, with
`is_disabled` on a depth slider. The active plane stays a semantic table; an
inert adjacent slice uses transparent token colors to show the stack. No
perspective or animated transition changes the readable table geometry.
Technical headers use the machine-readable typography role, with regular weight.
Rows and columns can be hidden, shown or reordered using drag-and-drop or keyboard
accessible move buttons. Click an 8px status square to edit that combination's
inclusion rule. Native disabled + hover is excluded by default, with its rule
provenance shown. Review overrides do not alter the actual Button behavior.

Status labels use one title-case vocabulary and one semantic palette throughout
the dashboard: Passed, Failed, Untested, Stale, Incomplete, and Excluded. Table
cells show only squares with accessible names/tooltips; the legend labels them
once. Passing requires current recorded captures and matching implementation
comparisons for the exact style, disabled flag and pointer state. Rules never
manufacture a pass. Unknown and stale evidence stay separate from exclusions.

Page edits save automatically without a capture submission. Per-component layout,
rule overrides, depth, selected rule, disclosure state, source visibility,
overlay mode, recorded-state selection and capture-setting drafts live in
`.cache/component-status/workspace.json`. A browser-local pending copy protects
edits during disk/network failures and retries on reload. The authenticated
`/api/workspace` endpoint serializes atomic disk writes, validates settings and
never accepts manually supplied test results. A dropped PNG saves as a hashed
reference immediately; capture runs still require the explicit run button.
Empty draft values are retained. Builds do not reset settings; deleting this
local review store removes disk preferences and saved references.

The detail page starts with one PNG per source at native CSS pixel size. Source
icons use the project's Figma and Storybook artwork and the globe SVG. Additional
setup, comparison evidence, source mapping and recorded checks are disclosures
below the comparison. There are no duplicate PNG thumbnails in recorded checks.

Naming convention is a separate check, using the audit described in
[naming conventions](naming-conventions.md). The server reconciles exact public
Storybook titles before attaching findings. Source checks are recomputed while
Figma names come from the explicitly dated evidence snapshot. Mismatches and
missing mappings remain visible, with scoped correction prompts in the evidence.

Run `node --test tests/review-workspace.test.mjs tests/button-combination-coverage.test.mjs`
for persistence/rule checks and
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/review-workspace.browser.mjs`
for an isolated autosave/reload, table-control and responsive-layout check. The
browser test uses its own temporary review store, preserving live user settings.

Overlay screenshot opacity is a compositing weight (one half or one third for
two or three rendered sources), not an interface palette color. The token
contract permits only those existing, specifically scoped dashboard rules.
Hover-only reference removal and matrix drag controls use clipping while idle
and reveal on hover or focus within their parent, preserving keyboard access.
Matrix slice animations use binary opacity endpoints (0 and 1) and retain the
reduced-motion override.

If local Storybook loads its shell but preview dependency requests return 504,
stop the Storybook service, clear only `node_modules/.cache/storybook`, and start
it again. Verify a rendered story, since HTTP 200 for the shell is insufficient.

### Source-aligned comparison layout

The comparison keeps one native-size PNG per source. Source links use accessible
icons rather than repeated names; missing captures stay explicit. Large captures
scroll within their pane, and panes stack on narrow screens. Overlay aligns
available captures at the top left without changing their pixels. Visibility,
recorded example and overlay selections autosave independently of running tests.

Interactive Storybook and Figma views remain optional disclosures. The source
icon links identify the selected reference node; the PNG comparison is the
native-size review surface. Open the external design source for live Figma zoom
and editing.

For Button, the Combination slider and coverage table share the same 24-entry
list: three `button_style` values × boolean `is_disabled` × four review
`pointer_state` values (`default`, `hover`, `focus`, `active`). The pointer states
are capture interactions, not component props or replacements for Figma's visual
reference states. Forbidden combinations remain visible as explicit table rules.
Website example is a separate selector, so multiple website uses do not duplicate
or change the combination list. Missing combinations show no-capture messages.

Table layout assigns any dimension to X columns, Y rows or Z stacked tables.
Choosing an occupied dimension swaps the two axes. Reordering changes slider
traversal order, while selection stays attached to its canonical combination key.
Row and column headers reveal a left-side equals-sign drag button on hover or
keyboard focus, using grab/grabbing cursors without shifting their labels.
Drag real row or column headers to reorder; Alt + arrow keys and the layout
panel's move buttons provide keyboard alternatives. Visibility settings follow
the dimension when axes swap. Selecting a hidden combination reveals its values
so the table and slider can highlight the same selection.

Changing the Z value animates the outgoing table into the rear plane and the
incoming table into the active plane. Rapid scrubbing replaces the transition
with the latest selection. Reduced motion switches slices immediately. Axis roles,
orders, visibility, rules, current combination and website example selection
persist in the existing workspace store; legacy two-column settings migrate to
include keyboard focus and pressed capture interactions.

Table-layout move buttons use the shared `arrow-left` and `arrow-right` SVG artwork.
Source-link tooltips expose the full absolute destination URL on hover and
keyboard focus, and update when the recorded state changes. Escape dismisses
them; URL wrapping is constrained to the viewport on small screens.

Source visibility controls use the shared eye and eye-closed SVGs
to mirror their pressed state; unavailable captures show the disabled closed-eye state.

### Button live Figma canvas

The Live Figma canvas directly embeds auto-layout wrapper `1884:2415` (Frame 32),
containing component set `1394:1177` and the designer's cursor artwork. Its inspected
geometry is 559 × 202. The separate static variants overview is no longer rendered,
and there is one disclosure rather than a nested Live canvas disclosure.
The uploaded comparison PNG remains the pixel-review reference.

The iframe fits the available column width without horizontal scrolling and
reserves space for Figma controls.
Figma manages zoom inside this cross-origin Design embed; its documented parameters
provide pan/zoom controls but do not expose a fixed 100% setting. The interface asks
the viewer to select 100% in the canvas. Iframe dimensions alone do not establish
1:1 artwork scale. Slider changes preserve the wrapper iframe and the user's zoom.
The wrapper remains available for unrecorded combinations, only for the inspected
Button file/node mapping. Unrelated or cleared links do not receive this wrapper.
No Figma layers are modified.

### Source linkage columns

Linked sources appears directly beneath the comparison stage, in the same three
column tracks: Figma URL, PNG upload and reference clear in the first column;
Storybook URL/args, component selector and interaction targets in the second;
Website example fieldsets and add/remove controls in the third. On small screens
both preview and linkage stack in source order. General capture settings stay in
their disclosure. Inputs outside that form use an explicit form association, so
validation, uploads, autosave and capture submission retain the same behavior.

Add website example is a Plus icon button with its visible label immediately
after the button and the same accessible name.

Remove website example is a trash-can icon button with an accessible name,
aligned beside the Page URL or path input in the same row.
Both add and remove controls reuse `Atoms/Icon-button`: square 40 × 40px buttons with centered
24 × 24px icon viewports, leaving 8px on every edge.
Hover and keyboard focus use the existing semantic error color. Removing an
example updates the ordinal labels and moves focus to the next available control.

### Table controls belong to the active plane

Button has one combination slider, inside the active table plane alongside the
website-example selector. The separate depth slider and slice navigation controls
are removed. Scrubbing combinations or selecting a cell switches the required
slice automatically. The Table layout disclosure, coverage legend and selected
cell's rule editor also sit inside that active plane. Only table surfaces animate;
controls keep their DOM nodes, focus and gesture position during slice changes.

Website-example fieldsets expose only Page URL and Component selector. Existing
example names, interaction overrides and reveal selectors remain hidden values
and are preserved by autosave/capture submission. New unnamed examples derive a
report label from the page path and component selector, with an ordinal fallback
for an incomplete draft. An empty interaction override retains automatic control
selection. Hiding these fields does not clear earlier explicit overrides.

### Local Live web preview

Each Website example contains its own always-visible Live web preview beneath
its URL and selector fields, with no collapse control. All configured examples
load automatically and independently. Each iframe loads the real local page and
its existing theme styles/scripts, then the local `jurenites_component_preview` module hides content
outside the selected component while retaining its ancestry and DOM listeners.
The original capture viewport is preserved; the outer preview crop uses 8px-grid
sizes reported by that component. Native hover and keyboard focus remain live.
Links open the real destination separately; form submission is not enabled inside
the preview sandbox. Page-level overlays outside the selected subtree are hidden.

Only explicit preview requests on `jurenites.local` permit framing from
`http://test.jurenites.local`. Normal responses retain SAMEORIGIN; production
hosts do not enable preview mode. Preview responses are private/no-store. Enable
the module locally with Drush and rebuild caches. Editing an example’s URL or
selector reloads only its own preview; changing the capture example selection
leaves these live previews intact. The preview does not run screenshot capture
tests or update comparison evidence.

### Figma PNG controls

The Figma source heading ends with a shared 40px Icon-button X control.
Upload uses the supplied upload-arrow SVG and is visible only without a PNG.
The shared refresh Icon-button is visible only without a PNG and obtains a fresh
image; its tooltip explains the action. With a PNG, only X is shown among the PNG
controls. A missing Figma PNG displays N/A.
The old file chooser block and helper text are removed. Removal immediately clears the displayed reference
and autosaves the removed state; it leaves the Figma link intact. Recorded state
changes and reloads cannot restore a reference marked removed. PNG upload or
Obtain PNG restores the reference. The separate removal checkbox is gone.

Obtain PNG requests a fresh isolated PNG at scale 1 from the exact node in the
Figma reference link, through `/api/figma-reference`. This local server endpoint
uses `FIGMA_ACCESS_TOKEN` with Figma file-content read access; the secret stays
server-side. The Codex chat connector is not accessible from dashboard JavaScript.
Without server credentials, the control explains how to connect export or upload
a PNG obtained through Codex. Export errors preserve the current reference.

### Live Storybook Button combinations

The Button comparison's Storybook column automatically displays the six public
combinations in one vertical native-size canvas: primary enabled/disabled,
secondary enabled/disabled, and text enabled/disabled. It reuses the default
Storybook story and Button markup helper through the `component_preview=button-combinations`
URL mode. Custom label args are preserved. Enabled buttons respond naturally to
hover and keyboard focus; disabled buttons retain native disabled behavior.
There are no additional hover/focus/pressed examples in this canvas. Changing the
recorded combination does not change or reload the six-button canvas. The column's
eye control hides/shows the canvas. Recorded PNG evidence remains available to
comparison logic but is not duplicated visually in this Storybook column.
The canvas includes 8px space for focus outlines and reports its native bounds.
The Storybook iframe itself matches those bounds, rather than keeping a 1280px
capture canvas behind a smaller crop.
Other components keep their existing preview behavior. Single-story URL args and
explicit pseudo-state preview URLs remain available separately.

### Catalogue footer and disclosure controls

Component totals, status counts, report refresh time and filtered-entry count sit
below the component catalogue. Status numbers use existing success, error,
warning and neutral text tokens. Disclosures use the shared 40px Icon-button atom
for their chevron control; both the summary and icon button toggle the section.
The icon button reports its expanded state and supports keyboard activation.

The Button matrix styles its Button atoms explicitly; it must not override the
shared Select trigger border, background, sizing or keyboard feedback.

The catalogue uses three shared selectable Chip atoms: Passed, Attention and
Failed. All selected shows all entries; no selection shows none. Attention includes
unreviewed and incomplete statuses. The search label is visually hidden, and the
chip group retains its accessible name. There is no All statuses chip or dropdown.

## Portfolio article and editable illustration

`/portfolio/visual-testing` introduces the three-source review workflow and its
relationship to CI/CD. Its seven Project story sections distinguish current
local captures and public static evidence from future CI result ingestion.
Authored starter copy lives in `scripts/content/visual-testing.json` and is
seeded once by `scripts/create-visual-testing-project.php`; rerunning the seed
preserves subsequent CMS edits and cleared fields.

The Russian version at `/ru/portfolio/visual-testing` is seeded locally by
`scripts/translate-visual-testing-project.php` from
`scripts/content/visual-testing.ru.json`. It translates the current title, summary,
introduction and all seven existing paragraphs, retaining the inline screenshot
and shared SVG. The seed checks the reviewed source revision, preserves existing
Russian translations, and verifies that English content remains unchanged.

Artwork lives in `src/public/assets/images/projects/visual-testing/`:

- `thumbnail.svg`: outlined production vectors, with three sibling motion groups
  `level_1` (Figma), `level_2` (Storybook), `level_3` (Website), a fixed background
  and the shared pointer-following background highlight.
- `thumbnail-editable.svg`: the same groups with editable Open Sans text for
  Figma. Keep group names and export with **Include id attribute** and
  **Outline text** before replacing the Drupal dynamic thumbnail.
- `hero.png`: a static 1600px rendering for the full article image.

Regenerate the SVG pair with `node scripts/build-visual-testing-artwork.mjs`.
The generator resolves existing palette tokens and outlines repository fonts;
it does not add token inventory. On macOS, regenerate the PNG with
`qlmanage -t -s 1600 -o /tmp src/public/assets/images/projects/visual-testing/thumbnail.svg`
and copy `/tmp/thumbnail.svg.png` to `hero.png`. Regeneration does not overwrite
CMS-managed artwork; replace that file through the Project edit form after review.
