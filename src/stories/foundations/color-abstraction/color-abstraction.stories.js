// Foundations: color abstraction layers, rendered from the generated token map.
import abstraction_template from "./color-abstraction.template.html?raw";
import token_card_template from "./color-token-card.template.html?raw";
import element_card_template from "./color-element-card.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { color_group, token_names, token_value } from "../token-values.js";

const SEMANTIC_GROUPS = ["palette"];
const SYSTEM_GROUPS = ["surface", "text", "action", "border"];

function color_tokens(group_names) {
  return token_names("color-")
    .filter((token_name) => group_names.includes(color_group(token_name)))
    .map((token_name) => ({ token_name, token_value: token_value(token_name) }));
}

function token_card_markup({ token_name, token_value }) {
  return render_template(token_card_template, {
    token_label: escape_html(`--${token_name}`),
    color_value: escape_html(token_value),
    color_class: escape_html(`u-bg-${token_name}`),
  });
}

function element_card_markup(element_data) {
  return render_template(element_card_template, {
    element_label: escape_html(element_data.element_label),
    token_label: escape_html(element_data.token_label),
    background_class: escape_html(`u-bg-${element_data.background_token}`),
    foreground_class: escape_html(`u-color-${element_data.foreground_token}`),
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
    semantic_colors: color_tokens(SEMANTIC_GROUPS).map(token_card_markup).join(""),
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
