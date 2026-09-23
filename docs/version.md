# Documentation Version

Version: 1.140.7
Reviewed: 2026-09-22

This checkpoint covers a repository-source review of `/docs`: source paths,
build commands, workflow files, content models, component behavior, and testing
capabilities. It does not certify a running environment, published CMS content,
remote CI results, mail delivery, or production deployment.

## Versioning policy

`package.json` owns the project version. `package-lock.json`, the tracked theme
`web/themes/custom/jurenites_theme/release-info.json`, and this checkpoint must
agree. Run `npm run version:check` to verify them.

Version `1.0.0` marks the first production release. Use `npm run version:bump`
for a delivered iteration, `npm run version:bump -- patch` for a correction,
and `npm run version:bump -- major` for an intentionally incompatible change.
The command synchronizes all four files and updates the release timestamp.

Before committing, run `npm run docs:check`. It checks Git history distance and
reports local changes; it does not validate the accuracy of the prose. Review
changed behavior in its owning document rather than appending a second feature
history here. Git retains superseded documentation.

## Documentation map

- [Repository structure](repository-structure.md): editable source, generated
  assets, Drupal modules, recipes, and local tools.
- [Workflow](workflow.md), [naming](naming-conventions.md), and
  [design system](design-system.md): development and component contracts.
- [Content model](drupal-content-model.md), [localization](localization.md),
  [About](about-page.md), [Hero](hero-section.md), [Contact](contact-form.md),
  [Contact photo](contact-photo.md), [layered scene](layered-scene.md),
  [footer](footer-menu.md), and [messages](drupal-messages.md): Drupal behavior
  and editorial ownership.
- [CI/CD](ci-cd.md), [command runbook](command-cheat-sheet.md),
  [Figma sync](figma-sync.md), and [visual testing](visual-testing-plan.md):
  implemented tooling, verification boundaries, and remaining integrations.
- [Cookbook](cookbook-product-design-process.md): the English editorial draft;
  changing it does not publish a Drupal revision.
- [Game of Life](game-of-life.md), [QR Studio](qr-pixel-studio.md), and
  [thumbnail studio](thumbnail-studio.md): feature and artwork workflows.

Documentation prose is English. Keep language codes, route aliases, entity
identifiers, and translation filenames unchanged when they identify actual
project resources. Translated website copy belongs to Drupal and `translations/`.
