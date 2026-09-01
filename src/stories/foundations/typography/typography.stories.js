import typography_template from "./typography.template.html?raw";
import type_row_template from "./type-row.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { token_names, token_value, typography_role_names } from "../token-values.js";

const COLOR_OPTIONS = token_names("theme-dark-");
const DEFAULT_TEXT_COLOR = COLOR_OPTIONS.includes("theme-dark-text-primary-default")
  ? "theme-dark-text-primary-default"
  : COLOR_OPTIONS[0] || "theme-dark-text-primary-default";
const TEXT_COLOR = DEFAULT_TEXT_COLOR;

function typography_sample_text(role_name) {
  switch (role_name) {
    case "headline-1":
      return "Systems & craft";
    case "overline":
      return "v0.1.10 · build";
    case "numeric-display":
      return "80+ · 16 years · 2010";
    default:
      return "A personal journal about systems and craft";
  }
}

function typography_row_markup(role_name, text_color) {
  const token_name = `typography-${role_name}`;

  return render_template(type_row_template, {
    role_name: escape_html(role_name),
    token_name: escape_html(token_name),
    sample_class: escape_html(`u-typography-${role_name} u-color-${text_color}`),
    sample_text: escape_html(typography_sample_text(role_name)),
    font_shorthand: escape_html(token_value(token_name)),
  });
}

function render_story(story_args) {
  const selected_color = COLOR_OPTIONS.includes(story_args.text_color) ? story_args.text_color : DEFAULT_TEXT_COLOR;
  return render_template(typography_template, {
    typography_rows: typography_role_names()
      .map((role_name) => typography_row_markup(role_name, selected_color))
      .join(""),
  });
}

export default {
  title: "Foundations/Fonts/Typography",
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
