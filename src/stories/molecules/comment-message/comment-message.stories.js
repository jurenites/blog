import { comment_message_markup } from "./comment-message.markup.js";

const COMMENT_AUTHOR_NAME = "Alexander Ilivanov";
const COMMENT_BODY = "This video made me think about how a small interface decision can reshape the whole experience.";
const COMMENT_CREATED_DATE = new Date(Date.now() - (40 * 60 * 1000)).toISOString();
const COMMENT_PERMALINK_URL = "#comment-example";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "http://jurenites.local/sites/default/files/styles/thumbnail/public/pictures/2026-08/Alexander_ilivanpov_avatar_512.jpeg.webp?itok=666UO5aR";

function render_story(story_args) {
  return comment_message_markup(story_args);
}

export default {
  title: "Molecules/Blog/Comment Message",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    comment_author_name: { control: "text" },
    comment_body: { control: "text" },
    comment_created_date: { control: "date" },
    comment_permalink_url: { control: "text" },
    avatar_initials: { control: "text" },
    avatar_image_url: { control: "text" },
  },
  args: {
    comment_author_name: COMMENT_AUTHOR_NAME,
    comment_body: COMMENT_BODY,
    comment_created_date: COMMENT_CREATED_DATE,
    comment_permalink_url: COMMENT_PERMALINK_URL,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
  },
};

export const default_story = {};
