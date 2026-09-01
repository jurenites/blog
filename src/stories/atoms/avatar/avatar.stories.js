// Atom: Avatar. Image or initials; size via Controls.
import { avatar_markup } from "./avatar.markup.js";
import { token_value } from "../../foundations/token-values.js";

const AVATAR_SIZE = token_value("component-avatar-default-size");
const AVATAR_INITIALS = "AI";
const UPLOADED_IMAGE_URL = "http://jurenites.local/sites/default/files/styles/thumbnail/public/pictures/2026-08/Alexander_ilivanpov_avatar_512.jpeg.webp?itok=666UO5aR";
const AVATAR_SIZE_OPTIONS = ["small", "medium", "large", "big"];

function render_story(story_args) {
  return avatar_markup(story_args);
}

export default {
  title: "Atoms/Avatar",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    avatar_size: { control: { type: "inline-radio" }, options: AVATAR_SIZE_OPTIONS },
    avatar_initials: { control: "text" },
    image_url: { control: "text" },
  },
  args: {
    avatar_size: AVATAR_SIZE,
    avatar_initials: AVATAR_INITIALS,
    image_url: "",
  },
};

export const default_story = {};

export const uploaded_state = {
  name: "Uploaded",
  args: {
    image_url: UPLOADED_IMAGE_URL,
  },
};
