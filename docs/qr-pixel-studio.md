# QR Pixel Studio

The `jurenites_qr_studio` custom module serves `/qr-studio` as a dedicated full-screen application document. The route requires Drupal's existing `access content` permission. It uses Drupal routing, Twig rendering, library attachments, and asset URLs while keeping the studio styles separate from the blog theme. The header provides a return link to the website. No node, paragraph type, database schema, server-side encoding service, or npm runtime is required.

The maintained application source is `web/modules/custom/jurenites_qr_studio/ui/`; its document template is `templates/qr-studio-document.html.twig` in that module. The earlier localhost prototype remains available separately. Make subsequent Drupal changes in the module, rather than copying an older prototype over it.

## Behavior

- One Encoded Text input updates fixed text immediately. `?` marks search positions; temporary preview values remain distinct from found matches.
- The toolbar labels are Draw (invert the touched pixel) and Lock (toggle its lock). The canvas title is hidden; the QR size selector remains visible.
- Lock outlines are green when the actual cell matches the unpainted QR at the current mask, and red when it differs. This applies to both black and white locks, updates on regeneration, and works independently of the Expected overlay. Unlocked cells have no lock outline.
- Website searches select the final hostname label from the bundled IANA delegated TLD list: `.??` matches two characters, `.???` three, `.????` four, and `.*` any length that fits the QR. Fixed endings and fixed characters in partial endings are preserved. The Name characters setting applies to free name positions, not the TLD. Preview values also use real endings. Browse matching domain endings lists candidates grouped by length, with the source version. Existing invalid saved website strings remain visible with a warning.
- The editor preserves painted locks, scans the result locally, saves matching strings, and excludes them from subsequent searches. Search runs in a Web Worker.
- Character inspection maps QR data groups to cells. Missing black cells appear gray in the Expected guide; altered cells are counted separately from successful error correction.
- Grid sizes range from 21×21 to 57×57 in standard four-module increments. Rotation takes 180 ms and respects reduced-motion preferences. `.canvas-stage` clips overflow during the rotation.
- SVG export includes the quiet zone and excludes editor guides. Project JSON includes the input pattern, artwork, rotation, and saved matches.
- Encoding, decoding, imports, searching, and project storage run in the browser. No project data or files are uploaded. The module does not register domains or configure redirects.

Browser storage belongs to each origin. To move work from `http://127.0.0.1:4179/` to Drupal, use **Save project** in the prototype and **Open project** on the Drupal page. Keep project JSON as a portable backup. Drupal login does not synchronize this browser-local state across devices.

## Assets and palette

The app entry point is an unaggregated ES module. Its worker and logo URLs resolve against `import.meta.url`, so language prefixes, aliases, and installation subdirectories do not change their asset locations. Worker imports remain relative to the worker file. QR encoder and decoder libraries are bundled locally with their license notices.

Editable colors are under `qr-studio.color` in `src/token/tokens.yaml`. Run `npm run build:qr-studio` to regenerate the module's `ui/palette.css`; the normal `build:tokens` script also runs this step. The module's stylesheet consumes these values without requiring the blog theme styles.

## TLD snapshot

`ui/tld-data.js` bundles IANA's delegated TLD list from https://data.iana.org/TLD/tlds-alpha-by-domain.txt. The initial snapshot is version 2026091300 with 1,438 entries, including ASCII forms of internationalized endings. Refresh explicitly with `node scripts/update-qr-studio-tlds.mjs`, then update the library version and rebuild Drupal caches when deploying changed assets. Searches use the bundled snapshot offline and do not send entered names to IANA. Delegation does not establish registration eligibility, public sale availability, or whether a particular name is unregistered. Restricted, brand, and infrastructure TLDs remain in the official list.

## Enable and verify

Enable the module separately in each target environment:

```sh
vendor/bin/drush en jurenites_qr_studio -y
vendor/bin/drush cr
```

Run `npm run test:qr-studio` for encoding, solver, mapping, live input, rotation, resizing, and expected-cell regressions. The read-only local HTTP smoke test is:

```sh
docker exec blog_jurenites_web php web/modules/custom/jurenites_qr_studio/tests/drupal-route.php
```

The smoke test verifies the anonymous route, required input/canvas, processed Drupal attachments, ES-module entry point, isolated styles, and all directly requested assets. Local module enablement and these checks were completed for this integration. Production enablement/deployment and real-phone scanning are separate checks.
