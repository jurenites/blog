# Project Instructions

## Naming

Use meaningful names with at least two words for variables, props, Storybook args,
and helper functions. Avoid lone generic names like `label`, `variant`, `title`,
`eyebrow`, `tokens`, or `render` in project code.

- CSS classes, template filenames, and BEM parts use `kebab-case`.
- JavaScript variables, functions, Storybook args, and `argTypes` use `snake_case`.
- Design tokens use `dot.notation` in the source tree.

Example: use `eyebrow_heading`, not `eyebrow`.

## Token Editing

The editable design-token source is `src/token/tokens.yaml`. Keep it readable with
comments and namespace spacing. For Cursor or VS Code, this repo includes
workspace settings that make YAML keys, values, comments, and indentation easier
to distinguish. YAML syntax highlighting cannot reliably color keys by nesting
depth on its own, so indentation guides / indent coloring are the preferred way
to show token hierarchy.
