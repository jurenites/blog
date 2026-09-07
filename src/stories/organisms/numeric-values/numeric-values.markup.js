import numeric_values_template from "./numeric-values.template.html?raw";
import numeric_value_tile_template from "./numeric-value-tile.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function numeric_value_tile_markup({
  numeric_number,
  numeric_description,
  numeric_icon_url = "",
  numeric_link_label = "See more",
  numeric_link_url = "",
}) {
  return render_template(numeric_value_tile_template, {
    numeric_description: escape_html(numeric_description),
    numeric_icon: numeric_icon_url
      ? `<img class="numeric-values__icon" src="${escape_html(numeric_icon_url)}" alt="">`
      : "",
    numeric_number: escape_html(numeric_number),
    numeric_link: numeric_link_url
      ? `<a class="numeric-values__link" href="${escape_html(numeric_link_url)}">${escape_html(numeric_link_label)}</a>`
      : "",
  });
}

export function numeric_values_markup({ numeric_items, section_label }) {
  return render_template(numeric_values_template, {
    numeric_items: numeric_items.map(numeric_value_tile_markup).join(""),
    section_label: escape_html(section_label),
  });
}
