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
| Run all source lint checks | `npm run lint` |
| Check JavaScript and Storybook naming | `npm run lint:js` |
| Check SCSS and BEM naming | `npm run lint:scss` |
| Check component HTML templates | `npm run lint:templates` |
| Rebuild token artifacts | `npm run build:tokens` |
| Run Storybook locally | `npm run storybook` |
| Build static Storybook | `npm run build-storybook` |
| Build Drupal theme assets | `npm run build:theme` |
| Prepare Figma sync token data | `npm run figma:prepare` |
| Refresh generated Storybook build identity | `npm run build:info` |
| Reject stale Storybook build identity | `npm run build:info:check` |
| Validate synchronized project version | `npm run version:check` |
| Bump the normal minor release | `npm run version:bump` |
| Bump a specific SemVer part | `npm run version:bump -- patch|minor|major` |

## GitHub Actions

- `ci.yml.disabled` is intentionally disabled while the repository is still
  changing quickly, but its prepared build also runs the lint gate when enabled.
- `storybook-pages.yml` can still publish Storybook on pushes to `main`.
  It validates that all project-version locations agree, then exposes lint as a
  separate required stage on pull requests and pushes to `main`. Build waits for
  that stage, and deployment waits for build, so code cannot move farther
  through the pipeline after a version or lint failure. After building, it also
  verifies that the generated Storybook identity matches the workflow commit
  supplied by `GITHUB_SHA`.
- `release-version.yml` is a manually triggered release preparation workflow.
  Its default `minor` bump advances `1.0.0` to `1.1.0`; `patch` and `major` are
  also available. It opens a reviewable pull request instead of writing directly
  to `main`. Merging that pull request starts the normal Storybook deployment.
- `figma-sync.yml` exists for future dispatch/manual sync work, but the current
  preferred workflow is local token editing plus `npm run figma:prepare`.

There are deliberately no Git hooks or version changes on ordinary pushes. Run
`npm run version:check` and `npm run lint` locally whenever you want a pre-push
check; the same checks protect the deployment pipeline after code reaches
GitHub. Prepare a release locally with `npm run version:bump`, or trigger
`Prepare Project Release` in GitHub Actions to receive a version-only pull
request.

## Drupal Font Assets

The editable fonts and their licenses live in `src/public/assets/fonts/`.
`npm run build:theme` copies them to
`web/themes/custom/jurenites_theme/assets/fonts/`. Commit these deployable copies
alongside the compiled theme CSS so a Git-based PROD update includes every font
referenced by that CSS without requiring a build on the server. Previously this
directory was ignored, allowing the CSS to arrive while font requests returned
404 and Ubuntu Sans Mono fell through to a fallback monospace font.

For an existing PROD checkout missing these files, use the font repair procedure
in `docs/command-cheat-sheet.md`.

## Deployment Identity

The watermark is visible in DEV and PROD. Its semantic version, release time,
repository, and collaboration credit come from the tracked
`web/themes/custom/jurenites_theme/release-info.json`. `npm run version:bump`
updates that file together with `package.json`, `package-lock.json`, and
`docs/version.md`, so a production checkout receives the release identity in
the same `git pull` as the source.

Drupal reads the current checkout hash directly and read-only from `.git`; it
does not generate or modify metadata on the host. Storybook still embeds the
same tracked release data and the build commit into its static output. GitHub
Actions supplies `GITHUB_SHA`, while a different artifact builder can supply
`JURENITES_GIT_COMMIT`. `npm run build:info:check` validates only that generated
Storybook artifact.

To prevent merging a pull request whose lint stage failed, configure the `lint`
job from the `Deploy Storybook` workflow as a required status check in the
repository's `main` branch protection rules.

## Lint Strictness

Syntax errors, invalid templates, duplicate declarations, and unknown SCSS/CSS
features fail the lint command. Project naming conventions currently report as
warnings so existing components can be migrated gradually:

- JavaScript variables, function names, and Storybook args use `snake_case`;
- file-local demo constants use `SCREAMING_SNAKE_CASE`;
- CSS classes use kebab-case or BEM;
- SCSS variables and CSS custom properties use kebab-case.

To make naming blocking later, change the relevant `warn`/`severity: "warning"`
settings in `eslint.config.js` and `stylelint.config.js` to errors.

Do not reintroduce generated token JSON mirrors for CI convenience. If CI comes
back, it should rebuild from `src/token/tokens.yaml` and compare the current
generated artifacts.
