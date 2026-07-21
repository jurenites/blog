# Documentation Version

Version: 0.0.15
Reviewed: 2026-07-19

This checkpoint says the `/docs` folder has been reviewed against the current
source structure, token pipeline, Storybook organization, Figma sync flow, Drupal
token endpoint, and planned visual testing workflow.

## Versioning Policy

- `package.json` owns one version for the whole repository. Drupal, Storybook,
  generated build information, and this documentation checkpoint use that same
  project version.
- Bump the project patch version by `+0.0.1` for each implemented project
  iteration discussed and delivered through this workspace.
- During active refactoring, it is fine to avoid rewriting docs for every small
  experiment. Before committing meaningful source changes, run
  `npm run docs:check` and update docs when the checker reports drift.
- If a change is code-only and does not affect developer workflow or public
  component behavior, no documentation bump is required.

## Current Source Contract

- Editable token source: `src/token/tokens.yaml`.
- Generated token artifacts: `generated/styles/_tokens.scss` and
  `generated/token/tokens.js`.
- Storybook stories: one component folder per visible example under
  `src/stories/`.
- Figma sync helper: `scripts/figma/design-system-sync.js` reads
  `generated/token/tokens.js`; it is helper code, not a generated artifact.
- Visual testing is documented as a plan in `docs/visual-testing-plan.md`; it
  becomes runnable documentation only after the first real scenario is
  implemented and verified.
- Spacing tokens use semantic names, not numeric names, so values can change
  without renaming component code.
- Storybook browser inspection is prepared through `npm run storybook:inspect`;
  install Playwright locally first with `npm install --save-dev playwright` and
  `npm run playwright:install`.
- Storybook and Drupal expose generated build identity in a bottom-right
  screenshot signature.
- Pagination uses one class contract across Storybook, shared SCSS, and Drupal's
  pager override, with verified no-overflow behavior at the 360px minimum width.
- Storybook manager colors now come from generated YAML tokens instead of copied
  HEX values, and token builds enforce that source-of-truth contract.
- Drupal theme builds configure relative font URLs and copy canonical font files
  into deployable theme assets.
- JavaScript, SCSS, and component-template linting now runs before the Storybook
  deployment build, with naming conventions introduced as configurable warnings.
- Storybook delivery now uses an explicit lint gate: pull requests run lint, and
  main-branch builds and deployments cannot start until that job succeeds.
- Storybook inspection discovers stories dynamically and checks both token-defined
  minimum mobile and desktop widths, including horizontal overflow as a failure.
- Personal publishing components now include a composed Author Byline, editorial
  Pull Quote, and responsive Site Header, each verified at the 360px minimum.
- Desktop and wide breakpoints are unified into one 1280-1920px desktop range.
  Centered content is capped at 1440px and wider screens remain background-only.
- Semantic typography mapping separates foundation roles from theme roles;
  Blog Title is Open Sans 32px/500.
- The screenshot signature displays the shared project version, current
  UTC build update time to the second, seven-character Git hash, and collaboration
  credit with exact solid token colors in Drupal, the Storybook manager, and every
  Storybook preview screen.
- Typography dimensions now use explicit pixel values end to end; legacy root
  font-size conversion logic has been removed from Storybook and Figma sync.
- Project-owned folder documentation is centralized in
  `docs/repository-structure.md`; the repository root contains the only tracked
  `README.md`.
- The front page uses a monochrome radial field, one-logical-pixel grain, and a
  hard-edged cursor brush with four structured four-by-four pattern families.
  Sixteen grayscale ranks remain inside the resting noise's local tonal range,
  and only logical pixels uncovered by a brush pass receive new random grain.
- The cursor brush leaves a clock-sampled dither trail. Trail circles hold at
  full size briefly, then shrink through hard logical-pixel radii over one second.
- Future scenic backgrounds use named parallax depth layers from sky through
  foreground dunes.
- Typography roles do not own uppercase transformation. Uppercase is an explicit
  Button component token and applies only to the Button atom.
- Storybook manager CSS lives in `src/styles/storybook-manager.css`; manager HTML
  contains links and scripts only, with no inline styles.
- The future About Me page has a documented TrueDepth point-cloud bust contract:
  PLY capture, reduced grayscale points, progressive loading, and a mandatory
  static-image fallback.
- The project signature uses the 4pixel typeface at 5px; its `Version 0.0.N`
  identity line is light primary text while the collaboration credit is secondary.
- The Drupal theme uses the optimized 32px Jurenites mark for `logo.svg` and a
  high-contrast `favicon.svg`. Eight Figma-exported paths were consolidated into
  one compound path without changing the filled pixel geometry.
- Procedural artwork uses a documented WebGL shape language built from projected
  faces, edge functions, signed distance fields, color fields, and alpha fields.
- Local Docker traffic uses semantic host routing: `jurenites.local` for Drupal
  and `storybook.jurenites.local` for Storybook, matching the future
  `jurenites.com` domain structure.
- The version label and number are separate values. The secondary-color Git hash
  links to the exact GitHub commit and gains a one-pixel underline on hover.
- The procedural background renders exactly one shader sample per CSS logical
  pixel. The complete gradient and grain are pixel-quantized and Retina output
  uses nearest-neighbor presentation rather than physical-pixel interpolation.
- The favicon uses the compact 16px Jurenites mark and adapts for tab contrast:
  light browser themes receive a black background with a white mark, while dark
  browser themes receive a white background with a black mark.
