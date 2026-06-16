// Foundations: color tokens, rendered from the CSS variables generated from src/token/tokens.yaml.
import colors_template from "./colors.template.html?raw";
import swatch_template from "./color-swatch.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value } from "../token-values.js";

function color_tokens() {
  return token_names("color-").map((token_name) => ({ token_name, token_value: token_value(token_name) }));
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
    color_class: escape_html(`u-bg-${token_name}`),
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
