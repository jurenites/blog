import date_value_template from "./date-value.template.html?raw";
import date_value_raw_template from "./date-value-raw.template.html?raw";
import { formatted_date_value, normalized_iso_date } from "../../date-format.js";
import { token_default_option } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function date_value_markup({
  source_date,
  format_variant = token_default_option("component-date-value-default-format", "component-date-value-format-"),
  display_variant = token_default_option("component-date-value-default-display", "component-date-value-display-"),
}) {
  const iso_date_value = normalized_iso_date(source_date);

  return render_template(date_value_template, {
    date_iso: escape_html(iso_date_value),
    display_variant: escape_html(display_variant),
    formatted_value: escape_html(formatted_date_value(iso_date_value, format_variant)),
  });
}

export function date_value_raw_markup({
  raw_value,
  display_variant = token_default_option("component-date-value-default-display", "component-date-value-display-"),
}) {
  return render_template(date_value_raw_template, {
    display_variant: escape_html(display_variant),
    raw_value: escape_html(raw_value),
  });
}
