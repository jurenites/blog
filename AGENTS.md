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

Whole-card loading is the narrow exception: Article, Video, News, and Project
previews may render a generated, token-derived inline minimum-height estimate.
The head runtime may temporarily size those cards during loading, animate to
their measured natural height, and remove its inline properties and loading
attributes after handover. Preserve unrelated inline properties. This exception
does not permit permanent inline styling or dimension attributes on containers.

## Vertical Rhythm

Text line boxes must resolve to even whole CSS pixels at the default text scale;
use the existing 8px grid for component line heights, padding, and gaps. Atom
heights may use even sub-grid values when needed inside a larger component.
Preserve grid-aligned typography-role line heights. Round fluid line heights up
to the base grid, with a grid-aligned fallback. Animated text must keep its
container height stable throughout the transition. Inline glyph bounds and
transformed artwork are distinct from the line boxes that determine layout.

## Corner Shape

Use square corners for UI elements, including slider pagination markers. Avatar
is the circular exception. Do not introduce other rounded corners unless the
user explicitly requests them.

## Interaction Feedback

Every enabled clickable element must have visible hover feedback and keyboard
focus feedback. Tile and card backgrounds should become lighter on hover and
when their controls receive keyboard focus, using existing surface tokens.
Preserve disabled states and reduced-motion behavior.

## Selector Scope

Target the exact semantic element or component role being styled. When a
composed component contains multiple instances of a shared atom class such as
`.icon`, `.button`, or `.badge`, give the intended instance a specific BEM class
and apply overrides to that class. Do not use a broad descendant selector that
can accidentally style sibling or nested instances of the shared atom. Verify
that other instances retain the shared atom's default presentation.

## External Link Suffixes

Show an external-link suffix only on a standalone link or a link at the end of
a text block, with no text, badge, or other inline content following its label.
Omit the suffix and its reserved space for links within continuing text; do not
automatically decorate external links in prose. Eligible suffixes appear on
hover and keyboard focus without shifting surrounding content.

## Token Editing

The user defines the exact token inventory. Reuse existing tokens; do not add
tokens on your own. Never add palette colors or typography tokens unless the
user explicitly requests those additions.

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

Exception: Technology Stack logo colors are fixed component artwork constants
in `src/brand/technology-stack/brand-colors.js`. Keep them out of the token file
and shared palette; do not expose them as design-token variables.

Footer brand colors are also outside the design-token inventory: fixed logo
fills belong in the reviewed SVG assets, and editable hover colors/gradients
belong in Drupal menu fields. Literal colors in the footer's isolated Storybook
demo stylesheet and frozen legacy migration map are content fixtures, not theme
defaults. Generated icon markup inherits the SVG artwork colors.

Link prefix icons always occupy a fixed 16px by 16px box with a 16 by 16 SVG
viewBox. This is an artwork contract, not a design token. Designers own path
placement inside that viewport: never add per-logo dimensions, offsets, or
transforms. Preserve supplied SVG files, including white fills and separate
`-active.svg` companions; use those companions for hover and keyboard focus.
Keep surrounding component spacing token-based.

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
