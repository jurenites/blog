import author_identity_template from "./author-identity.template.html?raw";
import author_avatar_pair_template from "./author-avatar-pair.template.html?raw";
import author_coauthor_template from "./author-coauthor.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { escape_html, render_template } from "../../template.js";

export function author_identity_markup({
  author_prefix_text = "",
  author_name,
  author_url = "",
  avatar_initials,
  avatar_image_url = "",
  avatar_size = "medium",
  coauthor_name = "",
  coauthor_url = "",
  coauthor_avatar_initials = "",
  coauthor_avatar_image_url = "",
}) {
  const author_name_markup = author_url
    ? `<a href="${escape_html(author_url)}">${escape_html(author_name)}</a>`
    : escape_html(author_name);

  const primary_avatar_content = avatar_markup({
    avatar_initials,
    avatar_size,
    image_url: avatar_image_url,
  });
  const coauthor_name_markup = coauthor_url
    ? `<a href="${escape_html(coauthor_url)}">${escape_html(coauthor_name)}</a>`
    : escape_html(coauthor_name);

  return render_template(author_identity_template, {
    identity_modifier: coauthor_name ? ` author-identity--coauthors author-identity--avatar-${escape_html(avatar_size)}` : "",
    avatar_content: coauthor_name ? render_template(author_avatar_pair_template, {
      primary_avatar_content,
      secondary_avatar_content: avatar_markup({
        avatar_initials: coauthor_avatar_initials,
        avatar_size,
        image_url: coauthor_avatar_image_url,
      }),
    }) : primary_avatar_content,
    coauthor_content: coauthor_name ? render_template(author_coauthor_template, { coauthor_name_markup }) : "",
    author_prefix_text: escape_html(author_prefix_text),
    author_name_markup,
  });
}
