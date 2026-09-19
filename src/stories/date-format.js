import { token_names, token_value } from "./foundations/token-values.js";

function date_display_options(display_variant) {
  const token_prefix = `component-date-time-value-format-${display_variant}-`;

  return Object.fromEntries(token_names(token_prefix).map((token_name) => [
    token_name.replace(token_prefix, ""),
    token_value(token_name),
  ]));
}

export function normalized_iso_date(source_date) {
  const parsed_date = source_date instanceof Date
    ? source_date
    : new Date(source_date);

  return Number.isNaN(parsed_date.getTime()) ? String(source_date ?? "") : parsed_date.toISOString();
}

export function formatted_date_display(source_date, display_variant) {
  const parsed_date = new Date(source_date);

  if (Number.isNaN(parsed_date.getTime())) {
    return String(source_date ?? "");
  }

  const display_locale = token_value("component-date-time-value-locale-default");

  return new Intl.DateTimeFormat(display_locale, date_display_options(display_variant)).format(parsed_date);
}

export { formatted_time_since } from "../slice/src/js/elapsed-time-format.js";
