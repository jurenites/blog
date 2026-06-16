# Project Instructions

## Naming

Use meaningful names with at least two words for variables, props, Storybook args,
and helper functions. Avoid lone generic names like `label`, `variant`, `title`,
`eyebrow`, `tokens`, or `render` in project code.

- CSS classes, template filenames, and BEM parts use `kebab-case`.
- JavaScript variables, functions, Storybook args, and `argTypes` use `snake_case`.
- File-local demo constants at the top of a `*.stories.js` file use
  `SCREAMING_SNAKE_CASE` (for example `VALUE_MODE`, `BUTTON_LABEL`).
- Design tokens use `dot.notation` in the source tree.

Example: use `eyebrow_heading`, not `eyebrow`.

## Storybook Examples

Keep each visible Storybook example in its own folder under its type group, such
as `src/stories/atoms/button/` or `src/stories/molecules/article-teaser/`.
Store the story file, local template files, and local markup helpers together in
that folder.

Keep temporary/example values near the top of each `*.stories.js` file as
individual `SCREAMING_SNAKE_CASE` constants, not bundled in a single object.
Wire them into Storybook through the `args` block so demo values stand out and
are easy to find and replace without digging through render logic or metadata.

Example:

```js
const BUTTON_LABEL = "Contact me";
const STYLE_VARIANT = "primary";

export default {
  args: {
    button_label: BUTTON_LABEL,
    style_variant: STYLE_VARIANT,
  },
};
```

For grouped demo data (arrays, renderer maps), keep one file-local constant in
`SCREAMING_SNAKE_CASE` (for example `FONT_ROWS`, `NESTED_RENDERERS`).

When one story nests another component, do not paste that component's HTML by
hand. Put shared rendering in a nearby `*.markup.js` helper and import that
helper from both the atom story and the composed component story.

## Token Editing

The editable design-token source is `src/token/tokens.yaml`. Keep it readable with
comments and namespace spacing. For Cursor or VS Code, this repo includes
workspace settings that make YAML keys, values, comments, and indentation easier
to distinguish. YAML syntax highlighting cannot reliably color keys by nesting
depth on its own, so indentation guides / indent coloring are the preferred way
to show token hierarchy.

Do not write hardcoded HEX color literals in handwritten source, Storybook
stories, Figma sync scripts, SCSS, or JS. Editable color values belong in
`src/token/tokens.yaml`; code should read generated token values or CSS
variables from that source. Generated artifacts may contain resolved color
values only because they are derived from the token source.

## Documentation Versioning

Documentation has its own review checkpoint in `docs/version.md`. When source
structure, token flow, component contracts, build scripts, or workflow rules
change in a meaningful way, update the relevant docs and bump the documentation
patch version by `+0.0.1`.

During heavy refactoring, do not rewrite every doc for every tiny experiment.
Before a commit, run `npm run docs:check`; if source history has moved too far
ahead of the docs checkpoint, review `/docs`, update stale pages, and bump the
documentation version.
