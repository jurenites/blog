// Foundations: color abstraction layers, rendered from the generated token map.
import abstraction_template from "./color-abstraction.template.html?raw";
import token_card_template from "./color-token-card.template.html?raw";
import element_card_template from "./color-element-card.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { color_group, token_names, token_value } from "../token-values.js";

const SEMANTIC_GROUPS = ["palette"];
const SYSTEM_GROUPS = ["surface", "text", "action", "border"];

const ELEMENT_CARDS = [
  {
    element_label: "Page background",
    token_label: "--color-surface-page-default",
    background_token: "color-surface-page-default",
    foreground_token: "color-text-primary-default",
  },
  {
    element_label: "Panel surface",
    token_label: "--color-surface-panel-default",
    background_token: "color-surface-panel-default",
    foreground_token: "color-text-primary-default",
  },
  {
    element_label: "Raised surface",
    token_label: "--color-surface-panel-raised",
    background_token: "color-surface-panel-raised",
    foreground_token: "color-text-primary-default",
  },
  {
    element_label: "Primary action",
    token_label: "--color-action-primary-default",
    background_token: "color-action-primary-default",
    foreground_token: "color-text-inverse-default",
  },
  {
    element_label: "Secondary action",
    token_label: "--color-action-secondary-default",
    background_token: "color-action-secondary-default",
    foreground_token: "color-text-primary-default",
  },
  {
    element_label: "Success badge",
    token_label: "--color-palette-success",
    background_token: "color-palette-success",
    foreground_token: "color-text-inverse-default",
  },
  {
    element_label: "Warning badge",
    token_label: "--color-palette-warning",
    background_token: "color-palette-warning",
    foreground_token: "color-text-inverse-default",
  },
  {
    element_label: "Error badge",
    token_label: "--color-palette-error",
    background_token: "color-palette-error",
    foreground_token: "color-text-inverse-default",
  },
];

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

function render_abstraction_story() {
  return render_template(abstraction_template, {
    semantic_colors: color_tokens(SEMANTIC_GROUPS).map(token_card_markup).join(""),
    system_colors: color_tokens(SYSTEM_GROUPS).map(token_card_markup).join(""),
    element_colors: ELEMENT_CARDS.map(element_card_markup).join(""),
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
