import text_input_template from "./text-input.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function text_input_markup({
  input_id,
  input_label,
  input_name,
  input_type = "text",
  input_placeholder = "",
  input_width = "full",
  hint_text = "",
  is_required = false,
  input_action = "",
}) {
  const input_width_options = ["full", "half", "quarter"];
  const resolved_input_width = input_width_options.includes(input_width) ? input_width : "full";

  return render_template(text_input_template, {
    input_id: escape_html(input_id),
    input_label: escape_html(input_label),
    input_name: escape_html(input_name),
    input_type: escape_html(input_type),
    input_placeholder: escape_html(input_placeholder),
    input_width: escape_html(resolved_input_width),
    required_attribute: is_required ? " required" : "",
    hint_id: escape_html(`${input_id}-hint`),
    hint_text: escape_html(hint_text),
    input_action,
  });
}
