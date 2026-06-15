// Atom: Button. One story; use the Controls tab for every variant combination.
import button_template from "./button.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ button_label, style_variant, is_disabled }) {
  return render_template(button_template, {
    label: escape_html(button_label),
    variant: style_variant,
    disabled: is_disabled ? " disabled" : "",
  });
}

export default {
  title: "Atoms/Button",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    button_label: { control: "text" },
    style_variant: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary", "ghost"],
    },
    is_disabled: { control: "boolean" },
  },
  args: {
    button_label: "Hire me",
    style_variant: "primary",
    is_disabled: false,
  },
};

export const default_story = {};
