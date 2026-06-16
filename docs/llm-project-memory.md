# LLM Project Memory

This file is a compact current-state note for future AI-assisted work. Treat
`src/token/tokens.yaml` as the editable source of truth.

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
