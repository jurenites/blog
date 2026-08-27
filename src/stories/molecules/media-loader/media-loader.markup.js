import media_loader_template from "./media-loader.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function media_loader_markup({ media_file_name, upload_percentage, status_message }) {
  const normalized_percentage = Math.min(100, Math.max(0, Number(upload_percentage) || 0));
  const progress_label = `${status_message}: ${normalized_percentage}%`;

  return render_template(media_loader_template, {
    media_file_name: escape_html(media_file_name),
    upload_percentage: String(normalized_percentage),
    status_message: escape_html(status_message),
    progress_label: escape_html(progress_label),
  });
}
