# Generated Artifacts

Files in this folder are generated from source files and should not be edited by
hand.

Token source: `../src/token/tokens.yaml`

Generated token outputs:

- `generated/tokens/`: JSON contracts for tools, Storybook foundations, Drupal,
  and Figma sync.
- `generated/styles/`: CSS/SCSS token artifacts consumed by the theme and
  Storybook.

Regenerate token artifacts with:

```sh
npm run build:tokens
```
