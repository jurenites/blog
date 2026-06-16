// Atom: Avatar. Image or initials; size via Controls.
import { avatar_markup } from "./avatar.markup.js";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";

const AVATAR_SIZE = token_default_option("component-avatar-default-size", "component-avatar-size-");
const AVATAR_INITIALS = "AI";
const IMAGE_URL = "";

const avatar_size_options = token_option_names("component-avatar-size-");

function render_story(story_args) {
  return avatar_markup(story_args);
}

export default {
  title: "Atoms/Avatar",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    avatar_size: { control: { type: "inline-radio" }, options: avatar_size_options },
    avatar_initials: { control: "text" },
    image_url: { control: "text" },
  },
  args: {
    avatar_size: AVATAR_SIZE,
    avatar_initials: AVATAR_INITIALS,
    image_url: IMAGE_URL,
  },
};

export const default_story = {};
