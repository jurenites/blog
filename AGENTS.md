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

## DOM Styling

Do not put presentational sizing or styling directly on HTML elements. In
particular, do not render `width`, `height`, or `style` attributes on images or
other component markup, including the initial server-rendered DOM. Define
dimensions and visual presentation in the component's SCSS, using design tokens
where applicable.

Runtime code may add temporary sizing only after the page has loaded when it is
strictly required for skeleton-loading behavior. Do not use that exception for
the component's normal layout or final rendered appearance.

## Selector Scope

Target the exact semantic element or component role being styled. When a
composed component contains multiple instances of a shared atom class such as
`.icon`, `.button`, or `.badge`, give the intended instance a specific BEM class
and apply overrides to that class. Do not use a broad descendant selector that
can accidentally style sibling or nested instances of the shared atom. Verify
that other instances retain the shared atom's default presentation.

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

Documentation has its own review checkpoint in `docs/version.md`, synchronized
with the project version. Version `1.0.0` marks the first production release.
For each subsequent delivered project iteration, use `npm run version:bump` to
increment the minor version. Use an explicit `patch` argument for a correction
to an existing release and `major` for an intentionally incompatible change.

During heavy refactoring, do not rewrite every doc for every tiny experiment.
Before a commit, run `npm run docs:check`; if source history has moved too far
ahead of the docs checkpoint, review `/docs`, update stale pages, and bump the
documentation version.

## Implementation Workflow

Work directly from the user's task. Implement small, clear changes, verify the
result, and refine it through feedback without requiring planning artifacts or
workflow commands.

- For substantial features, briefly describe the intended behavior and approach
  in chat. Clarify only consequential uncertainties before dependent work.
- Write a short plan before expensive-to-reverse changes such as content
  migrations, permission changes, or deployment architecture. Use an existing
  relevant doc when the plan needs to survive across tasks.
- Account for the existing Drupal and Storybook architecture; do not invent
  speculative systems, automation, or edge cases without a requirement.
- Keep durable decisions and delivered behavior in the relevant `/docs` page,
  and project-wide conventions in `AGENTS.md`. Avoid duplicate feature records.
- Run checks appropriate to the change and report what was verified, including
  any runtime or deployment work that remains.
