import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const GUIDELINES_MODULE_PATH = "web/modules/custom/jurenites_guidelines";
const GUIDELINES_THEME_PATH = "web/themes/custom/jurenites_theme";

async function read_project_file(file_path) {
  return readFile(new URL(`../${file_path}`, import.meta.url), "utf8");
}

test("Guideline content model exposes an ordered tile view and detail route aliases", async () => {
  const [node_type_config, tile_view_mode_config, guidelines_view_config, installer_source] = await Promise.all([
    read_project_file(`${GUIDELINES_MODULE_PATH}/config/install/node.type.guideline.yml`),
    read_project_file(`${GUIDELINES_MODULE_PATH}/config/install/core.entity_view_mode.node.guideline_tile.yml`),
    read_project_file(`${GUIDELINES_MODULE_PATH}/config/install/views.view.guidelines.yml`),
    read_project_file(`${GUIDELINES_MODULE_PATH}/jurenites_guidelines.install`),
  ]);

  assert.match(node_type_config, /type: guideline/);
  assert.match(tile_view_mode_config, /id: node\.guideline_tile/);
  assert.match(guidelines_view_config, /path: guidelines/);
  assert.match(guidelines_view_config, /field_guideline_order_value/);
  assert.match(installer_source, /\/guidelines\/logo-icon/);
  assert.match(installer_source, /\/guidelines\/color/);
});

test("Guideline visuals use the project logo and generated color-token utilities", async () => {
  const [preprocess_source, tile_template, detail_template, token_styles] = await Promise.all([
    read_project_file(`${GUIDELINES_MODULE_PATH}/jurenites_guidelines.module`),
    read_project_file(`${GUIDELINES_THEME_PATH}/templates/content/node--guideline--guideline-tile.html.twig`),
    read_project_file(`${GUIDELINES_THEME_PATH}/templates/content/node--guideline.html.twig`),
    read_project_file("generated/styles/_tokens.scss"),
  ]);

  assert.match(preprocess_source, /generated\/token\/tokens\.js/);
  assert.match(preprocess_source, /\/logo\.svg/);
  assert.match(tile_template, /guideline-tile__color-preview/);
  assert.match(detail_template, /guideline_color_groups/);
  assert.match(detail_template, /guideline-color-swatch\.html\.twig/);
  assert.match(token_styles, /\.u-bg-color-palette-brand-primary/);
});

test("Guideline templates keep presentational dimensions out of HTML", async () => {
  const guideline_templates = await Promise.all([
    read_project_file(`${GUIDELINES_THEME_PATH}/templates/content/node--guideline--guideline-tile.html.twig`),
    read_project_file(`${GUIDELINES_THEME_PATH}/templates/content/node--guideline.html.twig`),
    read_project_file(`${GUIDELINES_THEME_PATH}/templates/components/guideline-color-swatch.html.twig`),
  ]);

  for (const guideline_template of guideline_templates) {
    assert.doesNotMatch(guideline_template, /\s(?:style|width|height)=/);
  }
});
