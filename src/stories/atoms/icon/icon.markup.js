import icon_template from "./icon.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function icon_markup({ icon_name, class_name = "", with_tooltip = false }) {
  const safe_icon_name = String(icon_name ?? "")
    .replace(/\.svg$/i, "")
    .replace(/[^a-z0-9-]/gi, "");
  return render_template(icon_template, {
    class_name: class_name ? ` ${escape_html(class_name)}` : "",
    icon_name: escape_html(safe_icon_name),
    icon_source: escape_html(`#jurenites-icon-${safe_icon_name}`),
    hover_icon_markup: safe_icon_name === "brand-figma"
      ? '<svg class="icon__svg icon__svg--hover" viewBox="0 0 24 24" fill="currentColor"><use href="#jurenites-icon-brand-figma-hover"></use></svg>'
      : "",
    tooltip_trigger_attribute: with_tooltip ? ' data-tooltip-trigger' : "",
  });
}
