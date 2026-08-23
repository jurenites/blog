import crossfade_dot_template from "./crossfade-dot.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function crossfade_dot_markup({ dot_label, is_active = false }) {
  return render_template(crossfade_dot_template, {
    active_class: is_active ? " is-active" : "",
    dot_label: escape_html(dot_label),
    pressed_state: String(is_active),
  });
}
