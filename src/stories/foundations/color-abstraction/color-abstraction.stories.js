// Foundations: color abstraction layers, rendered from the generated token map.
import abstraction_template from "./color-abstraction.template.html?raw";
import { color_block_markup } from "../../internal/color-block/color-block.markup.js";
import { render_template } from "../../template.js";
import { color_group, token_names, token_value } from "../token-values.js";

const PRIMITIVE_GROUPS = ["palette"];
const SYSTEM_GROUPS = ["surface", "text", "action", "border"];

function color_tokens(group_names) {
  return token_names("color-")
    .filter((token_name) => group_names.includes(color_group(token_name)))
    .map((token_name) => ({ token_name, token_value: token_value(token_name) }));
}

function token_card_markup({ token_name, token_value }) {
  return `<li>${color_block_markup({
    background_token_name: token_name,
    chip_size: "compact",
    primary_text: token_name.replace(/^color-/, "").split("-").join(" "),
    secondary_text: `--${token_name}`,
    tertiary_text: token_value,
  })}</li>`;
}

function element_card_markup(element_data) {
  return color_block_markup({
    background_token_name: element_data.background_token,
    foreground_token_name: element_data.foreground_token,
    chip_size: "compact",
    primary_text: element_data.element_label,
    secondary_text: element_data.token_label,
  });
}

function element_color_cards() {
  return token_names("color-")
    .filter((token_name) => ["surface", "action"].includes(color_group(token_name)))
    .map((token_name) => ({
      element_label: token_name.replace(/^color-/, "").split("-").join(" "),
      token_label: `--${token_name}`,
      background_token: token_name,
      foreground_token: token_name.includes("action-primary") ? "color-text-inverse-default" : "color-text-primary-default",
    }));
}

function render_abstraction_story() {
  return render_template(abstraction_template, {
    primitive_colors: color_tokens(PRIMITIVE_GROUPS).map(token_card_markup).join(""),
    system_colors: color_tokens(SYSTEM_GROUPS).map(token_card_markup).join(""),
    element_colors: element_color_cards().map(element_card_markup).join(""),
  });
}

export default {
  title: "Foundations/Colors/Abstraction Levels",
  tags: ["autodocs"],
};

export const default_story = {
  name: "Default story",
  render: render_abstraction_story,
};
