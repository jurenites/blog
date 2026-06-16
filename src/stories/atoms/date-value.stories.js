// Atom: Date Value. Use Controls for common date/day formats or raw time text.
import date_value_template from "./date-value.template.html?raw";
import date_value_raw_template from "./date-value-raw.template.html?raw";
import { date_format_options, formatted_date_value, normalized_iso_date } from "../date-format.js";
import { escape_html, render_template } from "../template.js";

function render_story({ value_mode, source_date, format_variant, raw_value, display_variant }) {
  if (value_mode === "raw_text") {
    return render_template(date_value_raw_template, {
      display_variant,
      raw_value: escape_html(raw_value),
    });
  }

  const iso_date_value = normalized_iso_date(source_date);

  return render_template(date_value_template, {
    date_iso: escape_html(iso_date_value),
    display_variant,
    formatted_value: escape_html(formatted_date_value(iso_date_value, format_variant)),
  });
}

export default {
  title: "Atoms/Date Value",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    value_mode: {
      control: { type: "inline-radio" },
      options: ["date_value", "raw_text"],
    },
    source_date: { control: "date" },
    format_variant: {
      control: { type: "select" },
      options: date_format_options,
    },
    raw_value: { control: "text" },
    display_variant: {
      control: { type: "inline-radio" },
      options: ["muted", "day", "time"],
    },
  },
  args: {
    value_mode: "date_value",
    source_date: "2026-06-15",
    format_variant: "month_year",
    raw_value: "6 minutes",
    display_variant: "muted",
  },
};

export const default_story = {};
