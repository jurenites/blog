import blockquote_template from "./blockquote.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function blockquote_markup({ quote_text, continuation_text }) {
  return render_template(blockquote_template, {
    quote_text: escape_html(quote_text),
    continuation_markup: continuation_text ? `<p>${escape_html(continuation_text)}</p>` : "",
  });
}
