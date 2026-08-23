// Foundations: color tokens, rendered from the CSS variables generated from src/token/tokens.yaml.
import colors_template from "./colors.template.html?raw";
import { color_block_markup } from "../../internal/color-block/color-block.markup.js";
import { render_template } from "../../template.js";
import { token_names, token_value } from "../token-values.js";

function color_tokens() {
  return token_names("color-").map((token_name) => ({ token_name, token_value: token_value(token_name) }));
}

function group_title(token_name) {
  const name_parts = token_name.split("-");
  return `${name_parts[1]} / ${name_parts.slice(2).join("-")}`;
}

function swatch_markup({ token_name, token_value }) {
  return color_block_markup({
    background_token_name: token_name,
    primary_text: group_title(token_name),
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
