import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PIXEL_CELL_COUNT,
  create_blank_pixel_pattern,
  update_pixel_cell,
} from "../src/slice/src/js/pixel-glyph-editor-data.js";

const EDITOR_BEHAVIOR_SOURCE = readFileSync(
  "src/slice/src/js/pixel-glyph-editor.js",
  "utf8",
);
const EDITOR_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/organisms/_pixel-glyph-editor.scss",
  "utf8",
);
const FONT_PREVIEW_STYLES_SOURCE = readFileSync(
  "src/slice/src/scss/organisms/_font-preview.scss",
  "utf8",
);
const EDITOR_MARKUP_SOURCE = readFileSync(
  "src/stories/organisms/pixel-glyph-editor/pixel-glyph-editor.markup.js",
  "utf8",
);
const FOUR_PIXEL_STORY_SOURCE = readFileSync(
  "src/stories/organisms/font-preview-4pixel/font-preview-4pixel.stories.js",
  "utf8",
);
const FONT_PREVIEW_TEMPLATE_PATHS = [
  "src/stories/organisms/font-preview/font-preview.template.html",
  "web/themes/custom/jurenites_theme/templates/paragraph/paragraph--font-preview.html.twig",
];
const THEME_PREPROCESS_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/jurenites_theme.theme",
  "utf8",
);
const PROJECT_TEMPLATE_SOURCE = readFileSync(
  "web/themes/custom/jurenites_theme/templates/content/node--project.html.twig",
  "utf8",
);
const EDITOR_TEMPLATE_PATHS = [
  "src/stories/organisms/pixel-glyph-editor/pixel-glyph-editor.template.html",
  "web/themes/custom/jurenites_theme/templates/paragraph/paragraph--pixel-glyph-editor.html.twig",
];

test("the editor always starts as a blank 4 by 4 pattern", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(PIXEL_CELL_COUNT, 16);
  assert.equal(blank_pattern.length, PIXEL_CELL_COUNT);
  assert.equal(blank_pattern.every((cell_value) => cell_value === false), true);
});

test("filling and erasing is immutable and deterministic", () => {
  const blank_pattern = create_blank_pixel_pattern();
  const filled_pattern = update_pixel_cell(blank_pattern, 12, true);
  const erased_pattern = update_pixel_cell(filled_pattern, 12, false);
  assert.equal(blank_pattern[12], false);
  assert.equal(filled_pattern[12], true);
  assert.equal(erased_pattern[12], false);
});

test("out of range cell updates leave the pattern unchanged", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(update_pixel_cell(blank_pattern, 16, true), blank_pattern);
});

test("Storybook and Drupal render the adjacent live glyph tile", () => {
  EDITOR_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");
    assert.match(template_source, /pixel-glyph-editor__workspace/);
    assert.match(template_source, /font-preview__glyph-tile pixel-glyph-editor__glyph-preview/);
  });
  assert.match(EDITOR_MARKUP_SOURCE, /data-pixel-preview-cell/);
  assert.match(
    readFileSync(EDITOR_TEMPLATE_PATHS[1], "utf8"),
    /data-pixel-preview-cell/,
  );
});

test("4pixel composes one editor immediately before Font Preview Data", () => {
  FONT_PREVIEW_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");
    const editor_slot_index = template_source.indexOf("before_data_content");
    const data_section_index = template_source.indexOf("font-preview__data");

    assert.ok(editor_slot_index >= 0);
    assert.ok(editor_slot_index < data_section_index);
  });

  assert.match(
    FOUR_PIXEL_STORY_SOURCE,
    /before_data_content: pixel_glyph_editor_markup\(/,
  );
  assert.equal(
    FOUR_PIXEL_STORY_SOURCE.match(/pixel_glyph_editor_markup\(/g)?.length,
    1,
  );
  assert.match(THEME_PREPROCESS_SOURCE, /#pixel_editor_before_data/);
  assert.match(THEME_PREPROCESS_SOURCE, /unset\(\$section_builds\[\$editor_delta\]\)/);
});

test("font Projects move the body after structured sections", () => {
  assert.match(
    THEME_PREPROCESS_SOURCE,
    /jurenites_theme_project_has_font_identifier\(\$node_variables, '4pixel'\)/,
  );
  assert.match(
    THEME_PREPROCESS_SOURCE,
    /jurenites_theme_project_has_font_identifier\(\$node_variables, 'roundabout'\)/,
  );
  assert.match(
    THEME_PREPROCESS_SOURCE,
    /field_font_identifier[\s\S]*=== \$font_identifier/,
  );
  assert.match(
    PROJECT_TEMPLATE_SOURCE,
    /if not body_after_sections[\s\S]*project-detail__introduction[\s\S]*endif[\s\S]*project-detail__sections[\s\S]*if body_after_sections[\s\S]*project-detail__introduction[\s\S]*project-detail__tags/,
  );
});

test("the editor mirrors every pixel state into the live glyph tile", () => {
  assert.match(EDITOR_BEHAVIOR_SOURCE, /preview_cells\[cell_index\]\?\.classList\.toggle/);
  assert.match(EDITOR_BEHAVIOR_SOURCE, /"is-filled", is_filled/);
});

test("glyph tiles and the live preview use the requested palette tokens", () => {
  assert.match(
    FONT_PREVIEW_STYLES_SOURCE,
    /\.font-preview__glyph-tile[\s\S]*background-color: var\(--color-palette-dark-black\)/,
  );
  assert.match(
    EDITOR_STYLES_SOURCE,
    /\.pixel-glyph-editor__glyph-preview-cell\.is-filled[\s\S]*var\(--color-palette-dark-white\)/,
  );
});
