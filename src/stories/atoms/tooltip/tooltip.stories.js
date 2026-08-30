// Atom: Tooltip. Contextual text shown from a real hover/focus trigger.
import { button_markup } from "../button/button.markup.js";
import { token_value } from "../../foundations/token-values.js";

const TOOLTIP_LABEL = "Additional information appears here when the text needs to wrap.";
const BUTTON_LABEL = "Hover me";
const COLOR_VARIANT = token_value("component-tooltip-default-variant");
const COLOR_VARIANT_OPTIONS = ["full-black", "black", "light-black"];

function render_tooltip_story({ tooltip_label, color_variant }) {
  return button_markup({
    button_label: BUTTON_LABEL,
    style_variant: "secondary",
    tooltip_label,
    tooltip_color_variant: color_variant,
  });
}

export default {
  title: "Atoms/Tooltip",
  tags: ["autodocs"],
  render: render_tooltip_story,
  argTypes: {
    tooltip_label: { control: "text" },
    color_variant: {
      control: { type: "inline-radio" },
      options: COLOR_VARIANT_OPTIONS,
    },
  },
  args: {
    tooltip_label: TOOLTIP_LABEL,
    color_variant: COLOR_VARIANT,
  },
};

export const default_story = {};
