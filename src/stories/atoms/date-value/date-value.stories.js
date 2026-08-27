// Atom: Date Value. Use Controls for common date/day formats or raw time text.
import { date_value_markup, date_value_raw_markup } from "./date-value.markup.js";
import { token_value } from "../../foundations/token-values.js";

const VALUE_MODE = token_value("component-date-value-default-mode");
const SOURCE_DATE = "2026-06-15";
const FORMAT_VARIANT = token_value("component-date-value-default-format");
const RAW_VALUE = "6 minutes";
const DISPLAY_VARIANT = token_value("component-date-value-default-display");

const VALUE_MODE_OPTIONS = ["date-value", "raw-text"];
const FORMAT_VARIANT_OPTIONS = ["month-day-year", "long-date", "iso-date"];
const DISPLAY_VARIANT_OPTIONS = ["muted", "day", "time"];

function render_story({ value_mode, source_date, format_variant, raw_value, display_variant }) {
  const raw_text_mode = VALUE_MODE_OPTIONS[1];
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
      options: VALUE_MODE_OPTIONS,
    },
    source_date: { control: "date" },
    format_variant: {
      control: { type: "select" },
      options: FORMAT_VARIANT_OPTIONS,
    },
    raw_value: { control: "text" },
    display_variant: {
      description: "Display enum for date value color/typography treatment.",
      control: { type: "inline-radio" },
      options: DISPLAY_VARIANT_OPTIONS,
      type: {
        name: "enum",
        value: DISPLAY_VARIANT_OPTIONS,
      },
      table: {
        type: {
          summary: DISPLAY_VARIANT_OPTIONS.map((option_name) => `"${option_name}"`).join(" | "),
        },
      },
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
