// Atom: Badge. Neutral-tone label; color variant via Controls.
import { badge_markup } from "./badge.markup.js";
import { token_value } from "../../foundations/token-values.js";

const BADGE_LABEL = "Published";
const COLOR_VARIANT = token_value("component-badge-default-variant");
const COLOR_VARIANT_OPTIONS = ["neutral", "gray", "white"];

function render_badge_story({ badge_label, color_variant }) {
  return badge_markup({ badge_label, color_variant });
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
