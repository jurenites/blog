import { author_byline_markup } from "./author-byline.markup.js";

const AUTHOR_NAME = "Alexander Ilivanov";
const AUTHOR_URL = "/user/2";
const BYLINE_LABEL = "Article author";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "";
const AVATAR_SIZE = "medium";
const PUBLISHED_DATE = "2026-06-23";
const DATE_VALUE_MODE = "month-day-year";
const DATE_DISPLAY_VARIANT = "date-day";
const READING_TIME_MINUTES = 6;
const READING_TIME_LABEL = "min to read";
const TOPIC_LIST = "Design systems, Drupal";

const VIDEO_AUTHOR_NAME = "Jake The Alright";
const VIDEO_AUTHOR_URL = "https://www.youtube.com/@jakethealright";
const VIDEO_BYLINE_LABEL = "Video creator";
const VIDEO_AVATAR_INITIALS = "JT";
const VIDEO_AVATAR_SIZE = "small";
const VIDEO_PUBLISHED_DATE = "2024-11-25";
const VIDEO_DATE_VALUE_MODE = "time-since";
const VIDEO_DATE_DISPLAY_VARIANT = "day-month-year";
const VIDEO_READING_TIME_MINUTES = 20;
const VIDEO_READING_TIME_LABEL = "min to watch";

function render_story(story_args) {
  return author_byline_markup(story_args);
}

export default {
  title: "Molecules/Blog/Author Byline",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    byline_label: { control: "text" },
    author_name: { control: "text" },
    author_url: { control: "text" },
    avatar_initials: { control: "text" },
    avatar_image_url: { control: "text" },
    avatar_size: {
      control: { type: "inline-radio" },
      options: ["small", "medium", "large", "big"],
    },
    published_date: { control: "date" },
    date_value_mode: {
      control: { type: "inline-radio" },
      options: ["month-day-year", "time-since"],
    },
    date_display_variant: {
      control: { type: "inline-radio" },
      options: ["date-day", "date-day-time", "day-month-year"],
    },
    reading_time_minutes: {
      control: { type: "number", min: 1, step: 1 },
    },
    reading_time_label: { control: "text" },
    topic_list: { control: "text" },
  },
  args: {
    byline_label: BYLINE_LABEL,
    author_name: AUTHOR_NAME,
    author_url: AUTHOR_URL,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    avatar_size: AVATAR_SIZE,
    published_date: PUBLISHED_DATE,
    date_value_mode: DATE_VALUE_MODE,
    date_display_variant: DATE_DISPLAY_VARIANT,
    reading_time_minutes: READING_TIME_MINUTES,
    reading_time_label: READING_TIME_LABEL,
    topic_list: TOPIC_LIST,
  },
};

export const default_story = {};

export const youtube_reference = {
  args: {
    byline_label: VIDEO_BYLINE_LABEL,
    author_name: VIDEO_AUTHOR_NAME,
    author_url: VIDEO_AUTHOR_URL,
    avatar_initials: VIDEO_AVATAR_INITIALS,
    avatar_size: VIDEO_AVATAR_SIZE,
    published_date: VIDEO_PUBLISHED_DATE,
    date_value_mode: VIDEO_DATE_VALUE_MODE,
    date_display_variant: VIDEO_DATE_DISPLAY_VARIANT,
    reading_time_minutes: VIDEO_READING_TIME_MINUTES,
    reading_time_label: VIDEO_READING_TIME_LABEL,
    topic_list: "",
  },
};
