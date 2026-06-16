// Atom: Date Value. Use Controls for common date/day formats or raw time text.
import { date_value_markup, date_value_raw_markup } from "./date-value.markup.js";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";

const VALUE_MODE = token_default_option("component-date-value-default-mode", "component-date-value-mode-");
const SOURCE_DATE = "2026-06-15";
const FORMAT_VARIANT = token_default_option("component-date-value-default-format", "component-date-value-format-");
const RAW_VALUE = "6 minutes";
const DISPLAY_VARIANT = token_default_option("component-date-value-default-display", "component-date-value-display-");

const value_mode_options = token_option_names("component-date-value-mode-");
const format_variant_options = token_option_names("component-date-value-format-");
const display_variant_options = token_option_names("component-date-value-display-");

function render_story({ value_mode, source_date, format_variant, raw_value, display_variant }) {
  const raw_text_mode = value_mode_options[1];
  if (value_mode === raw_text_mode) {
    return date_value_raw_markup({
      display_variant,
      raw_value,
    });
  }

  return date_value_markup({
    source_date,
    format_variant,
    display_variant,
  });
}

export default {
  title: "Atoms/Date Value",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    value_mode: {
      control: { type: "inline-radio" },
      options: value_mode_options,
    },
    source_date: { control: "date" },
    format_variant: {
      control: { type: "select" },
      options: format_variant_options,
    },
    raw_value: { control: "text" },
    display_variant: {
      control: { type: "inline-radio" },
      options: display_variant_options,
    },
  },
  args: {
    value_mode: VALUE_MODE,
    source_date: SOURCE_DATE,
    format_variant: FORMAT_VARIANT,
    raw_value: RAW_VALUE,
    display_variant: DISPLAY_VARIANT,
  },
};

export const default_story = {};
