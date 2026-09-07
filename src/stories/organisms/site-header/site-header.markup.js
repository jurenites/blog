import site_header_template from "./site-header.template.html?raw";
import { select_input_markup } from "../../atoms/select-input/select-input.markup.js";
import { escape_html, render_template } from "../../template.js";

export function site_header_markup({
  brand_name,
  brand_logo_url,
  uses_lego_logo = false,
  navigation_labels,
  language_labels,
  menu_expanded = false,
}) {
  const navigation_items = String(navigation_labels)
    .split(",")
    .map((navigation_label) => navigation_label.trim())
    .filter(Boolean)
    .map((navigation_label, navigation_index) => {
      const current_attribute = navigation_index === 0 ? ' aria-current="page"' : "";
      const navigation_slug = navigation_label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const home_item_class = navigation_slug === "home" ? " site-header__item--home" : "";
      return `<li class="site-header__item${home_item_class}"><a class="site-header__link" href="#${escape_html(navigation_slug)}"${current_attribute}>${escape_html(navigation_label)}</a></li>`;
    })
    .join("");
  const language_items = String(language_labels)
    .split(",")
    .map((language_label) => language_label.trim())
    .filter(Boolean);
  const language_select_markup = select_input_markup({
    field_id: "storybook-language-select",
    field_name: "storybook_language_select",
    option_items: language_items,
    selected_value: language_items[0] || "",
    native_class_names: "site-header__language-select",
  });

  return render_template(site_header_template, {
    brand_name: escape_html(brand_name),
    brand_logo_url: escape_html(brand_logo_url),
    logo_style_class: uses_lego_logo ? " site-header__logo--lego" : "",
    navigation_items,
    language_select_markup,
    menu_state_class: menu_expanded ? " is-menu-open" : "",
    menu_expanded_value: String(menu_expanded),
    menu_toggle_label: menu_expanded ? "Close main menu" : "Open main menu",
  });
}
