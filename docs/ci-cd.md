# CI/CD And Generated Artifacts

The project is still in active shaping, so heavy CI is disabled for now. Keep the
local pipeline simple and explicit.

## Current Local Pipeline

```text
src/token/tokens.yaml
  -> generated/styles/_tokens.scss
  -> generated/token/tokens.js
  -> scripts/figma/design-system-sync.js
  -> web/themes/custom/jurenites_theme/css/style.min.css
  -> web/themes/custom/jurenites_theme/js/script.min.js
```

## Useful Commands

| Action | Command |
| --- | --- |
| Rebuild token artifacts | `npm run build:tokens` |
| Run Storybook locally | `npm run storybook` |
| Build static Storybook | `npm run build-storybook` |
| Build Drupal theme assets | `npm run build:theme` |
| Prepare Figma sync token data | `npm run figma:prepare` |

## GitHub Actions

- `ci.yml.disabled` is intentionally disabled while the repository is still
  changing quickly.
- `storybook-pages.yml` can still publish Storybook on pushes to `main`.
- `figma-sync.yml` exists for future dispatch/manual sync work, but the current
  preferred workflow is local token editing plus `npm run figma:prepare`.

Do not reintroduce generated token JSON mirrors for CI convenience. If CI comes
back, it should rebuild from `src/token/tokens.yaml` and compare the current
generated artifacts.
