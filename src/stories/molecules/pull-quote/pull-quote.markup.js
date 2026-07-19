import pull_quote_template from "./pull-quote.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function pull_quote_markup({ quote_text, citation_text }) {
  return render_template(pull_quote_template, {
    quote_text: escape_html(quote_text),
    citation_text: escape_html(citation_text),
  });
}
