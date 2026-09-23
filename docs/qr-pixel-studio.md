# QR Pixel Studio

The `jurenites_qr_studio` custom module serves `/qr-studio` as a dedicated full-screen application document. The route requires Drupal's existing `access content` permission. It uses Drupal routing, Twig rendering, library attachments, and asset URLs while keeping the studio styles separate from the blog theme. The header provides a return link to the website. No node, paragraph type, database schema, server-side encoding service, or npm runtime is required.

The maintained application source is `web/modules/custom/jurenites_qr_studio/ui/`; its document template is `templates/qr-studio-document.html.twig` in that module. The earlier localhost prototype remains available separately. Make subsequent Drupal changes in the module, rather than copying an older prototype over it.

## Behavior

- Fresh workspaces start with `HTTPS://?????.??` in Encoded Text, ready to search five name characters and a two-letter domain ending. The initial QR is a temporary preview, not a saved match. Existing saved projects retain their stored input.

- Dropdown chevrons have a 12px right inset and reserved text padding, including the compact QR size selector.
- One Encoded Text input updates fixed text immediately. Resizing/changing correction retries a differing draft, and reopening an outdated preview rebuilds it from the stored input when it fits, keeping hover mappings aligned with the workspace. Lowercase is accepted in complete text and search patterns, with exact fixed case preserved (including domain endings). Lowercase patterns use byte encoding and bounded random search; uppercase patterns retain the alphanumeric constraint solver. The caption explains that capitals use less QR space. `?` marks search positions; temporary preview values remain distinct from found matches.
- The toolbar labels are Draw (invert the touched pixel) and Lock (toggle its lock). The canvas title is hidden; the QR size selector remains visible.
- Lock outlines are green when the actual cell matches the unpainted QR at the current mask, and red when it differs. This applies to both black and white locks, updates on regeneration, and works independently of the Expected overlay. Unlocked cells have no lock outline.
- Website searches select the final hostname label from the bundled IANA delegated TLD list: `.??` matches two characters, `.???` three, `.????` four, and `.*` any length that fits the QR. Fixed endings and fixed characters in partial endings are preserved. The Name characters setting applies to free name positions, not the TLD. Preview values also use real endings. Browse matching domain endings lists candidates grouped by length, with the source version. Existing invalid saved website strings remain visible with a warning.
- The editor preserves painted locks, scans the result locally, saves matching strings, and excludes them from subsequent searches. Search runs in a Web Worker.
- Character inspection maps QR data groups to cells. Missing black cells appear gray in the Expected guide; altered cells are counted separately from successful error correction.
- Grid sizes range from 21×21 to 57×57 in standard four-module increments. Rotation takes 180 ms and respects reduced-motion preferences. `.canvas-stage` clips overflow during the rotation.
- Saved matches appear directly below the Check the result heading and have an Active/Passive switch. Passive entries are dimmed and collapsed to one line; switch them back to Active to load or export them. Both states remain excluded from search. The state persists in browser storage and project JSON; older entries default to Active.
- Saved addresses are selectable links. Normal clicks load the saved QR; selecting text does not load it. HTTP(S) links support native open-in-new-tab actions.
- Each saved match has a delete button that removes only that entry and persists the updated list. The current QR stays on the workspace.
- Pixel text adds one movable layer with the user's actual `src/public/assets/fonts/4pixel.ttf`, preserving case, glyph contours, advance widths, baseline and descenders. `scripts/build-qr-studio-font.mjs` extracts its 527 mapped glyphs into `ui/4pixel-data.js` at one native font pixel per QR module, with a source SHA-256 fingerprint. The native cap height is four modules; descenders and accents can extend beyond it. T Text toggles the entire text layer, centered maximum-750px controls and violet outline. When off, the underlying QR and manual artwork reappear and the text contributes no search or export constraints. Turning it on restores the wording, position and edits. Visibility survives undo, saved matches, project files and browser storage. Draw and Lock remain usable while the controls are open. The input applies changes immediately; clearing it removes the layer. There are no Add/update or Remove buttons. Typing applies the draft and selects the Text tool; drag the occupied area with Text or use canvas arrow keys to move it. New lettering uses white glyph gaps and a one-module white perimeter, with visible lock marks and a bounding outline. Expected gray guides do not cover these white cells. Text can reach all grid edges, clipping its outside white perimeter. The Lock tool toggles individual glyph/padding cells between text-owned color and automatic QR color, including drag/Shift rectangles. Released cells follow the text and persist through undo, browser storage, saved matches and project files; editing the wording resets releases. Draw toggles glyph and padding pixels as final overrides owned by the text layer, re-locking released cells. These edits move with the text and persist through undo, browser storage, saved matches and project files. Lock can release an override back to automatic QR color and restore it again. The Text enabled switch hides the layer and resets its Draw overrides; switching it on restores the original lettering with existing Lock releases. Changing the wording also clears Draw overrides. Underlying manual locks are kept for when the text moves away. Long text wraps into additional lines using the native font metrics to fit the grid. Existing saved layers keep their original layout until edited. Base locks stay separate, so moving/removing text restores underlying artwork and current encoded QR pixels. Text participates in mask selection, search constraints, decode audits and SVG export; it survives undo/redo, saved matches and project/browser storage. Protected structure cells are skipped. Shrinking clips text and its violet outline at the QR grid boundary. The text keeps its position, wrapping width, Draw overrides and Lock releases; growing the grid reveals the hidden cells again. Saved projects and matches preserve this clipped state. The quiet zone stays clear, including after rotation. Release all locks and the logo preset clear the text layer.
- SVG downloads use the uppercase hostname as the filename, such as `F4X6S.MEN.svg`, for both saved matches and the current QR; non-domain text uses `qr-code.svg`.
- SVG export includes the quiet zone and excludes editor guides. Project JSON includes the input pattern, artwork, rotation, and saved matches.
- Encoding, decoding, imports, searching, and project storage run in the browser. No project data or files are uploaded. The module does not register domains or configure redirects.

Browser storage belongs to each origin. To move work from `http://127.0.0.1:4179/` to Drupal, use **Save project** in the prototype and **Open project** on the Drupal page. Keep project JSON as a portable backup. Drupal login does not synchronize this browser-local state across devices.

## Assets and palette

The app entry point is an unaggregated ES module. Its worker and logo URLs resolve against `import.meta.url`, so language prefixes, aliases, and installation subdirectories do not change their asset locations. Worker imports remain relative to the worker file. QR encoder and decoder libraries are bundled locally with their license notices. ESLint excludes `ui/vendor/` to preserve these upstream libraries; maintained application code remains covered by `npm run lint:js`.

Editable colors are under `qr-studio.color` in `src/token/tokens.yaml`. Run `npm run build:qr-studio` to regenerate the module's `ui/palette.css`; the normal `build:tokens` script also runs this step. The module's stylesheet consumes these values without requiring the blog theme styles.

## TLD snapshot

`ui/tld-data.js` bundles IANA's delegated TLD list from https://data.iana.org/TLD/tlds-alpha-by-domain.txt. The initial snapshot is version 2026091300 with 1,438 entries, including ASCII forms of internationalized endings. Refresh explicitly with `node scripts/update-qr-studio-tlds.mjs`, then update the library version and rebuild Drupal caches when deploying changed assets. Both the worker and the result handler validate domain endings before accepting a match. Results also identify their TLD snapshot version; older workers and results that change fixed pattern positions are rejected before the QR or saved list changes. Searches use the bundled snapshot offline and do not send entered names to IANA. Delegation does not establish registration eligibility, public sale availability, or whether a particular name is unregistered. Restricted, brand, and infrastructure TLDs remain in the official list.

## Enable and verify

Deploy `ui/vendor/qrcodegen.js`, `ui/vendor/jsQR.js`, and `ui/vendor/jsQR-LICENSE.txt` with the module code. These bundled browser libraries have explicit exceptions to the repository's `vendor/` ignore rule; they are not installed by Composer or included in the public-files archive. Missing libraries return HTTP 404, followed by browser MIME errors and an undefined `qrcodegen.QrCode` error. Verify both library URLs after deployment.

Enable the module separately in each target environment:

```sh
vendor/bin/drush en jurenites_qr_studio -y
vendor/bin/drush cr
```

Run `npm run test:qr-studio` for encoding, solver, mapping, live input, rotation, resizing, and expected-cell regressions. The read-only local HTTP smoke test is:

```sh
docker exec blog_jurenites_web php web/modules/custom/jurenites_qr_studio/tests/drupal-route.php
```

The smoke test verifies the anonymous route, required input/canvas, processed Drupal attachments, ES-module entry point, isolated styles, and all directly requested assets. Run it against the target DEV build. Production enablement/deployment and real-phone scanning are separate checks.

## Editing the Twig document in Cursor

Save `web/modules/custom/jurenites_qr_studio/templates/qr-studio-document.html.twig`, then run **Tasks: Run Task** from the Command Palette:

- **QR Studio Twig: Expand tags** starts each HTML tag on a new line with two-space nesting.
- **QR Studio Twig: Compact tags** puts tags together on one line.

These tasks only rewrite this document. Attributes, Twig expressions, inline spaces, and raw pre/textarea/script/style bodies are preserved. If Twig control-flow blocks are introduced, use the Twig formatter instead of this HTML layout toggle. The equivalent terminal commands are `node scripts/format-qr-studio-twig.mjs expand` and `node scripts/format-qr-studio-twig.mjs compact`.

The workspace settings target the **Twig Language 2** extension for ordinary **Format Document / Format Selection**. It preserves existing line breaks; Twig format-on-save is disabled so saving does not choose a layout for you.
