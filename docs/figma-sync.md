# Figma Sync

`src/token/tokens.yaml` is the editable source of truth. Figma sync is explicit:
edit tokens, regenerate artifacts, then run the generated Figma module when the
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
and then rebuild generated artifacts. It should not recreate JSON token mirrors.
