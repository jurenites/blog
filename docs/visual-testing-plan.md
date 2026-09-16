# Visual Testing Layer Plan

Status: the first local component-status dashboard and Storybook/Drupal capture
runner are implemented. Figma pixel baselines, full three-pane review, manual
overlays, Windows VM tests, and automatic CI report ingestion remain TODOs.
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

### TODO: Manual Comparison Mode

Extend the existing local dashboard with a case-level review surface:

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

### TODO: Automatic Comparison Mode

Reuse the installed [pixelmatch](https://github.com/mapbox/pixelmatch) library
with `pngjs` for image decoding and Playwright for browser captures. The existing
`scripts/component-status/images.mjs` already produces a difference image for
equal-sized Storybook/Drupal PNGs, using `threshold: 0` and `includeAA: true`.
Extend that path to the three comparison pairs above and approved browser
regression baselines; a second image comparison library is not needed initially.

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

## Implemented Local Component Status

Start with:

```bash
npm run playwright:install  # first setup only
npm run status:build        # rebuild Storybook, stamp source identity, build dashboard
npm run status:serve        # http://127.0.0.1:7779
npm run status:test         # first case: Article Blog List Item
npm run status:diagnose     # populate local report/image, docs, and version checks
```

The dashboard discovers components from the built Storybook `index.json`, groups
story variants, and excludes documentation-only entries. Its searchable list
uses green for complete passing coverage, red for a current failed check, and
orange for incomplete, blocked, or stale results. Every name opens check details,
source links, timestamps, source identity, and captured evidence. Color is always
accompanied by text. Results refresh every 30 seconds while the page is open.

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
Its export was blocked by the connector's Starter-plan call quota. The dashboard
provides the reference link and an optional live Figma embed, but the Figma check
remains blocked without an exported, content-matched baseline. Figma pixel
comparison is not implemented by the first runner. A live embed is not proof of
parity. Drupal sends `X-Frame-Options: SAMEORIGIN`, so the separate-origin local
dashboard provides Drupal captures and a direct link instead of weakening that
policy to embed it.

The local server binds only to `127.0.0.1`; it is an independent development tool,
not a public Drupal route or a deployment. Generated dashboard files live in
`generated/status-dashboard/`, with local reports, fixtures, and screenshots in
`.cache/component-status/`; both are ignored by Git. The grid also has a shared
Storybook example at `Organisms/Component Status`, whose states are labeled as
demonstration data and do not become real reports.

Each component currently requires Storybook rendering, Drupal rendering,
Storybook/Drupal comparison, and Figma parity before its overall light is green.
Unmapped components remain not checked. A source-fingerprint change or a report
older than 24 hours makes its evidence stale and its light orange. A Storybook
build stamp prevents the runner from certifying an old bundle against new
source. The browser captures use the same environment and real input values;
this does not yet provide pinned content revisions or full accessibility testing.

`status:test` exits 0 only for complete passes, 1 for a failed check, and 2 for
blocked checks. A nonzero result is expected while the first mismatch and Figma
baseline gap remain. The report is saved for the dashboard in each case.

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
and `artifacts`. Valid states are `passed`, `failed`, `blocked`, and `not_checked`.
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
artifact paths. Invalid reports are reported visibly and excluded. The server
is read-only: viewing the page never launches tests or changes CI settings.

## Remaining Work

- [ ] Export and match the specified Figma reference to actual content and states.
- [ ] Pin Drupal content revisions and media identities for repeatable baselines.
- [ ] Resolve the component differences revealed by the first captures.
- [ ] Add manual iframe/image overlays, wipe, blink, and difference controls.
- [ ] Extend automatic comparison to all three pairs and approved browser baselines.
- [ ] Expand mappings beyond Article Blog List Item.
- [ ] Run the mapped cases in native Windows browsers on a virtual machine.
- [ ] Connect CI producers, artifact retention, and review before delivery gating.
- [ ] Add focused functional and accessibility coverage alongside visual checks.
- [ ] Publish the new Testing milestone to the editor-owned Cookbook page and
  its translation in a reviewed content revision; the docs update does not do so.

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
`npm run test:component-status`.

Chromatic provides an existing [Storybook visual-testing and CI workflow](https://www.chromatic.com/docs/visual/).
It is an option for hosted screenshot review. The local dashboard adds the
project's component catalogue, Drupal evidence, Figma mapping, and diagnostics
view without requiring a hosted service account.
