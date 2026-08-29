import select_input_template from "./select-input.template.html?raw";
import { escape_html, render_template } from "../../template.js";

function select_option_list(option_items) {
  return Array.isArray(option_items)
    ? option_items
    : String(option_items)
      .split(",")
      .map((option_label) => option_label.trim())
      .filter(Boolean);
}

function select_option_value(option_label) {
  return option_label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function select_input_markup({
  field_id,
  field_name,
  option_items,
  selected_value,
  is_required = false,
  is_disabled = false,
  native_class_names = "",
  accessibility_attributes = "",
}) {
  const selected_value_normalized = String(selected_value).toLowerCase();
  const option_items_markup = select_option_list(option_items)
    .map((option_label) => {
      const selected_attribute = option_label.toLowerCase() === selected_value_normalized
        ? " selected"
        : "";

      return `<option value="${escape_html(select_option_value(option_label))}"${selected_attribute}>${escape_html(option_label)}</option>`;
    })
    .join("");
  const select_attributes = [
    accessibility_attributes,
    is_required ? "required" : "",
    is_disabled ? "disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return render_template(select_input_template, {
    field_id: escape_html(field_id),
    field_name: escape_html(field_name),
    native_class_names: native_class_names ? ` ${escape_html(native_class_names)}` : "",
    option_items_markup,
    select_attributes: select_attributes ? ` ${select_attributes}` : "",
  });
}
