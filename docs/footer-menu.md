# Footer menu editing

Edit `/admin/structure/menu/manage/footer`. All public footer navigation links
and column headings are Drupal menu-link content. Labels, destinations, order,
parents, enabled status, and translations are maintained through the native menu
controls. The theme renders the menu; it contains no account list or placement
rules based on specific URLs or labels. Storybook examples are independent demo
content and never feed the live website.

## Columns and placement

The four top-level items marked **Column heading** provide the four desktop
columns, stacked on mobile. Their **Menu link title** is the displayed heading.
Desktop columns fit their content and share equal gaps across the footer width.
Text stays left-aligned, with the final column ending at the footer's right edge.
Use `<nolink>` for their Link field. Their child menu items are the visible links.
Use **Parent link** or the menu overview's drag handles to move links between
columns and to reorder them. **Show as expanded** is not required: the footer
block expands its menu tree. Additional nested links remain visible as lists.

**Testing** (**Тестирование**) belongs in **How I work**, immediately after
**Cookbook** and before **Brandbook**. Its destination is ordinary editable menu
content: `http://test.jurenites.local/` in DEV and `https://test.jurenites.com/`
in PROD. The theme does not rewrite destinations by hostname. Adding this link
does not activate or deploy the testing subdomain.

For the existing menu UUIDs, add it once in DEV with:

```bash
docker exec -e FOOTER_TEST_URL=http://test.jurenites.local/ blog_jurenites_web vendor/bin/drush php:script scripts/footer/testing-link.php
docker exec blog_jurenites_web vendor/bin/drush cr
```

The script preserves existing links and translations, records reordered siblings
as new revisions, and leaves later edits intact on reruns. In PROD, use the menu
editor with the production URL, or run the same script through the hosting's
Drush with `FOOTER_TEST_URL=https://test.jurenites.com/` if the menu UUIDs match.
After copying a DEV database to PROD, update the existing Testing destination in
the menu editor; rerunning the script intentionally does not overwrite it.

The **For recruiters** section sits under **Get in touch**, with LinkedIn, hh.ru,
and My CV. Set its type to **Section heading**, its Link to `<nolink>`, and its
Parent link to the contact column. Its native **Description** field supplies
“Actively looking for a job” and can be translated with the heading.

Privacy links are maintained separately at
`/admin/structure/menu/manage/footer-legal` (**Footer legal**). This independent
Drupal menu renders beside the rights message. Its menu label is the accessible
navigation label. The old **Bottom-row group** remains supported for existing
content. The rights message and dynamic year remain the
existing interface translation. Top-level ordinary links appear in the bottom
row until assigned a parent. Disabling a heading hides its branch using native
Drupal menu behavior.

Select **Translate** on a menu item to edit its Russian title and optional hover
text. Presentation settings and hierarchy are shared between languages. Keep the
four headings as the top-level column structure; their wording is freely editable.

## Optional link controls

| Field | Behavior |
| --- | --- |
| Leading icon | Choose from the existing site SVG icon library, or leave empty. |
| Hover text | Alternate text on pointer hover and keyboard focus; translatable. |
| Hover color or gradient | A shared plain text field accepting a hex color, `var(--token-name)`, or `linear-gradient(...)`. Empty uses yellow. Gradients span the complete text phrase, including keyboard focus. |
| Open in a new window | Adds a safe new-window target and accessible announcement. Email and phone links always use their normal application. |
| Portfolio counter tag | Select an existing Tags term. The public destination becomes the Portfolio filter for that tag; the badge counts accessible published Projects. |

An ordinary link needs only its title, URL, and parent. No new palette tokens or
uploaded icon processing are introduced. To add a new SVG, place a reviewed asset
in `src/public/assets/icons/`, run `npm run build:theme`, and clear Drupal cache.
It then appears in **Leading icon**; SVG uploading is not available in this form.
Link prefixes have a fixed 16 by 16 CSS-pixel box. Prepare artwork with
`viewBox="0 0 16 16"`; path placement belongs to the designer, with no per-icon
size or position adjustments in code. A matching `-active.svg` asset is paired
automatically for hover and keyboard focus and hidden from the base-icon selector.
Both assets are bundled into the initial markup; no JavaScript is required.
The supplied default SVG files retain white fills, with CSS applying the menu's
hover color to unpaired white artwork. Active companions retain their own colors.
Existing menu icon names are unchanged, so no content migration is needed.
The supplied hh.ru logo is available as **Brand Hh**. Its color is the existing
menu link hover paint (`#FF0002`), including keyboard focus. The icon selector uses existing assets.
Hover paint is editable menu content, stored as literal colors/gradients for
brand-specific links. Shared theme-token references remain supported. Fixed logo
fills live in the SVG assets. The former footer token namespace is removed;
Link prefix dimensions are a fixed artwork contract. Storybook's isolated demo stylesheet supplies independent sample
paint and is never included in the Drupal theme. Badge backgrounds/numbers retain the shared Badge appearance,
even when the link label has a hover color. Counts use node, term, language, and
permission cache metadata; translations of a Project do not double its count.
No new Tags are created by this feature.

Example Figma menu value:

```css
linear-gradient(90deg, #f24e1e 0%, #ff7262 25%, #a259ff 50%, #1abcfe 75%, #0acf83 100%)
```

The text field accepts 3/4/6/8-digit hex colors or CSS custom-property references.
Linear gradients accept an optional angle in degrees or a `to right`/corner
direction, with 2–12 colors and optional percentage stops. Other CSS syntax
(including URLs and extra declarations) is rejected by Drupal field validation.
The initial page head receives validated, per-value stylesheet rules before
cached or BigPipe menu fragments render; component markup has no
inline style attributes and needs no JavaScript for the gradient. Icons and
badges are excluded from the text clipping; forced-colors mode keeps text legible.
A solid text-fill fallback prevents missing gradient rules from making text invisible.

For environments that already have the preset selector, run the footer module's
`jurenites_footer_post_update_hover_paint` through `drush updatedb` after deployment.
It creates the shared string field and migrates only empty new values. Existing
presets become literal colors, with Figma becoming a five-color gradient. The
old field remains hidden for rollback; subsequent editorial text is preserved.

## Installation and migration

The `jurenites_footer` module owns the optional menu fields, native form help,
menu preprocessing and generic tag counter. It enables menu-content translation
and expands the existing footer block. It does not seed links or overwrite
editorial content on installation. The old Fonts-only preprocessor steps aside
when this module is enabled.

For an existing environment, capture the **old rendered footer before deploying
the replacement Twig template**, then enable the module and migrate. Keep the
snapshot and database backup outside Git. Example DEV sequence:

```bash
docker exec blog_jurenites_web vendor/bin/drush sql:dump --result-file=/tmp/jurenites-before-editable-footer.sql
curl --fail http://jurenites.local/ > /tmp/jurenites-footer-before-en.html
curl --fail http://jurenites.local/ru > /tmp/jurenites-footer-before-ru.html
docker cp /tmp/jurenites-footer-before-en.html blog_jurenites_web:/tmp/jurenites-footer-before-en.html
docker cp /tmp/jurenites-footer-before-ru.html blog_jurenites_web:/tmp/jurenites-footer-before-ru.html
# Deploy the new module, theme source, and built assets at this point.
docker exec blog_jurenites_web vendor/bin/drush en jurenites_footer -y
docker exec -e FOOTER_SNAPSHOT_PREFIX=/tmp/jurenites-footer-before blog_jurenites_web vendor/bin/drush php:script scripts/footer/migrate.php
docker exec blog_jurenites_web vendor/bin/drush cr
```

Adapt hostnames and Drush commands for STAGE/PROD; local execution does not deploy
there. The importer consumes the two captured pages, preserves existing menu
entities and their translations, creates missing headings/links, and maps legacy
icons/colors/hover labels to fields. It resolves counter Tags already in Drupal.
Its completion marker prevents a repeated run from resetting later menu edits.
A clean installation has no editorial link defaults: create the column headings
and links through the menu UI. Restore the environment's database backup and old
code together if rolling back the migration.

For this existing local menu, `scripts/footer/recruiter-section.php` performs the
one-time editorial rearrangement after the `sections` post-update. It matches
known entity UUIDs, preserves destinations and hh.ru paint, retains the old empty
legal group disabled, and records completion so reruns preserve later edits.
Back up the database before applying it; other environments need their own
editorial mapping. No remote deployment is implied.

## Verification

### Removing the former brand-color tokens

Back up the database before applying `drush updatedb`, then rebuild the theme
and clear Drupal cache. The `literal_hover_paint` post-update replaces only
references to the 30 removed footer colors, including inside gradients, in both
footer menus and their historical revisions. It preserves literal custom colors,
unrelated token references, translations, links, ordering, and revision identities.
The frozen `LegacyHoverPaint` map supports upgrades and is not a runtime palette.
Rerunning the migration makes no further changes. Restore the database backup
with its matching code if rolling back this migration.

- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/footer-recruiter.browser.mjs`
  checks recruiter placement, links and descriptions in EN/RU at desktop/mobile
  widths, the separate legal navigation, and hh.ru hover/keyboard focus.

- `docker exec blog_jurenites_web php tests/footer-hover-paint.php` checks the
  accepted color/gradient grammar and rejection of invalid CSS.
- `docker exec blog_jurenites_web vendor/bin/drush php:script tests/footer-token-migration.php`
  checks both menus, historical/current/pending revisions, preserved translations
  and custom paint, and migration idempotence; removes its fixtures afterward.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/footer-brand-paint.browser.mjs`
  checks saved brand colors and SVG fills on EN/RU desktop/mobile pages, plus
  isolated Storybook sample paint. Serve `storybook-static` on port 6017 or set
  `STORYBOOK_URL` to another local Storybook server first.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/footer-gradient.browser.mjs`
  checks the actual Figma gradient in both languages, keyboard/forced-colors
  behavior, and an isolated server-rendered footer without JavaScript.

- `docker exec blog_jurenites_web vendor/bin/drush php:script tests/footer-menu.php`
  checks translated heading edits, reparenting, disable/enable cache behavior,
  distinct Project counts and publication changes; restores fixtures afterward.
- `PLAYWRIGHT_BROWSERS_PATH=.cache/ms-playwright node tests/footer-menu.browser.mjs`
  exercises native create/edit/translate/parent/disable controls and desktop/mobile
  rendering with a temporary menu link that is removed afterward.
- Build the theme after SCSS changes; run the footer and Portfolio tests, scoped
  Stylelint/ESLint, `npm run docs:check`, and the diff whitespace check.
