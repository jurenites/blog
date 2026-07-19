import { defineConfig } from "eslint/config";

const SNAKE_CASE_OR_CONSTANT_PATTERN =
  "^(?:[a-z][a-z0-9]*(?:_[a-z0-9]+)+|[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+)$";

export default defineConfig([
  {
    ignores: [
      "generated/**",
      "storybook-static/**",
      "vendor/**",
      "web/core/**",
      "web/libraries/**",
      "web/modules/contrib/**",
      "web/profiles/contrib/**",
      "web/sites/default/files/**",
      "web/themes/contrib/**",
      "web/themes/custom/**/js/*.js",
      "web/themes/custom/**/js/*.min.js",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-const-assign": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-loss-of-precision": "error",
      "no-new-native-nonconstructor": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-self-assign": "error",
      "no-setter-return": "error",
      "no-sparse-arrays": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "no-unused-labels": "error",
      "no-unused-private-class-members": "error",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-useless-backreference": "error",
      "no-useless-catch": "error",
      "no-useless-escape": "error",
      "no-with": "error",
      "require-yield": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
    },
  },
  {
    files: ["src/stories/**/*.js"],
    rules: {
      // Naming starts as a warning so conventions can be tightened incrementally.
      "id-match": [
        "warn",
        SNAKE_CASE_OR_CONSTANT_PATTERN,
        {
          onlyDeclarations: true,
          properties: false,
        },
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "Program > VariableDeclaration[kind='const'] > VariableDeclarator[id.type='Identifier'][id.name!=/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+$/]",
          message:
            "Top-level Storybook constants must use SCREAMING_SNAKE_CASE",
        },
      ],
    },
  },
]);
