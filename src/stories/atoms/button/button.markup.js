import button_template from "./button.template.html?raw";
import { token_default_option } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function button_markup({
  button_label,
  style_variant = token_default_option("component-button-default-style", "component-button-style-"),
  is_disabled = false,
}) {
  return render_template(button_template, {
    label: escape_html(button_label),
    variant: escape_html(style_variant),
    disabled: is_disabled ? " disabled" : "",
  });
}
