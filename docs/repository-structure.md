# Repository Structure

The root `README.md` is the only project-owned README. Detailed folder contracts
live in `/docs` so source directories contain implementation files rather than
separate documentation islands.

## Token Source

`src/token/tokens.yaml` is the editable source of truth for design tokens.

Generated token artifacts live at:

- `generated/styles/_tokens.scss` for CSS and SCSS consumers.
- `generated/token/tokens.js` for Storybook and other JavaScript consumers.

Rebuild both artifacts after changing the YAML source:

```bash
npm run build:tokens
```

Do not edit the generated token artifacts by hand.

## Theme Source

`src/slice/` contains editable frontend source shared by the Drupal theme and
Storybook.

- SCSS source: `src/slice/src/scss/`
- JavaScript source: `src/slice/src/js/`
- Drupal theme output: `web/themes/custom/jurenites_theme/css/style.min.css` and
  `web/themes/custom/jurenites_theme/js/script.min.js`

Build the Drupal theme with:

```bash
npm run build:theme
```

Keep editable styles and scripts under `src/slice/`. The Drupal theme contains
Twig templates and generated minified assets.

## Generated Artifacts

Files under `generated/` are derived from editable source and must not be edited
by hand. The token build currently produces:

- `generated/styles/_tokens.scss`, consumed by the Drupal theme and Storybook.
- `generated/token/tokens.js`, consumed by Storybook controls and token-driven
  JavaScript.

The source for both files is `src/token/tokens.yaml`. Regenerate them with
`npm run build:tokens`.

## Dependency Documentation

Composer dependencies under `vendor/` and Drupal scaffold files under `web/`
may contain upstream README files. They are ignored, third-party files rather
than project documentation, and dependency installation may recreate them.
