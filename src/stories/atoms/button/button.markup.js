import button_template from "./button.template.html?raw";
import { token_default_option } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function button_markup({
  button_label,
  style_variant = token_default_option("component-button-default-style", "component-button-style-"),
  is_disabled = false,
  additional_class_names = "",
  tooltip_label = "",
  tooltip_color_variant = "",
}) {
  const tooltip_attributes = tooltip_label
    ? ` data-tooltip-trigger data-tooltip-label="${escape_html(tooltip_label)}" data-tooltip-color-variant="${escape_html(tooltip_color_variant)}"`
    : "";

  return render_template(button_template, {
    additional_classes: additional_class_names
      ? ` ${escape_html(additional_class_names)}`
      : "",
    label: escape_html(button_label),
    variant: escape_html(style_variant),
    disabled: is_disabled ? " disabled" : "",
    tooltip_attributes,
  });
}
