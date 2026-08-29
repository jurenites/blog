import icon_template from "./icon.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function icon_markup({ icon_name, class_name = "" }) {
  const safe_icon_name = String(icon_name ?? "").replace(/[^a-z0-9-]/gi, "");
  return render_template(icon_template, {
    class_name: class_name ? ` ${escape_html(class_name)}` : "",
    icon_name: escape_html(safe_icon_name),
    icon_source: escape_html(`/assets/icons/${safe_icon_name}.svg`),
  });
}
