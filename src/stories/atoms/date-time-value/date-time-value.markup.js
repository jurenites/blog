import date_time_value_date_template from "./date-time-value-date.template.html?raw";
import date_time_value_duration_template from "./date-time-value-duration.template.html?raw";
import { formatted_date_display, formatted_time_since, normalized_iso_date } from "../../date-format.js";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

function duration_value_markup(duration_minutes, duration_label) {
  const normalized_duration_minutes = Math.trunc(Number(duration_minutes));
  const normalized_duration_label = String(duration_label ?? "").trim();

  if (normalized_duration_minutes < 1 || !normalized_duration_label) {
    return "";
  }

  const duration_label_words = normalized_duration_label.split(/\s+/);
  const duration_unit_text = duration_label_words.shift() ?? "";
  const duration_description_text = duration_label_words.join(" ");

  return render_template(date_time_value_duration_template, {
    duration_minutes: escape_html(normalized_duration_minutes),
    minutes_markup: escape_html(normalized_duration_minutes),
    unit_text: escape_html(duration_unit_text),
    description_text: duration_description_text
      ? ` ${escape_html(duration_description_text)}`
      : "",
  });
}

function date_value_markup({
  value_kind,
  source_date,
  date_display_variant,
  unit_labels,
  relative_suffix,
  exact_date_title,
}) {
  const machine_value = normalized_iso_date(source_date);
  const formatted_date_value = value_kind === "elapsed-time"
    ? formatted_time_since(source_date, unit_labels)
    : formatted_date_display(source_date, date_display_variant);
  const displayed_date_value = value_kind === "elapsed-time" && relative_suffix
    ? `${formatted_date_value} ${relative_suffix}`
    : formatted_date_value;

  return render_template(date_time_value_date_template, {
    value_kind: escape_html(value_kind),
    date_display_variant: escape_html(date_display_variant),
    machine_value: escape_html(machine_value),
    exact_date_title: exact_date_title
      ? ` title="${escape_html(exact_date_title)}"`
      : "",
    formatted_value: escape_html(displayed_date_value),
  });
}

export function date_time_value_markup({
  value_kind = token_value("component-date-time-value-default-kind"),
  source_date,
  date_display_variant = token_value("component-date-time-value-default-date-display"),
  unit_labels,
  relative_suffix = "",
  exact_date_title = "",
  duration_minutes,
  duration_label,
}) {
  if (value_kind === "duration") {
    return duration_value_markup(duration_minutes, duration_label);
  }

  return date_value_markup({
    value_kind,
    source_date,
    date_display_variant,
    unit_labels,
    relative_suffix,
    exact_date_title,
  });
}
