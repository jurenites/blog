# Visual Testing: Local Tools and Remaining Work

Status: the local dashboard now accepts a website URL/path, component selectors,
Storybook URL/args, viewport, and optional Figma PNG for each component. It shows
three visual panes, manual overlays/wipes, and automated image differences.
Figma references can be missing; implementation comparisons remain available.
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

## Using the Comparison Form

Open a component in `http://test.jurenites.local/` (or `http://127.0.0.1:7779/`).
The **Source mapping & capture settings** form
accepts a real website URL (or a path relative to `http://jurenites.local`), a
unique CSS selector for that component on the page, its local Storybook iframe
URL including any `args`, a Storybook selector, and a viewport. **Capture and
compare** saves the mapping locally and runs Playwright from a fresh anonymous
browser context. Merely opening the dashboard does not start tests.

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
Narrow captures appear side by side when their combined widths fit; wide captures
stack in that same order. A 1920px capture remains 1920 CSS pixels wide, scrolling
inside its pane when necessary. Layout recalculates after image loads, state
changes and container resizing. Open **Overlay and differences** to use **Overlay**, **Wipe**,
**Toggle layer**, or **Pixel difference** for a 1:1 comparison without stretching.
Different capture dimensions are reported explicitly; the pixel comparator does
not resize them. Live Storybook HTML and source links are available below the
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

Matching inputs must be explicitly checked in the form before a comparison can
pass. Otherwise it produces exploratory differences marked **blocked**, while
independent rendering checks can pass. A missing Figma reference is **missing**,
not a failed implementation test. Overall complete parity still requires all
four checks; inspect the website/Storybook result independently when working
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
website images together, including the 1:1 overlay, wipe, and difference controls.
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

`test.jurenites.com` is proposed, not deployed. A full interactive installation
needs DNS, HTTPS, a reverse proxy, a supervised Node process, writable private
report storage, and enough resources for Playwright/Chromium. Confirm these
capabilities in ISPmanager first; hosting a static Storybook does not establish
support for this service. Protect the interactive dashboard with authentication:
the review token prevents cross-origin capture requests but does not identify a
user. It is delivered to dashboard readers, who can otherwise trigger captures.
The production hostname is intentionally not enabled in the local server yet.

An alternative is to publish read-only reports at the public subdomain and run
captures locally or in CI. That needs a static report export/read-only viewer;
copying `generated/status-dashboard` alone is insufficient because the current
page calls the Node API. Decide the intended audience before production setup.

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
filtered/total count and **Show all** to clear both filters and expand folders.
The component count is derived from the current built Storybook index. This is
the eligible Storybook inventory,
not automatic discovery of every Figma frame or Drupal region. All three source
panes remain present even when a design reference or website mapping is missing.
A linked Figma frame without its PNG is identified separately from a missing link.
The header component's current test is explicitly **Language picker**, with three
states at two viewports; it does not certify the entire header. Capture settings,
overlay tools, detailed evidence and diagnostics use disclosures so the images
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
server scheduler, webhooks, or WebSockets. **Refresh results** remains available
for an immediate reload of saved reports; it does not launch tests. Automatic
refresh preserves unsaved comparison inputs and does not overlap an active
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
source. The browser captures use the same environment and real input values;
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
- [x] Add captured-image overlays, wipe, layer toggle, and difference controls.
- [ ] Add permitted live-frame stacking and saved manual review decisions.
- [x] Compare all three pairs when a Figma PNG is supplied.
- [ ] Add approved browser regression baselines.
- [x] Add generic per-component mappings and the real 4pixel page example.
- [ ] Run the mapped cases in native Windows browsers on a virtual machine.
- [ ] Connect CI producers, artifact retention, and review before delivery gating.
- [ ] Add focused functional and accessibility coverage alongside visual checks.
- [ ] Compare the repository Cookbook draft with the editor-owned page and its
  translation before publishing a reviewed revision. Documentation edits do not
  establish their current database content or publish it.

## TODO: Windows Virtual Machine and Pipeline Integration

Use a GitHub Actions `windows-2022` runner for the first automated Windows job.
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
`npm run test:component-status`. Browser checks are available as
`PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/component-status-review.browser.mjs`
(real DEV 4pixel page), and `node tests/component-status-review.integration.mjs`
(temporary identical-render / PNG import fixture).

Chromatic provides an existing [Storybook visual-testing and CI workflow](https://www.chromatic.com/docs/visual/).
It is an option for hosted screenshot review. The local dashboard adds the
project's component catalogue, Drupal evidence, Figma mapping, and diagnostics
view without requiring a hosted service account.
