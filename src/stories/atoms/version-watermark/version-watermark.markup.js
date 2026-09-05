import version_watermark_template from "./version-watermark.template.html?raw";
import { escape_html, render_template } from "../../template.js";

function collaboration_credit_markup(credit_collaborators) {
  return credit_collaborators
    .map((collaborator_name, collaborator_index) => {
      const collaborator_markup = `<span class="version-watermark__credit_name">${escape_html(collaborator_name)}</span>`;

      return collaborator_index === 0
        ? collaborator_markup
        : `<span class="version-watermark__separator">&amp;</span>${collaborator_markup}`;
    })
    .join("");
}

export function version_watermark_markup({
  version_label,
  version_number,
  updated_gmt,
  git_hash,
  git_url,
  credit_text,
  credit_collaborators,
  is_story_preview = false,
}) {
  return render_template(version_watermark_template, {
    preview_class_name: is_story_preview ? " version-watermark--story-preview" : "",
    version_label: escape_html(version_label),
    version_number: escape_html(version_number),
    updated_gmt: escape_html(updated_gmt),
    git_hash: escape_html(git_hash),
    git_url: escape_html(git_url),
    credit_text: escape_html(credit_text),
    credit_collaborators_markup: collaboration_credit_markup(credit_collaborators),
  });
}
