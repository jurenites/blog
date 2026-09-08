import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const COOKBOOK_INSTALL_SOURCE = readFileSync(
  "web/modules/custom/jurenites_cookbook/jurenites_cookbook.install",
  "utf8",
);
const COOKBOOK_RECIPE_SOURCE = readFileSync(
  "recipes/jurenites_cookbook/recipe.yml",
  "utf8",
);
const FONT_PROJECT_SOURCE = readFileSync(
  "web/modules/custom/jurenites_font_projects/jurenites_font_projects.module",
  "utf8",
);

test("Cookbook is an editable published Basic Page with a stable alias", () => {
  assert.match(COOKBOOK_INSTALL_SOURCE, /'type' => 'page'/);
  assert.match(COOKBOOK_INSTALL_SOURCE, /'title' => 'Cookbook'/);
  assert.match(COOKBOOK_INSTALL_SOURCE, /'format' => 'basic_html'/);
  assert.match(COOKBOOK_INSTALL_SOURCE, /'alias' => '\/cookbook'/);
  assert.match(COOKBOOK_INSTALL_SOURCE, /'status' => TRUE/);
});

test("Cookbook starter copy documents the real project workflow and media slots", () => {
  for (const expected_copy of [
    "src/token/tokens.yaml",
    "Storybook",
    "Drupal",
    "DEV",
    "STAGE",
    "PROD",
    "IMAGE PLACEHOLDER",
    "GIF PLACEHOLDER",
  ]) {
    assert.match(COOKBOOK_INSTALL_SOURCE, new RegExp(expected_copy));
  }
});

test("Cookbook follows Privacy Policy and Fonts remains after Cookbook", () => {
  assert.match(
    COOKBOOK_INSTALL_SOURCE,
    /\$cookbook_footer_link->set\('weight', 1\)/,
  );
  assert.match(
    COOKBOOK_INSTALL_SOURCE,
    /\$font_footer_link->set\('weight', 2\)/,
  );
  assert.match(
    FONT_PROJECT_SOURCE,
    /\$font_footer_link->set\('weight', 2\)/,
  );
});

test("Cookbook recipe enables the project-owned module", () => {
  assert.match(COOKBOOK_RECIPE_SOURCE, /install:\s+- jurenites_cookbook/);
});
