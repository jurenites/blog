const KEBAB_CASE_PATTERN = "^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$";
const BEM_CLASS_PATTERN =
  "^(?:is-|has-)?[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z0-9]+(?:-[a-z0-9]+)*)?(?:--[a-z0-9]+(?:-[a-z0-9]+)*)?$";

export default {
  customSyntax: "postcss-scss",
  ignoreFiles: [
    "generated/**",
    "storybook-static/**",
    "vendor/**",
    "web/core/**",
    "web/themes/custom/**/css/*.min.css",
  ],
  plugins: ["stylelint-scss"],
  rules: {
    "annotation-no-unknown": null,
    "at-rule-no-unknown": null,
    "block-no-empty": true,
    "color-no-invalid-hex": true,
    "declaration-block-no-duplicate-custom-properties": true,
    "declaration-block-no-duplicate-properties": true,
    "declaration-property-value-disallowed-list": {
      "/.*/": ["/#[0-9a-f]{3,8}\\b/i"],
    },
    "font-family-no-duplicate-names": true,
    "function-calc-no-unspaced-operator": true,
    "function-linear-gradient-no-nonstandard-direction": true,
    "keyframe-block-no-duplicate-selectors": true,
    "media-feature-name-no-unknown": true,
    "no-duplicate-at-import-rules": true,
    "no-duplicate-selectors": true,
    "property-no-unknown": true,
    "selector-pseudo-class-no-unknown": true,
    "selector-pseudo-element-no-unknown": true,
    "string-no-newline": true,
    "unit-no-unknown": true,

    // Convention rules are warnings while the codebase adopts them.
    "custom-property-pattern": [
      KEBAB_CASE_PATTERN,
      {
        message: "CSS custom properties must use kebab-case",
        severity: "warning",
      },
    ],
    "selector-class-pattern": [
      BEM_CLASS_PATTERN,
      {
        message: "CSS classes must use kebab-case or the project BEM pattern",
        resolveNestedSelectors: true,
        severity: "warning",
      },
    ],
    "scss/at-rule-no-unknown": true,
    "scss/dollar-variable-pattern": [
      KEBAB_CASE_PATTERN,
      {
        message: "SCSS variables must use kebab-case",
        severity: "warning",
      },
    ],
  },
};
