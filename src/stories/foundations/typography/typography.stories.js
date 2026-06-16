// Foundations: Material M2 type scale, driven by the typography role tokens.
import typography_template from "./typography.template.html?raw";
import type_row_template from "./type-row.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value, typography_role_names } from "../token-values.js";

const COLOR_OPTIONS = token_names("color-");
const DEFAULT_TEXT_COLOR = COLOR_OPTIONS.includes("color-text-primary-default")
  ? "color-text-primary-default"
  : COLOR_OPTIONS[0] || "color-text-primary-default";
const TEXT_COLOR = DEFAULT_TEXT_COLOR;

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

function row_markup(role_name, text_color) {
  const size_value = format_size_px(token_value(`typography-${role_name}-font-size`));
  return render_template(type_row_template, {
    sample_class: escape_html(`u-typography-${role_name} u-color-${text_color}`),
    sample: escape_html(`${role_name} - The quick brown fox`),
    meta: escape_html(`${role_name} / ${size_value}`),
  });
}

function render_story(story_args) {
  const selected_color = COLOR_OPTIONS.includes(story_args.text_color) ? story_args.text_color : DEFAULT_TEXT_COLOR;
  return render_template(typography_template, {
    rows: typography_role_names().map((role_name) => row_markup(role_name, selected_color)).join(""),
  });
}

export default {
  title: "Foundations/Typography",
  tags: ["autodocs"],
  argTypes: {
    text_color: { control: { type: "select" }, options: COLOR_OPTIONS },
  },
};

export const default_story = {
  name: "Default story",
  args: {
    text_color: TEXT_COLOR,
  },
  render: render_story,
};
