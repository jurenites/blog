# Recipe: translate the website

The website keeps English as its source language and serves Russian under `/ru`.
Use Drupal's existing language switcher. Translating a page adds a translation
to the same entity; it does not replace the English page.

## Where text belongs

Drupal has three translation owners:

- **Content:** pages, articles, project stories, menu links, tags and paragraph
  text live as entity translations in the database. Editors use the entity's
  Translate tab and save a Russian revision.
- **Interface:** Twig `|t`, PHP `t()` and JavaScript `Drupal.t()` strings use
  Drupal's locale storage. JavaScript extraction requires literal source strings;
  passing only a variable to `Drupal.t()` does not register its possible values.
- **Configuration:** View titles, block headings and Webform labels use Russian
  language configuration overrides. English configuration stays intact.

The Git catalogue in `translations/` records reviewed English/Russian pairs for
all three owners. JSON is useful here because a content address includes an
entity UUID, field, item index and property, while rich text includes HTML and
newlines. Numeric entity IDs are environment-specific and are not import keys.

`review.en-ru.csv` is generated for spreadsheet review. `interface.ru.po` is a
generated gettext export for Drupal and translation platforms. Only JSON is
edited as the import source; maintaining JSON, CSV and PO independently would
create three conflicting versions of the same translation.

The website does not fetch these JSON files in the browser. Drupal renders the
saved translations and supplies its normal JavaScript locale catalogue.

## Apply the reviewed catalogue on DEV

Run from the repository root. Back up the environment's database first. Keep
database backups outside Git. The first import also enables content translation
for the affected bundles and changes Paragraphs reference fields to shared
structure, which is the supported Paragraphs translation arrangement.

```bash
docker exec blog_jurenites_web ./vendor/bin/drush sql:dump --result-file=/tmp/jurenites-before-ru.sql
docker exec blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/apply.php
docker exec blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/config-apply.php
docker exec -e JURENITES_TRANSLATIONS_APPLY=1 blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/config-apply.php
docker exec -e JURENITES_TRANSLATIONS_APPLY=1 blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/apply.php
docker exec blog_jurenites_web ./vendor/bin/drush cr
node scripts/translations/export.mjs
```

Without `JURENITES_TRANSLATIONS_APPLY=1`, both import scripts validate and save
nothing. They reject changed English sources, missing content and conflicting
Russian editorial changes. Repeating an unchanged import does not create new
content translations or node revisions. When intentionally revising a Russian
translation, record the exact accepted old text as `previous_ru` in that row;
the importer then accepts that value as well as the new `ru` value.
Apply configuration before interface strings because Drupal synchronizes
configuration translation edits back into locale storage.

For a timeline-only correction, set `JURENITES_TRANSLATIONS_SCOPE=timeline` on
the content importer. It selects the catalogue's timeline nodes, their current
paragraphs and the timeline interface strings. Unrelated pages retain their own
source guards and are excluded from this import:

```bash
docker exec -e JURENITES_TRANSLATIONS_SCOPE=timeline blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/apply.php
docker exec -e JURENITES_TRANSLATIONS_SCOPE=timeline -e JURENITES_TRANSLATIONS_APPLY=1 blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/apply.php
docker exec blog_jurenites_web ./vendor/bin/drush cr
```

When an older translation lacks a newly added field item, the importer copies
the English item's structure before replacing its translated text. This keeps
rich-text formats and link URLs alongside translated descriptions and labels.

This catalogue requires the same source entities and English text on the target
environment. Do not run it blindly against a different production database.
For a different site, inventory its own public content and prepare its own
UUID-addressed catalogue. Never include visitor submissions, private drafts or
credentials in a public translation repository.

## Preserve behavior across languages

Paragraph reference fields share structure across languages. Translate the
fields inside paragraphs. Translating the reference field itself creates
separate structures and can leave a Russian page displaying an English copy.
Custom renderers resolve paragraph and taxonomy translations from the current
language before displaying their text.

Tag filters retain English-derived keys such as `?tag=font`; translated labels
are presentation values. Views filter by the current content language to avoid
duplicate English/Russian rows. Translation cache metadata must include the
language context and referenced content dependencies.

Company names, product names, handles, font identifiers, code and URLs retain
their original spelling. Font specimen pangrams and embedded font metadata are
specimens/source data; their surrounding controls are translated. Linked videos
and external documents are outside the site's translation catalogue.

### Timeline translation

The timeline renderer reads project and organization names from the original
entity in both languages. Descriptions, introduction, link labels and interface
text use the selected language. Month labels on the axis and in project date
ranges begin with a capital letter, including Russian abbreviations; this is
scoped to the timeline and does not change global date translations.

The September 8 correction covers the 73 current projects on local node 25,
including the manually added Accountia landing page and edited Dzing text.
The catalogue records the actual English field values, rather than assuming
the installation seed data is still current. Names retain their complete
English spelling. The correction preserves the English content, dates, item
order and destination URLs.

For future authoring, keep one English source timeline with shared paragraph
structure and dates. A translation step can prepare Russian drafts for new or
changed descriptions and link labels, with project and organization names
excluded from translation. Track the source text or hash used for each draft
and flag changed English text for review before publishing the translation.
This draft-generation workflow is a recommendation, not an installed feature;
the current guarded catalogue import remains an explicit editorial step.

## Verify

```bash
docker exec blog_jurenites_web ./vendor/bin/drush php:script scripts/translations/verify.php
node --test tests/portfolio-tag-filtering.test.mjs tests/font-preview.test.mjs
node scripts/translations/export.mjs
npm run docs:check
```

Check English and Russian pages, the homepage slides, Contact placeholders,
portfolio filters, project paragraphs, timeline descriptions and browser-loaded
font labels. The verification script checks saved field pairs and anonymous
HTTP responses. It does not submit Contact messages.

## When to add a translation service

This small two-language project can use Git review and CSV without a paid
service. A service becomes useful when several translators need assignments,
terminology management and coordinated releases. Keep Drupal as the content
owner and connect the service through exports/imports. Do not add a second
runtime translation mechanism merely to use a service.

Drupal documents its native PO workflow in
[Translating site interfaces](https://www.drupal.org/docs/administering-a-drupal-site/multilingual-guide/translating-site-interfaces).
[Lokalise](https://lokalise.com/) is an optional workflow service, not a required
dependency of this recipe.
