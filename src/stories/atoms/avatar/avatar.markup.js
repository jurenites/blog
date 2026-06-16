import avatar_template from "./avatar.template.html?raw";
import { token_default_option } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function avatar_markup({
  avatar_size = token_default_option("component-avatar-default-size", "component-avatar-size-"),
  avatar_initials,
  image_url = "",
}) {
  const default_size = token_default_option("component-avatar-default-size", "component-avatar-size-");
  const avatar_modifier = avatar_size === default_size ? "" : ` avatar--${avatar_size}`;
  const avatar_inner = image_url
    ? `<img class="avatar__image" src="${escape_html(image_url)}" alt="" />`
    : `<span class="avatar__initials">${escape_html(avatar_initials)}</span>`;
  return render_template(avatar_template, {
    class_name: avatar_modifier,
    inner: avatar_inner,
  });
}
