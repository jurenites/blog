# Documentation Version

Version: 0.1.3
Reviewed: 2026-06-16

This checkpoint says the `/docs` folder has been reviewed against the current
source structure, token pipeline, Storybook organization, Figma sync flow, Drupal
token endpoint, and planned visual testing workflow.

## Versioning Policy

- Bump the documentation patch version by `+0.0.1` when a commit changes source
  structure, token flow, component contracts, build scripts, or workflow rules in
  a way future work needs to understand.
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
