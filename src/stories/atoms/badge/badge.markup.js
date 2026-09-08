import badge_template from "./badge.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const BADGE_COLOR_VARIANTS = ["neutral", "gray", "white"];

export function badge_markup({ badge_label, color_variant = "neutral", numeric_style = false }) {
  const safe_color_variant = BADGE_COLOR_VARIANTS.includes(color_variant)
    ? color_variant
    : BADGE_COLOR_VARIANTS[0];
  const badge_class_name = safe_color_variant === BADGE_COLOR_VARIANTS[0]
    ? "badge"
    : `badge badge--${safe_color_variant}`;

  return render_template(badge_template, {
    badge_class_name: `${badge_class_name}${numeric_style ? " badge--numeric" : ""}`,
    badge_label_text: escape_html(badge_label),
  });
}
