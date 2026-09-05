import author_identity_template from "./author-identity.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { escape_html, render_template } from "../../template.js";

export function author_identity_markup({
  author_prefix_text = "",
  author_name,
  author_url = "",
  avatar_initials,
  avatar_image_url = "",
  avatar_size = "medium",
}) {
  const author_name_markup = author_url
    ? `<a href="${escape_html(author_url)}">${escape_html(author_name)}</a>`
    : escape_html(author_name);

  return render_template(author_identity_template, {
    avatar_content: avatar_markup({
      avatar_initials,
      avatar_size,
      image_url: avatar_image_url,
    }),
    author_prefix_text: escape_html(author_prefix_text),
    author_name_markup,
  });
}
