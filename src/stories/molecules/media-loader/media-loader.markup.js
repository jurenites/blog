import media_loader_template from "./media-loader.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function media_loader_markup({
  loader_class,
  loading_surface_markup,
  media_content_markup,
  progress_label,
}) {
  return render_template(media_loader_template, {
    loader_class: escape_html(loader_class),
    loading_surface: loading_surface_markup,
    media_content: media_content_markup,
    progress_label: escape_html(progress_label),
  });
}
