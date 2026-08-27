// Foundations: concise CSS font shorthand roles from the token source.
import typography_template from "./typography.template.html?raw";
import type_row_template from "./type-row.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value, typography_role_names } from "../token-values.js";

const COLOR_OPTIONS = token_names("theme-dark-");
const DEFAULT_TEXT_COLOR = COLOR_OPTIONS.includes("theme-dark-text-primary-default")
  ? "theme-dark-text-primary-default"
  : COLOR_OPTIONS[0] || "theme-dark-text-primary-default";
const TEXT_COLOR = DEFAULT_TEXT_COLOR;

function row_markup(role_name, text_color) {
  const font_shorthand = token_value(`typography-${role_name}`);
  return render_template(type_row_template, {
    sample_class: escape_html(`u-typography-${role_name} u-color-${text_color}`),
    sample: escape_html(`${role_name} - The quick brown fox`),
    meta: escape_html(`${role_name} / ${font_shorthand}`),
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
