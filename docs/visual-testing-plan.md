# Visual Testing Pipeline Plan

This document captures the planned direction for automated visual testing in
`blog_jurenites`. It is part of the documentation pipeline, but it is still a
plan: the real command set and real scenarios will be implemented and verified
later.

## Purpose

The project needs a repeatable way to compare the design source against the actual frontend implementation.

There are two target comparison lanes:

1. Figma page frames vs rendered Drupal/dev pages.
2. Figma component frames vs rendered Storybook components.

The expected result is a local command that outputs a clear pass/fail report, with screenshots and visual diffs for failed cases.

## Main Goals

- Capture Figma frames as baseline images.
- Capture live website pages from the local DEV environment.
- Capture isolated components from Storybook.
- Compare baseline screenshots against implementation screenshots.
- Detect layout overlap and Z-index fights at many viewport widths.
- Produce a readable report as either:
  - simple terminal output,
  - JSON report,
  - simple HTML report.
- Keep Percy optional, not required for the first local version.

## Suggested Tool Stack

### Required for Local MVP

- Playwright — browser automation and screenshots.
- Figma API — export Figma frames as PNG baselines.
- pixelmatch — local PNG pixel-diff comparison.
- pngjs or sharp — PNG reading/writing and image preparation.
- Node.js `.mjs` scripts — simple local automation.

### Optional Later

- Percy — cloud visual review and CI regression dashboard.
- GitHub Actions — run selected visual tests on pull requests.
- Storybook test runner — deeper integration with Storybook stories.

## Proposed Directory Shape

```text
scripts/
  visual/
    figma-export.mjs
    capture-pages.mjs
    capture-storybook.mjs
    inspect-overlaps.mjs
    compare.mjs
    report.mjs

visual.config.json

baselines/
  figma/
    pages/
    components/

captures/
  web/
  storybook/

reports/
  visual/
    index.html
    report.json
    diffs/
```

## Proposed Commands

```json
{
  "scripts": {
    "visual:figma": "node scripts/visual/figma-export.mjs",
    "visual:web": "node scripts/visual/capture-pages.mjs",
    "visual:storybook": "node scripts/visual/capture-storybook.mjs",
    "visual:overlap": "node scripts/visual/inspect-overlaps.mjs",
    "visual:compare": "node scripts/visual/compare.mjs",
    "visual:report": "node scripts/visual/report.mjs",
    "visual:test": "npm run visual:figma && npm run visual:web && npm run visual:storybook && npm run visual:overlap && npm run visual:compare && npm run visual:report"
  }
}
```

## Configuration Concept

Create `visual.config.json` as the routing map between Figma and implementation.

Example shape:

```json
{
  "viewports": [1920, 1680, 1440, 1366, 1280, 1024, 768, 414, 390, 375, 360],
  "pages": [
    {
      "name": "login",
      "implementationUrl": "http://127.0.0.1:8081/user/login",
      "figmaFrameId": "TODO"
    }
  ],
  "components": [
    {
      "name": "button-primary",
      "storybookUrl": "http://127.0.0.1:6006/iframe.html?id=TODO",
      "figmaFrameId": "TODO"
    }
  ],
  "thresholds": {
    "maxDiffRatio": 0.01,
    "maxDiffPixels": 500
  }
}
```

## Viewport Strategy

Avoid testing every single width from `1920` to `360` on every run. The full range would produce `1561` widths if both endpoints are included.

Recommended strategy:

1. Start with core widths:
   - `1920`
   - `360`
2. Run pixel diff and overlap detection on those widths.
3. If a range is unstable, subdivide that interval.
4. Save discovered failure widths as regression widths.
5. Keep a full `1920` → `360` scan as a manual/deep diagnostic mode, not a default PR check.

## Figma Baseline Export

`figma-export.mjs` should:

1. Read `visual.config.json`.
2. Use `FIGMA_TOKEN` from `.env` or shell environment.
3. Export each configured `figmaFrameId` as PNG.
4. Save files under:

```text
baselines/figma/pages/<name>/<width>.png
baselines/figma/components/<name>/<width>.png
```

Important limitation: Figma prototype responsiveness is not identical to browser responsiveness. For reliable visual diff, prefer explicit Figma frames per breakpoint or carefully managed Auto Layout frames.

## Website Capture

`capture-pages.mjs` should:

1. Launch Playwright Chromium.
2. Iterate through `pages` from `visual.config.json`.
3. Set viewport width and a deterministic height.
4. Open `implementationUrl`.
5. Disable animations/transitions before screenshot.
6. Capture screenshot to:

```text
captures/web/<name>/<width>.png
```

Recommended CSS injection before screenshot:

```css
*, *::before, *::after {
  animation: none !important;
  transition: none !important;
  caret-color: transparent !important;
}
```

## Storybook Capture

`capture-storybook.mjs` should:

1. Open each Storybook `iframe.html` URL.
2. Set viewport width.
3. Wait for Storybook story render to settle.
4. Capture screenshot to:

```text
captures/storybook/<name>/<width>.png
```

Component screenshots should ideally use fixed padding/background rules so the diff is stable.

## Pixel Diff

`compare.mjs` should:

1. Pair each Figma baseline with its implementation screenshot.
2. Normalize image size if needed.
3. Compare with `pixelmatch`.
4. Save diff images to:

```text
reports/visual/diffs/<target>/<name>/<width>.png
```

5. Write result data into:

```text
reports/visual/report.json
```

Suggested result fields:

```json
{
  "status": "fail",
  "type": "page",
  "name": "login",
  "width": 390,
  "diffPixels": 5210,
  "diffRatio": 0.0491,
  "baselinePath": "baselines/figma/pages/login/390.png",
  "capturePath": "captures/web/login/390.png",
  "diffPath": "reports/visual/diffs/page/login/390.png"
}
```

## Overlap and Z-index Fight Detection

`inspect-overlaps.mjs` should run against the implementation pages, not the Figma baselines.

The detector should combine two approaches:

### 1. Bounding Box Intersections

Collect visible DOM elements:

- non-zero width and height,
- `display !== none`,
- `visibility !== hidden`,
- not ignored by allow-list rules.

Compare `getBoundingClientRect()` between candidate elements and report unexpected intersections.

### 2. Stack Sampling

Use browser hit testing:

```js
document.elementsFromPoint(x, y)
```

Sample points across:

- viewport grid,
- center of known components,
- overlap rectangle centers,
- important page regions.

If an interactive or content element is covered by an unrelated element, flag it.

Suggested result fields:

```json
{
  "type": "overlap",
  "status": "fail",
  "page": "login",
  "width": 390,
  "coveredSelector": "[data-testid='login-submit']",
  "coveringSelector": ".site-header",
  "overlapRect": { "x": 20, "y": 600, "width": 240, "height": 48 },
  "coveredZIndex": "auto",
  "coveringZIndex": "10"
}
```

## Selector Strategy

Prefer stable selectors in this order:

1. `data-testid`
2. `data-qa`
3. semantic role/name where practical
4. class names from the naming convention
5. generated CSS path only as a last resort

The visual test pipeline should encourage adding stable test selectors to important UI elements.

## Report Shape

The first report can be a simple HTML file.

Each row should show:

- status: PASS / FAIL
- type: page / component / overlap
- name
- viewport width
- diff percentage
- diff pixels
- overlap count
- links to baseline, capture, and diff image

Example table:

```text
Status | Type      | Name           | Width | Diff % | Diff Pixels | Overlaps | Diff
PASS   | Page      | login          | 1440  | 0.23%  | 212         | 0        | open
FAIL   | Page      | login          | 390   | 4.91%  | 5210        | 3        | open
PASS   | Component | button-primary | 390   | 0.10%  | 42          | 0        | open
```

## CI/CD Direction

### Local First

The first version should run locally because:

- Figma token setup is easier.
- Local Drupal and Storybook environments are still evolving.
- Visual diff output needs manual tuning before it becomes a CI gate.

### GitHub Actions Later

Once stable, add a workflow like:

```text
.github/workflows/visual-tests.yml
```

Target behavior:

1. Install dependencies.
2. Start Drupal local environment.
3. Start Storybook.
4. Export Figma baselines or restore cached baselines.
5. Capture implementation screenshots.
6. Run pixel diff.
7. Run overlap detector.
8. Upload `reports/visual` as workflow artifact.
9. Fail the workflow only when thresholds are exceeded.

### Percy Later

Percy can be added after the local pipeline is stable.

Possible role for Percy:

- store approved screenshots,
- review visual changes in pull requests,
- provide a nicer diff UI,
- reduce custom report work.

However, Percy should not replace the local Figma-vs-implementation mapping logic.

## Acceptance Criteria for MVP

The first useful version is complete when:

1. `npm run visual:test` exists.
2. At least one Drupal page can be compared against one Figma frame.
3. At least one Storybook component can be compared against one Figma component frame.
4. A local HTML report is generated.
5. Failed tests show baseline, actual screenshot, and diff image.
6. Overlap detector reports at least basic unexpected intersections.
7. The implementation does not require Percy.

## Implementation Notes for Codex

Codex should implement this incrementally:

1. Inspect existing project scripts and Storybook setup.
2. Add required dependencies only after checking current `package.json`.
3. Add `visual.config.example.json` before requiring real Figma IDs.
4. Avoid committing real `FIGMA_TOKEN` or private `.env` values.
5. Use local URLs already documented in `README.md`:
   - Drupal: `http://127.0.0.1:8081/`
   - Storybook: `http://127.0.0.1:6006/`
6. Keep generated screenshots and reports ignored by Git unless there is a specific reason to commit them.
7. Start with deterministic smoke targets, then expand.

## Open Questions

- Which exact Figma frames should be used for the first page baseline?
- Which exact Storybook stories should be used for the first component baseline?
- What viewport height should be standardized for page screenshots?
- Should full-page screenshots or viewport screenshots be used for each test type?
- What mismatch threshold is acceptable for early development?
- Should dynamic Drupal content be mocked, seeded, or normalized before capture?
