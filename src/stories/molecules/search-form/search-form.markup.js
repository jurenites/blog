import search_form_template from "./search-form.template.html?raw";
import { button_markup } from "../../atoms/button/button.markup.js";
import { text_input_markup } from "../../atoms/text-input/text-input.markup.js";
import { escape_html, render_template } from "../../template.js";

export function search_form_markup({ field_label, field_placeholder, button_label, form_action = "#" }) {
  return render_template(search_form_template, {
    form_action: escape_html(form_action),
    search_field: text_input_markup({
      input_id: "site-search-query",
      input_label: field_label,
      input_name: "search_query",
      input_type: "search",
      input_placeholder: field_placeholder,
      hint_text: "Search article titles, topics, and notes.",
      input_action: button_markup({ button_label }),
    }),
  });
}
