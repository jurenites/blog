# Figma <-> Tokens Sync

`tokens/tokens.yaml` is the editable single source of truth. `tokens/tokens.json`
is generated from it as the machine-readable contract. Figma is a working
surface.
Sync is intentionally explicit (run a command), not silent background magic.

Two directions, two mechanisms:

| Direction          | Mechanism            | Command                          |
| ------------------ | -------------------- | -------------------------------- |
| tokens.yaml -> Figma variables | Tokens Studio plugin | `scripts/sync.sh studio` then Pull in Figma |
| tokens.yaml -> Figma frames/components | Generated Figma script | `npm run build:figma-sync`, then run `scripts/figma/generated-design-system-sync.js` in Figma |
| Figma -> tokens.yaml | Figma MCP (read)     | dump variables, then `scripts/sync.sh pull` |

## A. Push: tokens.yaml -> Figma (Tokens Studio)

1. Edit `tokens/tokens.yaml` (or accept code-side changes).
2. Run `scripts/sync.sh studio`. This regenerates `tokens/tokens.studio.json`
   (one set named `global`, W3C/DTCG format).
3. Commit and push so the file is on the branch Tokens Studio syncs from.
4. In Figma: open the **Tokens Studio** plugin -> Settings -> Sync provider ->
   point at this repo (or the file `tokens/tokens.studio.json`) in **DTCG/W3C**
   mode -> **Pull**. Then "Create/Update variables" to apply the set to Figma
   variables.

Token names map to Figma variable groups by path: `color.palette.white`
becomes the Figma variable `color/palette/white`.

## A2. Push: tokens.yaml -> Figma design-system page

Use this when Figma should also contain the visible design-system frames, not
only Variables.

1. Run `npm run build:figma-sync`. This regenerates:
   - `tokens/tokens.studio.json` for Tokens Studio variable sync.
   - `scripts/figma/generated-design-system-sync.js` for Figma frames and UI
     components.
2. In Figma, run `scripts/figma/generated-design-system-sync.js` through the
   Figma MCP `use_figma` tool or a local development plugin.
3. The script creates/updates a page named **Design System - Synced** with:
   - Color variable swatches.
   - Typography role frames.
   - UI component frames for buttons, chips, badges, cards, and the hire-me
     widget.

The generated script embeds resolved values from `tokens/tokens.flat.json`.
Do not hand-edit it; edit `tokens/tokens.yaml`, then regenerate.

## B. Pull: Figma -> tokens.yaml (Figma MCP)

When you tweak variables manually in Figma, bring them back as follows.

1. Use the Figma MCP `use_figma` tool to run this read snippet against the file.
   It returns a flat map keyed exactly like our token names (slashes become
   dashes, colors become HEX):

   ```js
   const variables = await figma.variables.getLocalVariablesAsync();
   const collections = await figma.variables.getLocalVariableCollectionsAsync();
   const defaultModeByCollection = Object.fromEntries(
     collections.map((collection) => [collection.id, collection.defaultModeId]),
   );

   function toHex(channel) {
     return Math.round(channel * 255).toString(16).padStart(2, "0");
   }

   const result = {};
   for (const variable of variables) {
     const modeId = defaultModeByCollection[variable.variableCollectionId];
     const value = variable.valuesByMode[modeId];
     const tokenName = variable.name.split("/").join("-");
     if (variable.resolvedType === "COLOR" && value && typeof value === "object") {
       const alpha = value.a === undefined || value.a === 1 ? "" : toHex(value.a);
       result[tokenName] = `#${toHex(value.r)}${toHex(value.g)}${toHex(value.b)}${alpha}`;
     } else if (variable.resolvedType === "FLOAT") {
       result[tokenName] = `${value}px`;
     } else {
       result[tokenName] = value;
     }
   }
   return JSON.stringify(result, null, 2);
   ```

2. Save that JSON to `scripts/figma/figma-variables.json` (git-ignored).
3. Preview the change set: `scripts/sync.sh pull-dry`.
4. Apply: `scripts/sync.sh pull`. This writes `tokens/tokens.json`, refreshes
   `tokens/tokens.yaml`, and rebuilds the generated files.

### Semantic references are protected

Semantic tokens (for example `color.action.primary-default`) are aliases to
primitives. The pull script will **not** overwrite an aliased token unless you
pass `--force`:

```sh
node scripts/figma/pull-from-figma.mjs scripts/figma/figma-variables.json --force
```

Prefer editing the primitive (`color.palette.white`) so every alias updates
automatically. Keep the alias structure intact.

## C. After any token change

```sh
scripts/sync.sh build        # regenerate SCSS/CSS/min/flat
scripts/sync.sh deploy-theme  # rebuild theme + clear Drush cache + bump cache-buster
```

Then hard-refresh the browser (Cmd+Shift+R) to bypass the disk cache.
