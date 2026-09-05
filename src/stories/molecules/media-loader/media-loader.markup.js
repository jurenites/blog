import media_loader_template from "./media-loader.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function media_loader_markup({ progress_label }) {
  return render_template(media_loader_template, {
    progress_label: escape_html(progress_label),
  });
}
