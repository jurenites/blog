export function escape_html(raw_value) {
  return String(raw_value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function render_template(template_html, template_values = {}) {
  return template_html.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, value_key) => template_values[value_key] ?? "");
}
