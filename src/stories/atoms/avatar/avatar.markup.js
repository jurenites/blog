import avatar_template from "./avatar.template.html?raw";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function avatar_markup({
  avatar_size = token_value("component-avatar-default-size"),
  avatar_initials,
  image_url = "",
}) {
  const avatar_modifier = ` avatar--${avatar_size}`;
  const avatar_image = image_url
    ? `<div class="avatar__image" data-jurenites-avatar-image><img src="${escape_html(image_url)}" alt="" /></div>`
    : "";
  return render_template(avatar_template, {
    class_name: avatar_modifier,
    avatar_initials: escape_html(avatar_initials),
    avatar_image,
  });
}
