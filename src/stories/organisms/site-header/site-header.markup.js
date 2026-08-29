import site_header_template from "./site-header.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function site_header_markup({
  brand_name,
  brand_logo_url,
  navigation_labels,
  language_labels,
}) {
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
  const language_options = String(language_labels)
    .split(",")
    .map((language_label) => language_label.trim())
    .filter(Boolean)
    .map((language_label, language_index) => {
      const selected_attribute = language_index === 0 ? " selected" : "";
      return `<option value="#${escape_html(language_label.toLowerCase())}"${selected_attribute}>${escape_html(language_label)}</option>`;
    })
    .join("");

  return render_template(site_header_template, {
    brand_name: escape_html(brand_name),
    brand_logo_url: escape_html(brand_logo_url),
    navigation_items,
    language_options,
  });
}
