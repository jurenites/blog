import { escape_html, render_template } from "../../template.js";
import footer_navigation_template from "./footer-navigation.template.html?raw";

export function footer_navigation_markup({
  privacy_policy_label,
  privacy_policy_url,
  rights_message,
  current_year,
}) {
  return render_template(footer_navigation_template, {
    current_year: escape_html(current_year),
    privacy_policy_label: escape_html(privacy_policy_label),
    privacy_policy_url: escape_html(privacy_policy_url),
    rights_message: escape_html(rights_message),
  });
}
