// Atom: Badge. Neutral-tone label; color variant via Controls.
import { badge_markup } from "./badge.markup.js";
import { token_value } from "../../foundations/token-values.js";

const BADGE_LABEL = "Published";
const NUMERIC_LABEL = "2";
const NUMERIC_STYLE = false;
const COLOR_VARIANT = token_value("component-badge-default-variant");
const COLOR_VARIANT_OPTIONS = ["neutral", "gray", "white"];

function render_badge_story({ badge_label, color_variant, numeric_style }) {
  return badge_markup({ badge_label, color_variant, numeric_style });
}

export default {
  title: "Atoms/Badge",
  tags: ["autodocs"],
  render: render_badge_story,
  argTypes: {
    badge_label: { control: "text" },
    numeric_style: { control: "boolean" },
    color_variant: {
      control: { type: "inline-radio" },
      options: COLOR_VARIANT_OPTIONS,
    },
  },
  args: {
    badge_label: BADGE_LABEL,
    numeric_style: NUMERIC_STYLE,
    color_variant: COLOR_VARIANT,
  },
};

export const default_story = {};

export const numeric_badge = {
  args: { badge_label: NUMERIC_LABEL, numeric_style: true },
};
