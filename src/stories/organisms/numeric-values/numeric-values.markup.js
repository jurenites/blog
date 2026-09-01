import numeric_values_template from "./numeric-values.template.html?raw";
import numeric_value_tile_template from "./numeric-value-tile.template.html?raw";
import { escape_html, render_template } from "../../template.js";
import { numeric_text_markup } from "../../numeric-text.js";

export function elapsed_years_value(career_start_year, reference_date = new Date()) {
  const normalized_start_year = Number.parseInt(career_start_year, 10);
  if (!Number.isInteger(normalized_start_year)) {
    return "";
  }

  return String(Math.max(0, reference_date.getFullYear() - normalized_start_year));
}

export function numeric_value_tile_markup({ numeric_number, numeric_description }) {
  return render_template(numeric_value_tile_template, {
    numeric_description: escape_html(numeric_description),
    numeric_number: numeric_text_markup(numeric_number),
  });
}

export function numeric_values_markup({ numeric_items, section_label }) {
  return render_template(numeric_values_template, {
    numeric_items: numeric_items.map(numeric_value_tile_markup).join(""),
    section_label: escape_html(section_label),
  });
}
