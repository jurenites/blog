import guideline_tile_template from "./guideline-tile.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const GUIDELINE_PREVIEW_KINDS = ["logo-icon", "color"];

function guideline_preview_markup(preview_kind, logo_icon_url) {
  if (preview_kind === "logo-icon") {
    return `<img class="guideline-tile__logo" src="${escape_html(logo_icon_url)}" alt="" />`;
  }

  return `
    <span class="guideline-tile__color-preview">
      <span class="u-bg-color-palette-brand-primary"></span>
      <span class="u-bg-color-palette-brand-secondary"></span>
      <span class="u-bg-color-palette-brand-tertiary"></span>
      <span class="u-bg-color-palette-white"></span>
    </span>
  `;
}

export function guideline_tile_markup({
  guideline_title,
  guideline_summary,
  guideline_url,
  preview_kind,
  logo_icon_url,
}) {
  const resolved_preview_kind = GUIDELINE_PREVIEW_KINDS.includes(preview_kind)
    ? preview_kind
    : "color";

  return render_template(guideline_tile_template, {
    guideline_title: escape_html(guideline_title),
    guideline_summary: escape_html(guideline_summary),
    guideline_url: escape_html(guideline_url),
    preview_kind: escape_html(resolved_preview_kind),
    preview_content: guideline_preview_markup(resolved_preview_kind, logo_icon_url),
  });
}
