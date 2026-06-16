// Foundations: Material M2 type scale, driven by the typography role tokens.
import token_map from "../../../generated/tokens/tokens.flat.json";
import typography_template from "./typography.template.html?raw";
import type_row_template from "./type-row.template.html?raw";
import { escape_html, render_template } from "../template.js";

const typography_roles = [
  "headline-1",
  "headline-2",
  "headline-3",
  "headline-4",
  "headline-5",
  "headline-6",
  "subtitle-1",
  "subtitle-2",
  "body-1",
  "body-2",
  "button-label",
  "caption-default",
  "overline-default",
];

const color_options = Object.entries(token_map)
  .filter(([token_name, token_data]) => token_data.type === "color" && token_name.startsWith("color-"))
  .map(([token_name]) => token_name);
const default_text_color = color_options.includes("color-text-primary-default")
  ? "color-text-primary-default"
  : color_options[0];

function format_size_px(size_value) {
  if (!size_value) {
    return "";
  }
  const size_string = String(size_value).trim();
  if (!size_string.endsWith("rem")) {
    return size_string;
  }
  const numeric_value = Number.parseFloat(size_string);
  if (!Number.isFinite(numeric_value)) {
    return size_string;
  }
  return `${Number.parseFloat((numeric_value * 16).toFixed(4))}px`;
}

function role_style(role_name, text_color) {
  const size_token = token_map[`typography-${role_name}-font-size`];
  const weight_token = token_map[`typography-${role_name}-font-weight`];
  const spacing_token = token_map[`typography-${role_name}-letter-spacing`];
  const line_height_token = token_map[`typography-${role_name}-line-height`];
  const transform_token = token_map[`typography-${role_name}-text-transform`];
  const size_value = format_size_px(size_token ? size_token.css : "1rem");
  const style_declarations = [
    `font-family: var(--typography-${role_name}-font-family)`,
    `font-size: ${size_value}`,
    `font-weight: ${weight_token ? weight_token.css : "400"}`,
    `letter-spacing: ${spacing_token ? spacing_token.css : "0"}`,
    `line-height: ${line_height_token ? line_height_token.css : "1.5"}`,
    `color: var(--${text_color})`,
  ];
  if (transform_token) {
    style_declarations.push(`text-transform: ${transform_token.css}`);
  }
  return style_declarations.join(";");
}

function row_markup(role_name, text_color) {
  const size_token = token_map[`typography-${role_name}-font-size`];
  const size_value = format_size_px(size_token ? size_token.css : "");
  return render_template(type_row_template, {
    style: escape_html(role_style(role_name, text_color)),
    sample: escape_html(`${role_name} - The quick brown fox`),
    meta: escape_html(`${role_name} / ${size_value}`),
  });
}

function render_story(story_args) {
  const selected_color = color_options.includes(story_args.text_color) ? story_args.text_color : default_text_color;
  return render_template(typography_template, {
    rows: typography_roles.map((role_name) => row_markup(role_name, selected_color)).join(""),
  });
}

export default {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  argTypes: {
    text_color: { control: { type: "select" }, options: color_options },
  },
};

export const default_story = {
  name: "Default story",
  args: {
    text_color: default_text_color,
  },
  render: render_story,
};
