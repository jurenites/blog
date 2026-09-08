import surface_template from "./surface.template.html?raw";
import { render_template } from "../../template.js";

export function surface_markup({ surface_variant = "default", nested_content = "" } = {}) {
  const surface_class_name = surface_variant === "default" ? "surface" : `surface surface--${surface_variant}`;

  return render_template(surface_template, {
    surface_class_name,
    nested_content,
  });
}
