# Figma Sync

`src/token/tokens.yaml` is the editable source of truth. Figma sync is explicit:
edit tokens, regenerate artifacts, then run the generated Figma module when the
file should be updated.

## Current Direction

```text
src/token/tokens.yaml
  -> generated/token/tokens.js
  -> scripts/figma/design-system-sync.js
  -> Figma variables and design-system frames
```

The Figma sync helper imports `generated/token/tokens.js`. It must not embed a
mirrored token payload or fallback color values.

## Push To Figma

1. Edit `src/token/tokens.yaml`.
2. Run `npm run figma:prepare`.
3. Run `scripts/figma/design-system-sync.js` as a local Figma plugin
   development module.

The script creates or updates the **Design System - Synced** page with color
variables, typography frames, and UI component frames.

## Pull From Figma

Manual Figma-to-token pulling is paused while the project is still being shaped.
When it returns, the pull should write back to `src/token/tokens.yaml` directly
and then rebuild generated artifacts. It should not recreate JSON token mirrors.
