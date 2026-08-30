import { escape_html } from "./template.js";

export function numeric_text_markup(numeric_text) {
  return escape_html(numeric_text).replaceAll(
    "0",
    '<span class="numeric-zero">0</span>',
  );
}
