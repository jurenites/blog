// Foundations: color tokens, rendered straight from generated/tokens/tokens.flat.json so this page
// always matches the single source of truth.
import token_map from "../../../generated/tokens/tokens.flat.json";
import colors_template from "./colors.template.html?raw";
import swatch_template from "./color-swatch.template.html?raw";
import { escape_html, render_template } from "../template.js";

function color_tokens() {
  return Object.entries(token_map)
    .filter(([token_name, token_data]) => token_data.type === "color" && token_name.startsWith("color-"))
    .map(([token_name, token_data]) => ({ token_name, token_value: token_data.css }));
}

function group_title(token_name) {
  const name_parts = token_name.split("-");
  return `${name_parts[1]} / ${name_parts.slice(2).join("-")}`;
}

function swatch_markup({ token_name, token_value }) {
  return render_template(swatch_template, {
    name: escape_html(group_title(token_name)),
    value: escape_html(token_value),
    variable: escape_html(token_name),
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
