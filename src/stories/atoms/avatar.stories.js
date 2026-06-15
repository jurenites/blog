// Atom: Avatar. Image or initials; size via Controls.
import avatar_template from "./avatar.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ avatar_size, avatar_initials, image_url }) {
  const avatar_modifier = avatar_size === "medium" ? "" : ` avatar--${avatar_size}`;
  const avatar_inner = image_url
    ? `<img class="avatar__image" src="${escape_html(image_url)}" alt="" />`
    : `<span class="avatar__initials">${escape_html(avatar_initials)}</span>`;
  return render_template(avatar_template, { modifier: avatar_modifier, inner: avatar_inner });
}

export default {
  title: "Atoms/Avatar",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    avatar_size: { control: { type: "inline-radio" }, options: ["small", "medium", "large"] },
    avatar_initials: { control: "text" },
    image_url: { control: "text" },
  },
  args: {
    avatar_size: "medium",
    avatar_initials: "AI",
    image_url: "",
  },
};

export const default_story = {};
