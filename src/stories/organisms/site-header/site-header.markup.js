import site_header_template from "./site-header.template.html?raw";
import { button_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";

export function site_header_markup({ brand_name, navigation_labels, action_label }) {
  const navigation_items = String(navigation_labels)
    .split(",")
    .map((navigation_label) => navigation_label.trim())
    .filter(Boolean)
    .map((navigation_label, navigation_index) => {
      const current_attribute = navigation_index === 0 ? ' aria-current="page"' : "";
      const navigation_slug = navigation_label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return `<li class="site-header__item"><a class="site-header__link" href="#${escape_html(navigation_slug)}"${current_attribute}>${escape_html(navigation_label)}</a></li>`;
    })
    .join("");

  return render_template(site_header_template, {
    brand_name: escape_html(brand_name),
    navigation_items,
    action_button: button_markup({ button_label: action_label }),
  });
}
