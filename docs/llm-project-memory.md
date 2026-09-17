# LLM Project Memory

This file is a compact current-state note for future AI-assisted work. Treat
`src/token/tokens.yaml` as the editable source of truth for design tokens.

## Product Workflow

Follow [Project Workflow](workflow.md), aligned with Alexander's thirteen-milestone
[Cookbook draft](cookbook-product-design-process.md). Publishing the new Testing
step to the editor-owned local page at `/node/22` and its translation is pending.
Begin with product purpose; move through roles and concepts,
grayscale exploration, forms and glossary, tokens, Figma, Storybook,
documentation and backlog, Drupal integration with real data, Testing, and final
verification.
Feedback can revisit earlier decisions, including after a code-first prototype.
Use only the relevant steps for small tasks.

[Visual Testing Plan](visual-testing-plan.md) describes proposed iframe review
and screenshot comparisons across Figma, Storybook, and Drupal with matched
content, revisions, states, and viewports. The dashboard and pixel-diff runner
now support generic URL/selector mappings, optional Figma PNGs, three image
panes, and 1:1 overlay/wipe/difference controls. Missing Figma references do not
block implementation review. Windows VM coverage, automatic Figma exports, and
automatic CI ingestion remain pending. Existing Storybook health inspection is a separate check.

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
