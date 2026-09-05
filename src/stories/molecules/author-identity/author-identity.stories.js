import { author_identity_markup } from "./author-identity.markup.js";

const AUTHOR_PREFIX_TEXT = "Written by";
const AUTHOR_NAME = "Alexander Ilivanov";
const AUTHOR_URL = "/user/2";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "";
const AVATAR_SIZE = "medium";

function render_author_identity_story(story_arguments) {
  return `<div class="storybook-stack">${author_identity_markup(story_arguments)}</div>`;
}

export default {
  title: "Molecules/Blog/Author Identity",
  tags: ["autodocs"],
  render: render_author_identity_story,
  argTypes: {
    author_prefix_text: { control: "text" },
    author_name: { control: "text" },
    author_url: { control: "text" },
    avatar_initials: { control: "text" },
    avatar_image_url: { control: "text" },
    avatar_size: {
      control: { type: "inline-radio" },
      options: ["small", "medium", "large", "big"],
    },
  },
  args: {
    author_prefix_text: AUTHOR_PREFIX_TEXT,
    author_name: AUTHOR_NAME,
    author_url: AUTHOR_URL,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    avatar_size: AVATAR_SIZE,
  },
};

export const default_story = {};
