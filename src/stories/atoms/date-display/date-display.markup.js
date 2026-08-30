import date_display_template from "./date-display.template.html?raw";
import date_display_time_since_template from "./date-display-time-since.template.html?raw";
import { formatted_date_display, formatted_time_since, normalized_iso_date } from "../../date-format.js";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";
import { numeric_text_markup } from "../../numeric-text.js";

export function date_display_markup({
  source_date,
  value_mode = token_value("component-date-display-default-mode"),
  display_variant = token_value("component-date-display-default-display"),
  unit_labels,
}) {
  const date_iso_value = normalized_iso_date(source_date);
  const is_time_since_mode = value_mode === "time-since";

  return render_template(is_time_since_mode ? date_display_time_since_template : date_display_template, {
    date_iso: escape_html(date_iso_value),
    value_mode: escape_html(value_mode),
    display_variant: escape_html(display_variant),
    formatted_value: numeric_text_markup(is_time_since_mode
      ? formatted_time_since(source_date, unit_labels)
      : formatted_date_display(source_date, display_variant)),
  });
}
