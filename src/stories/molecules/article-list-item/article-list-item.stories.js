import { article_list_item_markup } from "./article-list-item.markup.js";

const ARTICLE_URL = "#";
const THUMBNAIL_URL = "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX";
const THUMBNAIL_ALT = "Uploaded article photograph";
const TEASER_TITLE = "Rewinding an Interface Through Time";
const TEASER_EXCERPT = "How a time-slider concept turned into a repeatable design process.";
const BYLINE_LABEL = "Video creator";
const AUTHOR_NAME = "Hmm... Aha!";
const AUTHOR_URL = "https://www.youtube.com/@Hmm-Aha";
const AVATAR_INITIALS = "HA";
const AVATAR_IMAGE_URL = "";
const AVATAR_SIZE = "small";
const PUBLISHED_DATE = "2026-06-15";
const DATE_VALUE_MODE = "time-since";
const DATE_DISPLAY_VARIANT = "day-month-year";
const READING_TIME_MINUTES = 20;
const READING_TIME_LABEL = "min to watch";
const TOPIC_LIST = "";

function render_article_list_item_story(story_arguments) {
  return `<div class="article-list">${article_list_item_markup(story_arguments)}</div>`;
}

export default {
  title: "Molecules/Blog/Article Blog List Item",
  tags: ["autodocs"],
  render: render_article_list_item_story,
  parameters: {
    controls: { disable: true },
  },
  args: {
    article_url: ARTICLE_URL,
    thumbnail_url: THUMBNAIL_URL,
    thumbnail_alt: THUMBNAIL_ALT,
    teaser_title: TEASER_TITLE,
    teaser_excerpt: TEASER_EXCERPT,
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
