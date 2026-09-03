import consumption_time_template from "./consumption-time.template.html?raw";
import { numeric_text_markup } from "../../numeric-text.js";
import { escape_html, render_template } from "../../template.js";

export function consumption_time_markup({
  consumption_time_minutes,
  consumption_time_label,
}) {
  const normalized_time_minutes = Math.trunc(Number(consumption_time_minutes));
  const normalized_time_label = String(consumption_time_label ?? "").trim();

  if (normalized_time_minutes < 1 || !normalized_time_label) {
    return "";
  }

  const consumption_label_words = normalized_time_label.split(/\s+/);
  const consumption_unit_text = consumption_label_words.shift() ?? "";
  const consumption_description_text = consumption_label_words.join(" ");

  return render_template(consumption_time_template, {
    minutes_markup: numeric_text_markup(normalized_time_minutes),
    unit_text: escape_html(consumption_unit_text),
    description_text: consumption_description_text
      ? ` ${escape_html(consumption_description_text)}`
      : "",
  });
}
