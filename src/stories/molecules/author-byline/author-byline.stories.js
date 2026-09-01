import { author_byline_markup } from "./author-byline.markup.js";

const AUTHOR_NAME = "Alexander Ilivanov";
const AUTHOR_URL = "/user/2";
const AVATAR_INITIALS = "AI";
const PUBLISHED_DATE = "2026-06-23";
const READING_TIME = "6 min read";
const TOPIC_LIST = "Design systems, Drupal";

function render_story(story_args) {
  return author_byline_markup(story_args);
}

export default {
  title: "Molecules/Blog/Author Byline",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    author_name: { control: "text" },
    author_url: { control: "text" },
    avatar_initials: { control: "text" },
    published_date: { control: "date" },
    reading_time: { control: "text" },
    topic_list: { control: "text" },
  },
  args: {
    author_name: AUTHOR_NAME,
    author_url: AUTHOR_URL,
    avatar_initials: AVATAR_INITIALS,
    published_date: PUBLISHED_DATE,
    reading_time: READING_TIME,
    topic_list: TOPIC_LIST,
  },
};

export const default_story = {};
