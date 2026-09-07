# English and Russian catalogue

Drupal owns the live website content. These files are reviewed translation
imports and exchange files, not a second content renderer.

| File | Purpose |
| --- | --- |
| `content.ru.json` | English/Russian content fields, addressed by entity UUID, field, item index and property. |
| `interface.ru.json` | English/Russian interface strings with gettext context. |
| `config.ru.json` | English/Russian configuration values, such as block headings, Views titles and Contact labels. |
| `review.en-ru.csv` | Generated comparison table for Google Sheets or another spreadsheet editor. |
| `interface.ru.po` | Generated standard gettext file for Drupal or a translation service. |
| `inventory.json` | Initial English DEV inventory; a dated snapshot, not the live catalogue. |

Edit JSON, then run `node scripts/translations/export.mjs` to regenerate CSV and
PO. CSV preserves commas, quotes, HTML and embedded newlines in quoted cells.
Import it into Google Sheets using a comma separator and disable conversion of
text to numbers, dates and formulas. Review English and Russian side by side.
To accept spreadsheet edits, copy the reviewed Russian values back to their
matching JSON keys and regenerate; there is no automatic Sheets sync.

See [the localization recipe](../docs/localization.md) for validation, import,
editing ownership and deployment instructions.
