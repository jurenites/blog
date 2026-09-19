import { ICON_SHAPES } from "../../../../generated/icons/icon-markup.js";
import icon_template from "./icon.template.html?raw";
import { escape_html, render_template } from "../../template.js";

let icon_instance_count = 0;

export function icon_markup({ icon_name, class_name = "", with_tooltip = false, is_link_prefix = false }) {
  const safe_icon_name = String(icon_name ?? "")
    .replace(/\.svg$/i, "")
    .replace(/[^a-z0-9-]/gi, "");
  icon_instance_count += 1;
  const inline_icon_markup = (shape_name, extra_class = "") => (ICON_SHAPES[shape_name] || "")
    .replaceAll("__ICON_INSTANCE__", `storybook-icon-${icon_instance_count}`)
    .replace("__ICON_CLASS__", extra_class);
  const active_icon_name = `${safe_icon_name}-active`;
  const has_active_icon = is_link_prefix && Boolean(ICON_SHAPES[active_icon_name]);
  const prefix_class_name = is_link_prefix ? " icon--link-prefix" : "";
  return render_template(icon_template, {
    class_name: `${class_name ? ` ${escape_html(class_name)}` : ""}${prefix_class_name}`,
    icon_name: escape_html(safe_icon_name),
    icon_geometry: has_active_icon
      ? inline_icon_markup(safe_icon_name, " icon__svg--default") + inline_icon_markup(active_icon_name, " icon__svg--active")
      : inline_icon_markup(safe_icon_name),
    tooltip_trigger_attribute: with_tooltip ? ' data-tooltip-trigger' : "",
  });
}
