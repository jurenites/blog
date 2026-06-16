// Foundations: color abstraction layers, rendered from the generated token map.
import token_map from "../../../generated/tokens/tokens.flat.json";
import abstraction_template from "./color-abstraction.template.html?raw";
import token_card_template from "./color-token-card.template.html?raw";
import element_card_template from "./color-element-card.template.html?raw";
import { escape_html, render_template } from "../template.js";

const semantic_groups = ["palette"];
const system_groups = ["surface", "text", "action", "border"];

const element_examples = [
  {
    element_label: "Page background",
    token_label: "--color-surface-page-default",
    element_style:
      "background: var(--color-surface-page-default); color: var(--color-text-primary-default);",
  },
  {
    element_label: "Panel surface",
    token_label: "--color-surface-panel-default",
    element_style:
      "background: var(--color-surface-panel-default); color: var(--color-text-primary-default);",
  },
  {
    element_label: "Raised surface",
    token_label: "--color-surface-panel-raised",
    element_style:
      "background: var(--color-surface-panel-raised); color: var(--color-text-primary-default);",
  },
  {
    element_label: "Primary action",
    token_label: "--color-action-primary-default",
    element_style:
      "background: var(--color-action-primary-default); color: var(--color-text-inverse-default);",
  },
  {
    element_label: "Secondary action",
    token_label: "--color-action-secondary-default",
    element_style:
      "background: var(--color-action-secondary-default); color: var(--color-text-primary-default);",
  },
  {
    element_label: "Success badge",
    token_label: "--color-palette-success",
    element_style: "background: var(--color-palette-success); color: var(--color-text-inverse-default);",
  },
  {
    element_label: "Warning badge",
    token_label: "--color-palette-warning",
    element_style: "background: var(--color-palette-warning); color: var(--color-text-inverse-default);",
  },
  {
    element_label: "Error badge",
    token_label: "--color-palette-error",
    element_style: "background: var(--color-palette-error); color: var(--color-text-inverse-default);",
  },
];

function color_tokens(group_names) {
  return Object.entries(token_map)
    .filter(
      ([token_name, token_data]) =>
        token_data.type === "color" && token_name.startsWith("color-") && group_names.includes(token_data.path[1]),
    )
    .map(([token_name, token_data]) => ({ token_name, token_value: token_data.css }));
}

function token_card_markup({ token_name, token_value }) {
  return render_template(token_card_template, {
    token_label: escape_html(`--${token_name}`),
    color_value: escape_html(token_value),
  });
}

function element_card_markup(element_data) {
  return render_template(element_card_template, {
    element_label: escape_html(element_data.element_label),
    token_label: escape_html(element_data.token_label),
    element_style: escape_html(element_data.element_style),
  });
}

function render_abstraction_story() {
  return render_template(abstraction_template, {
    semantic_colors: color_tokens(semantic_groups).map(token_card_markup).join(""),
    system_colors: color_tokens(system_groups).map(token_card_markup).join(""),
    element_colors: element_examples.map(element_card_markup).join(""),
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
