// Atom: Badge. Neutral-tone label; color variant via Controls.
import badge_template from "./badge.template.html?raw";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

const BADGE_LABEL = "Published";
const COLOR_VARIANT = token_value("component-badge-default-variant");
const COLOR_VARIANT_OPTIONS = ["neutral", "gray", "white"];

function render_badge_story({ badge_label, color_variant }) {
  const base_color_variant = COLOR_VARIANT_OPTIONS[0];
  const badge_class_name = color_variant === base_color_variant ? "badge" : `badge badge--${color_variant}`;
  return render_template(badge_template, {
    badge_class_name,
    badge_label_text: escape_html(badge_label),
  });
}

export default {
  title: "Atoms/Badge",
  tags: ["autodocs"],
  render: render_badge_story,
  argTypes: {
    badge_label: { control: "text" },
    color_variant: {
      control: { type: "inline-radio" },
      options: COLOR_VARIANT_OPTIONS,
    },
  },
  args: {
    badge_label: BADGE_LABEL,
    color_variant: COLOR_VARIANT,
  },
};

export const default_story = {};
