import version_watermark_template from "./version-watermark.template.html?raw";
import { escape_html, render_template } from "../../template.js";

export function version_watermark_markup({
  version_label,
  version_number,
  git_hash,
  git_url,
  credit_text,
}) {
  return render_template(version_watermark_template, {
    version_label: escape_html(version_label),
    version_number: escape_html(version_number),
    git_hash: escape_html(git_hash),
    git_url: escape_html(git_url),
    credit_text: escape_html(credit_text),
  });
}
