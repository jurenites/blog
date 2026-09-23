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

When maintaining matching Figma components, use the BEM block as the component
name and BEM selectors as names for layers that correspond to markup:

```text
project-card
  project-card__media
  project-card__body
    project-card__title
    project-card__tag-list
      chip
```

Pure layout scaffolding can retain descriptive Figma names. Match relevant
variant vocabulary to code, such as `Variant=Primary` and `style_variant`, or
`Size=Medium` and `component_size`. Define hover/focus/disabled Figma states only
where the component supports them.

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
