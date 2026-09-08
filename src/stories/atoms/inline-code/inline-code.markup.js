import inline_code_template from "./inline-code.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function inline_code_markup({ snippet_text = "" } = {}) {
  return render_template(inline_code_template, {
    snippet_text: escape_html(snippet_text),
  });
}
