// Foundations: color abstraction layers, rendered from the generated token map.
import abstraction_template from "./color-abstraction.template.html?raw";
import { color_block_markup } from "../../internal/color-block/color-block.markup.js";
import { render_template } from "../../template.js";
import {
  token_css_value,
  token_description,
  token_names,
  token_value,
} from "../token-values.js";

const COMPONENT_COLOR_PREFIXES = ["component-"];

function color_tokens(token_prefixes) {
  return token_prefixes
    .flatMap((token_prefix) => token_names(token_prefix))
    .filter((token_name, token_index, token_list) => (
      token_list.indexOf(token_name) === token_index
      && (!token_name.startsWith("component-") || token_name.includes("-color-"))
    ))
    .map((token_name) => ({
      token_description: token_description(token_name),
      token_name,
      token_value: token_value(token_name),
      token_css_value: token_css_value(token_name),
    }));
}

function token_card_markup({ token_description: color_description, token_name, token_value, token_css_value }) {
  return `<li>${color_block_markup({
    background_token_name: token_name,
    chip_size: "compact",
    primary_text: color_description || token_name.split("-").join(" "),
    secondary_text: `--${token_name}`,
    tertiary_text: token_css_value === token_value
      ? token_value
      : `${token_css_value} → ${token_value}`,
  })}</li>`;
}

function render_abstraction_story() {
  return render_template(abstraction_template, {
    palette_colors: color_tokens(["color-palette-"]).map(token_card_markup).join(""),
    theme_colors: color_tokens(["theme-dark-"]).map(token_card_markup).join(""),
    component_colors: color_tokens(COMPONENT_COLOR_PREFIXES).map(token_card_markup).join(""),
  });
}

export default {
  title: "Foundations/Colors/Abstraction Levels",
  tags: ["!dev", "!autodocs"],
};

export const default_story = {
  name: "Default story",
  render: render_abstraction_story,
};
