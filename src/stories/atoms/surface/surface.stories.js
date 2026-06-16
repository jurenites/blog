// Atom: Surface (panel/card container). Use Controls for the variant.
import surface_template from "./surface.template.html?raw";
import { button_markup } from "../button/button.markup.js";
import { chip_markup } from "../chip/chip.markup.js";
import { date_value_markup } from "../date-value/date-value.markup.js";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";
import { render_template } from "../../template.js";

const SURFACE_VARIANT = token_default_option("component-surface-default-variant", "component-surface-variant-");
const NESTED_COMPONENT = "button_group";

const surface_variant_options = token_option_names("component-surface-variant-");
const style_variant_options = token_option_names("component-button-style-");

const NESTED_RENDERERS = {
  button_group: () => `
    <div class="storybook-stack">
      ${button_markup({ button_label: "Contact me", style_variant: style_variant_options[0] })}
      ${button_markup({ button_label: "View project", style_variant: style_variant_options[1] })}
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
    format_variant: token_default_option("component-date-value-default-format", "component-date-value-format-"),
    display_variant: token_default_option("component-date-value-default-display", "component-date-value-display-"),
  }),
};

function render_story({ surface_variant, nested_component }) {
  const default_surface_variant = token_default_option("component-surface-default-variant", "component-surface-variant-");
  const surface_modifier = surface_variant === default_surface_variant ? "" : ` surface--${surface_variant}`;
  return render_template(surface_template, {
    class_name: surface_modifier,
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
      options: surface_variant_options,
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
