import button_template from "./button.template.html?raw";
import button_link_template from "./button-link.template.html?raw";
import { token_default_option } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function button_markup({
  button_label,
  style_variant = token_default_option("component-button-default-style", "component-button-style-"),
  is_disabled = false,
  additional_class_names = "",
  tooltip_label = "",
  tooltip_color_variant = "",
  button_icon_markup = "",
}) {
  const prefix_icon_class_name = button_icon_markup ? " button--with-prefix-icon" : "";
  const tooltip_attributes = tooltip_label
    ? ` data-tooltip-trigger data-tooltip-label="${escape_html(tooltip_label)}" data-tooltip-color-variant="${escape_html(tooltip_color_variant)}"`
    : "";

  return render_template(button_template, {
    additional_classes: `${prefix_icon_class_name}${
      additional_class_names ? ` ${escape_html(additional_class_names)}` : ""
    }`,
    label: escape_html(button_label),
    icon_markup: button_icon_markup,
    variant: escape_html(style_variant),
    disabled: is_disabled ? " disabled" : "",
    tooltip_attributes,
  });
}

export function button_link_markup({
  button_label,
  link_url,
  download_filename = "",
  style_variant = token_default_option("component-button-default-style", "component-button-style-"),
  additional_class_names = "",
  button_icon_markup = "",
}) {
  const prefix_icon_class_name = button_icon_markup ? " button--with-prefix-icon" : "";

  return render_template(button_link_template, {
    additional_classes: `${prefix_icon_class_name}${
      additional_class_names ? ` ${escape_html(additional_class_names)}` : ""
    }`,
    download_attribute: download_filename
      ? ` download="${escape_html(download_filename)}"`
      : "",
    icon_markup: button_icon_markup,
    label: escape_html(button_label),
    link_url: escape_html(link_url),
    variant: escape_html(style_variant),
  });
}
