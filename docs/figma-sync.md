# Figma Sync

`src/token/tokens.yaml` is the editable source of truth. Figma sync is explicit:
edit tokens, regenerate artifacts, then run the bundled Figma plugin when the
file should be updated.

## Current Direction

```text
src/token/tokens.yaml
  -> generated/token/tokens.js
  -> scripts/figma/design-system-sync.js
  -> Figma variables, text styles, and effect styles
```

The Figma sync helper imports `generated/token/tokens.js`. It must not embed a
mirrored token payload or fallback color values.

## Push To Figma

1. Edit `src/token/tokens.yaml`.
2. Run `npm run figma:prepare`.
3. In Figma, import `scripts/figma/manifest.json` as a development plugin.
4. Run **Blog jurenites token sync** in the target design file.

The script creates or updates source-managed local variables, text styles, and
effect styles. It does not create or change components or canvas pages.

## Pull From Figma

Manual Figma-to-token pulling is paused while the project is still being shaped.
When it returns, the pull should write back to `src/token/tokens.yaml` directly
and then rebuild generated artifacts. It should not recreate editable JSON token mirrors. The existing generated
`color-mappings.json` is an inspection artifact. The dispatchable legacy
`.github/workflows/figma-sync.yml` still calls an unsupported `sync.sh pull`
command and must not be treated as a working import pipeline.

## Relationship to the Product Workflow

The [Cookbook process](workflow.md) develops Figma components and states after
the initial roles, concepts, wireframes, forms, glossary, and tokens. Code-first
prototypes can feed discoveries back into those decisions. Syncing tokens is
one tool operation within that process; it does not establish component or page
parity by itself.

The proposed [visual testing layer](visual-testing-plan.md) maps exact Figma
frames to Storybook stories and Drupal regions with matching real content and
states. Iframes support review; exported, versioned frames supply screenshot
references. The dashboard accepts manually exported Figma PNGs and compares all three
pairs. The language-picker suite has pinned Figma exports; the default Article
Blog List Item case still has no Figma baseline. Automatic exports remain pending.
