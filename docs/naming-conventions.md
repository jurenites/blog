# Naming Conventions

Use meaningful names that connect source code, Storybook, Drupal markup, and
Figma. `AGENTS.md` is the working convention; existing platform APIs and token
identifiers retain their required names.

## Project identifiers

New variables, props, Storybook args, and helper functions use at least two
meaningful words. JavaScript uses `snake_case`; top-level story demo constants
use `SCREAMING_SNAKE_CASE`. CSS classes, BEM parts, and template filenames use
`kebab-case`. Token paths use dot notation in `src/token/tokens.yaml`.

| Avoid | Use |
| --- | --- |
| `label` | `button_label` |
| `variant` | `style_variant` |
| `title` | `card_title` |
| `eyebrow` | `eyebrow_heading` |
| `tokens` | `token_map` |

External API keys such as Storybook's `title`, DOM properties, and Drupal field
API names keep their required spelling. Reuse existing token namespaces rather
than renaming `color`, `space`, or `component` to satisfy a variable-name rule.
The user owns the token inventory; do not add tokens without an explicit request.

## Component source and Storybook

A component has a stable BEM block name, for example `project-card`:

| Surface | Current example |
| --- | --- |
| Story folder | `src/stories/molecules/project-card/` |
| Story file | `project-card.stories.js` |
| Shared story renderer | `project-card.markup.js` where composition needs it |
| SCSS partial | `src/slice/src/scss/molecules/_project-card.scss` |
| BEM block | `.project-card` |
| Storybook title | `Molecules/Project Card` |
| Drupal integration | Theme or module Twig using the same BEM contract |

The visible Storybook title can include additional groups such as Blog, Video,
or Section. It need not reproduce the filesystem path. The generated Storybook
index is authoritative for story IDs and dashboard mappings.

Keep each visible example's story, local templates, and markup helpers together.
Place individual demo values near the top of the story and wire them through
`args`; arrays and renderer maps can be one named constant each. Named exports
cover distinct scenarios, while Controls expose property combinations. Compose
existing renderers instead of copying another component's HTML.

## BEM and selector scope

```css
.project-card {}
.project-card__media {}
.project-card__tag-list {}
.project-card--featured {}
```

Do not encode DOM nesting as `card__header__title`. Give a composed atom a
component-specific class before overriding it, such as
`.project-card__action-icon`; a broad `.project-card .icon` can affect unrelated
nested icons. Interaction states use actual `:hover`, `:focus-visible`, disabled
attributes, or the component's existing state classes.

Use two-word application prop names such as `card_title` and `tag_items`, even
when their corresponding BEM element is simply `__title` or `__tags`.

## Figma mapping convention

The public library name follows the Storybook title, for example `Atoms/Button`.
Source folders and BEM blocks retain kebab-case (`button`). Layers that represent
markup may use BEM names; layout scaffolding may retain descriptive names.
Existing singular `Atom/` names and different vocabulary are audit findings,
not automatically accepted aliases. Preserved AI v1 components are historical
references; their differences do not authorize replacing designer v2 assets.

| Surface | Agreed Button contract |
| --- | --- |
| Figma and Storybook | `Atoms/Button` |
| Public style dimension | `button_style`: `primary`, `secondary`, `text` |
| Storybook disabled control | `is_disabled`: BOOLEAN (`control: 'boolean'`) |
| Figma reference dimension | `button_state`: `default`, `hover`, `disabled` |
| Theme adapter | Public `text` maps explicitly to `style_variant: ghost` / `.button--ghost` |
| Interaction | Native disabled attribute; natural enabled CSS hover and keyboard focus |

`button_state` is a visual-reference dimension only. It must not replace the
Storybook disabled boolean or become a hover prop. Different platform property
types need an explicit mapping, rather than matching names by guesswork.

A mapping tag such as shared plugin data `jrn.componentKey` or `jrn.bemBlock`
can help tools resolve a renamed layer. This is a convention for authored Figma
work, not metadata automatically applied by the token-sync plugin. That plugin
updates variables and styles only. Code Connect mappings and an SDC conversion
are not prerequisites of the current theme and are not an implemented library.

## Tokens and values

Use existing semantic tokens and generated typography mixins in component styles.
YAML scalar tokens use direct values or dot-path references; comments explain
intent. Do not add source `$type`, `$value`, or `$description` wrappers, enum
self-mappings, or copied palette values. Storybook owns control-option arrays.

Palette values live in `color.palette.*`; semantic roles live in `theme.dark.*`;
component mappings live in `component.<component-name>.*`. Generated CSS flattens
paths with dashes. Fixed artwork and footer content exceptions are documented in
`AGENTS.md` and [Design System](design-system.md).

## Enforcement

`npm run lint` checks JavaScript, SCSS, HTML templates, and the token contract.
Naming rules currently report warnings; syntax and correctness rules can fail
the command. The actual severities live in `eslint.config.js` and
`stylelint.config.js`. Passing lint does not replace review of naming, semantic
markup, selector scope, or Figma correspondence.

## Recorded naming audit

Run `node scripts/audit-component-names.mjs --output artifacts/naming-audit/report.json`.
Run `node --test tests/component-naming-audit.test.mjs` for contract regression
checks. Add `--strict` to exit 1 for either mismatches or missing evidence; default
mode records findings without failing. No services or build steps are involved.

The distinct `component-naming` check covers every discovered story title and
public args/argTypes, theme Twig BEM occurrences, explicit documentation mapping,
and candidate Figma names/properties. It does not replace lint or certify runtime
behavior. Theme occurrences establish source correspondence only; components in
custom modules may require additional evidence. Dynamic Storybook metadata is
reported as missing evidence. Literal titles establish availability, not a
complete semantic name review. Generic property mappings stay incomplete until
reviewed; only the Button dimensions currently have a strict shared contract.

`config/naming-figma-evidence.json` records a read-only live Figma capture of the
manual, preserved AI, and Guideline libraries, with node IDs, property definitions,
capture time and read errors. Cover and Pages are excluded compositions. The CLI
uses that snapshot offline: refresh it with the figma-use skill after Figma edits,
retaining the schema and capture provenance. It never treats an image, URL, or an
older visual inventory as proof of current naming. A recorded verified result is
valid for its capture time, not a claim of live synchronization.

The 2026-10-13 capture confirms manual Button node `1394:1177`. It also records
`Atom/Checkox`, singular `Atom/` groups, and Avatar node `1730:1343` failing its
property-definition read. The earlier naming doc's blanket BEM-as-Figma-name
rule has been replaced by the public title mapping above. No assets are renamed.

### Dashboard integration interface

Consume the JSON report as an independent naming check, separate from appearance
and interaction checks. `schema_version: 1`, `audit_kind`, `generated_at`,
`evidence_captured_at`, `summary_counts`, `component_rows`, and `audit_rows` form
its interface. Component IDs derive from the story folder path (for example
`atoms-button`); use the generated Storybook index to reconcile IDs when titles
or nested groups differ. Do not silently attach a finding to another component.

Each audit row includes a stable `check_id`, `component_id`, `surface_name`,
`check_name`, `check_status`, expected and observed values, `source_paths`, and a
copyable `correction_prompt`. Statuses are `verified`, `mismatch`, and
`missing_evidence`; missing evidence must never display as a pass. Display
snapshot age and scope alongside results. Consumers may persist the entire report
in their existing review store; this CLI does not write dashboard persistence.

Copy a finding's correction prompt to an AI agent for a scoped fix. Re-run the
CLI after code/doc edits and refresh Figma evidence after design edits. Inspect
the resulting diff before accepting the correction. Do not blanket-rename
production classes, Drupal API names, artwork or historical libraries.
