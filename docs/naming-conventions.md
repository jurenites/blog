# Naming Conventions (the shared language)

This is the contract that lets a Figma frame, a SCSS class, a Storybook story, a
Drupal component, and a token all refer to the same thing without guessing.

The single bridging idea: **BEM names are identical in code and in Figma layer
names.** If you rename or edit a frame in Figma, its name tells us exactly which
code part it maps to, and vice versa.

## 1. Component key (the stable identifier)

Every component has one canonical key: `{level}/{block}`, lowercase, kebab-case.

```
atoms/button        atoms/avatar        atoms/badge
molecules/project-card   molecules/hire-me-widget   molecules/article-teaser
organisms/timeline-rail
```

- `level` is the Atomic Design layer: `atoms`, `molecules`, `organisms`, `components`.
- `block` is the BEM block, kebab-case, and must be multi-word-meaningful where it
  matters (no lone generic words — same spirit as the token naming rule).

This key is the same in every tool. Everything else is a deterministic transform
of it:

| Tool            | Derived from key `molecules/project-card`                     |
| --------------- | ------------------------------------------------------------- |
| Storybook title | `Molecules/Project Card`                                      |
| SCSS file       | `slice/src/scss/molecules/_project-card.scss`                 |
| SCSS block      | `.project-card`                                               |
| Figma page      | `Molecules`                                                   |
| Figma component | `project-card` (exact block name, so layer mapping is literal) |
| Drupal SDC      | `web/themes/custom/jurenites_theme/components/project-card/`  |
| Mapping tag     | sharedPluginData `jrn.componentKey = "molecules/project-card"` |

## 2. BEM inside a component (block / element / modifier)

```
.block                 block root
.block__element        a named part of the block
.block--modifier       a variant of the whole block
.block__element--mod   a variant of a part
```

Rules:

- Elements and modifiers are kebab-case; multi-word parts stay hyphenated
  (`project-card__tag-list`, `hire-me-widget__avatar`).
- Never nest element-of-element in the name: it is `card__title`, not
  `card__header__title`. Nesting lives in the DOM, not the class.

## 3. Figma layer names == BEM names (the key rule)

Inside a Figma component, **name every meaningful layer after its BEM selector**:

```
project-card                     (component / frame root = .project-card)
  project-card__media            (= .project-card__media)
  project-card__body
    project-card__title
    project-card__excerpt
    project-card__tag-list
      chip                       (an instance of the atoms/chip component)
  project-card__actions
    button                       (an instance of the atoms/button component)
```

Because the layer name is the selector, when you edit `project-card__media` in
Figma, we both know it is `.project-card__media` in `_project-card.scss` and the
`media` area of the Drupal component. No translation table needed.

Layers that are pure decoration or auto-layout scaffolding can keep Figma default
names; only name the layers that map to real BEM parts.

## 4. Variant axes (one vocabulary everywhere)

Use the same three axes across tools. Add axes only when a component truly needs
them.

| Axis      | Figma variant property | Storybook arg | CSS expression                  |
| --------- | ---------------------- | ------------- | ------------------------------- |
| Variant   | `Variant=Primary`      | `variant`     | `.button--primary`              |
| Size      | `Size=Medium`          | `size`        | `.button--medium`               |
| State     | `State=Hover`          | (interaction) | `:hover`, `:focus`, `[disabled]`, `.is-active` |

- Figma property names are Capitalized; values are Capitalized.
- CSS modifiers are kebab-case lowercase.
- Interactive states (`hover`, `focus`, `disabled`) are real CSS states in code;
  in Figma they are explicit `State` variants so designers can see them.

## 5. Tokens inside components

Components must consume tokens, never raw values:

- Code: `var(--color-action-primary-default)`, `@include tools.typography-headline-5;`.
- Figma: bind fills/strokes/radius/gap/padding to the matching variable. Each
  variable already carries WEB code syntax (`var(--…)`), so Dev Mode shows the
  exact CSS variable name.

## 6. How a Figma frame is linked back to code (3 layers of safety)

1. **Naming** — component name = block key, layer names = BEM selectors (above).
2. **Mapping tag** — every Figma component is tagged on creation:
   ```js
   node.setSharedPluginData('jrn', 'componentKey', 'molecules/project-card');
   node.setSharedPluginData('jrn', 'bemBlock', 'project-card');
   ```
   Tooling/agents can query this to resolve a frame to its code component even if
   a name drifts.
3. **Code Connect** — the formal Figma Dev Mode link from a component to its code
   snippet (`.figma.ts`/SDC). Added when on a Dev/Full seat; until then layers 1–2
   are enough. See the `figma-code-connect` skill.

## 7. Drupal (Single Directory Components)

Target the Drupal SDC layout so the block name is the directory name:

```
components/project-card/
  project-card.component.yml   (props/slots, named with BEM parts)
  project-card.twig
  project-card.css             (compiled from slice, or @import)
```

Slots/props are named after BEM elements (`media`, `title`, `excerpt`,
`tag_list`, `actions`) so the Twig, the SCSS, and the Figma layers line up.

## 8. Quick checklist when adding a component

- [ ] Pick the key `{level}/{block}` and use it everywhere.
- [ ] SCSS partial `_{block}.scss` with `.block`, `.block__element`, `.block--modifier`.
- [ ] One Storybook story titled `{Level}/{Block}`, variants via Controls.
- [ ] Figma component named `{block}`, layers named after BEM selectors.
- [ ] Variant props use the `Variant` / `Size` / `State` vocabulary.
- [ ] Tokens bound (Figma) / used via vars+mixins (code) — no raw values.
- [ ] Figma component tagged with `jrn.componentKey` and `jrn.bemBlock`.
