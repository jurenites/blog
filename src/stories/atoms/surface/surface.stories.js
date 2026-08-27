// Atom: Surface (panel/card container). Use Controls for the variant.
import surface_template from "./surface.template.html?raw";
import { button_markup } from "../button/button.markup.js";
import { chip_markup } from "../chip/chip.markup.js";
import { date_value_markup } from "../date-value/date-value.markup.js";
import { token_option_names, token_value } from "../../foundations/token-values.js";
import { render_template } from "../../template.js";

const SURFACE_VARIANT = token_value("component-surface-default-variant");
const NESTED_COMPONENT = "button_group";

const SURFACE_VARIANT_OPTIONS = ["default", "raised", "flat"];
const STYLE_VARIANT_OPTIONS = token_option_names("component-button-style-");

const NESTED_RENDERERS = {
  button_group: () => `
    <div class="storybook-stack">
      ${button_markup({ button_label: "Contact me", style_variant: STYLE_VARIANT_OPTIONS[0] })}
      ${button_markup({ button_label: "View project", style_variant: STYLE_VARIANT_OPTIONS[1] })}
    </div>
  `,
  chip_group: () => `
    <div class="storybook-stack">
      ${chip_markup({ chip_label: "ui/ux" })}
      ${chip_markup({ chip_label: "Design system", is_accent: true })}
    </div>
  `,
  date_value: () => date_value_markup({
    source_date: "2026-06-15",
    format_variant: token_value("component-date-value-default-format"),
    display_variant: token_value("component-date-value-default-display"),
  }),
};

function render_story({ surface_variant, nested_component }) {
  const default_surface_variant = token_value("component-surface-default-variant");
  const surface_class_name = surface_variant === default_surface_variant ? "surface" : `surface surface--${surface_variant}`;
  return render_template(surface_template, {
    surface_class_name,
    nested_content: NESTED_RENDERERS[nested_component](),
  });
}

export default {
  title: "Atoms/Surface",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    surface_variant: {
      control: { type: "inline-radio" },
      options: SURFACE_VARIANT_OPTIONS,
    },
    nested_component: {
      control: { type: "select" },
      options: Object.keys(NESTED_RENDERERS),
    },
  },
  args: {
    surface_variant: SURFACE_VARIANT,
    nested_component: NESTED_COMPONENT,
  },
};

export const default_story = {};
