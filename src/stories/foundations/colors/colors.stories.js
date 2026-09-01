// Foundations: color tokens, rendered from the CSS variables generated from src/token/tokens.yaml.
import colors_template from "./colors.template.html?raw";
import { color_block_markup } from "../../internal/color-block/color-block.markup.js";
import { render_template } from "../../template.js";
import { token_description, token_names, token_value } from "../token-values.js";

function color_tokens() {
  return token_names("color-palette-").map((token_name) => ({
    token_description: token_description(token_name),
    token_name,
    token_value: token_value(token_name),
  }));
}

function swatch_markup({ token_description: color_description, token_name, token_value }) {
  return color_block_markup({
    background_token_name: token_name,
    primary_text: color_description || token_name.replace("color-palette-", ""),
    secondary_text: token_value,
    tertiary_text: `--${token_name}`,
  });
}

function render_story() {
  return render_template(colors_template, {
    swatches: color_tokens().map(swatch_markup).join(""),
  });
}

export default {
  title: "Foundations/Colors/Palette",
  tags: ["autodocs"],
};

export const default_story = {
  name: "Default story",
  render: render_story,
};
