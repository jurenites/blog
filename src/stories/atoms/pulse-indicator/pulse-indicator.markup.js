import pulse_indicator_template from "./pulse-indicator.template.html?raw";
import { render_template } from "../../template.js";

export function pulse_indicator_markup({ is_animation_paused = false } = {}) {
  return render_template(pulse_indicator_template, {
    animation_class_name: is_animation_paused ? " is-animation-paused" : "",
  });
}
