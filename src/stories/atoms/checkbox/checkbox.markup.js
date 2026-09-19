import checkbox_template from "./checkbox.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function checkbox_markup({
  field_id,
  field_name,
  field_label = "",
  field_value = "yes",
  accessible_label = "Select option",
  checkbox_state = "empty",
  is_required = false,
  is_disabled = false,
  accessibility_attributes = "",
}) {
  const required_indicator = is_required
    ? '<span class="input-text__required" aria-hidden="true">&#x20;*</span>'
    : "";
  const control_attributes = [
    checkbox_state === "filled" ? "checked" : "",
    checkbox_state === "partially" ? 'data-checkbox-state="partially"' : "",
    is_required ? "required" : "",
    is_disabled ? "disabled" : "",
    field_label ? "" : `aria-label="${escape_html(accessible_label)}"`,
    accessibility_attributes,
  ].filter(Boolean).join(" ");
  return render_template(checkbox_template, {
    field_id: escape_html(field_id),
    field_name: escape_html(field_name),
    field_value: escape_html(field_value),
    control_attributes,
    label_markup: field_label
      ? `<label class="checkbox__label" for="${escape_html(field_id)}">${escape_html(field_label)}${required_indicator}</label>`
      : "",
  });
}
