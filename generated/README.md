# Generated Artifacts

Files in this folder are generated from source files and should not be edited by
hand.

Token source: `../src/token/tokens.yaml`

Generated token outputs:

- `generated/styles/_tokens.scss`: SCSS token artifact consumed by the theme and
  Storybook. It is generated from YAML and should not be edited directly.
- `generated/token/tokens.js`: JS token artifact consumed by Storybook controls
  and token-driven JS. It is generated from YAML and should not be edited
  directly.

Regenerate them with:

```sh
npm run build:tokens
```
