# LLM Project Memory

This file is a compact current-state note for future AI-assisted work. Treat
`src/token/tokens.yaml` as the editable source of truth for design tokens.

## Product Workflow

Follow [Project Workflow](workflow.md), aligned with Alexander's twelve-milestone
[Cookbook](cookbook-product-design-process.md) and the editor-owned local page
at `/node/22`. Begin with product purpose; move through roles and concepts,
grayscale exploration, forms and glossary, tokens, Figma, Storybook,
documentation and backlog, Drupal integration with real data, and verification.
Feedback can revisit earlier decisions, including after a code-first prototype.
Use only the relevant steps for small tasks.

[Visual Testing Plan](visual-testing-plan.md) describes proposed iframe review
and screenshot comparisons across Figma, Storybook, and Drupal with matched
content, revisions, states, and viewports. The dashboard and pixel-diff runner
now exist for the first Storybook/Drupal case; Figma baseline comparison and
automatic CI ingestion are still pending. Existing Storybook health inspection
is a separate check.

## Current Token Pipeline

```text
src/token/tokens.yaml
  -> generated/styles/_tokens.scss
  -> generated/token/tokens.js
  -> scripts/figma/design-system-sync.js
```

There are no generated token JSON mirrors in the active workflow.

## Important Rules

- Do not hardcode HEX colors outside `src/token/tokens.yaml`.
- Do not add Storybook enum arrays by hand when the options can come from
  component tokens.
- Do not scrape generated CSS from JS. JS consumers read
  `generated/token/tokens.js`.
- Story files live in dedicated folders under their Atomic Design group.
- Nested component examples import shared `*.markup.js` helpers instead of
  pasting another component's HTML.

## Current Local Checks

- `npm run build:tokens`
- `npm run build-storybook`
- `npm run build:theme`
- `npm run figma:prepare`
