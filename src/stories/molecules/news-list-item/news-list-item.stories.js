import { news_list_item_markup } from "./news-list-item.markup.js";

const NEWS_TITLE = "ASTRA IS HERE (GPT-6 RELEASED)";
const SOURCE_URL = "https://www.youtube.com/watch?v=xdXLzFzxA9Q";
const SOURCE_NAME = "@Matthew Berman";
const SOURCE_LABEL = "YouTube";
const THUMBNAIL_URL = "https://i.ytimg.com/vi/xdXLzFzxA9Q/maxresdefault.jpg";
const THUMBNAIL_ALT = "Matthew Berman beside the text GPT-6";
const TAG_NAMES = ["#Artificial Intelligence"];
const PUBLISHED_DATE = "2026-09-03T12:32:50-07:00";
const DATE_VALUE_KIND = "elapsed-time";
const DATE_DISPLAY_VARIANT = "date-day";
const RELATIVE_SUFFIX = "ago";

function render_news_list_item_story(story_arguments) {
  return `<div class="article-list">${news_list_item_markup(story_arguments)}</div>`;
}

export default {
  title: "Molecules/Blog/News List Item",
  tags: ["autodocs"],
  render: render_news_list_item_story,
  argTypes: {
    news_title: { control: "text" },
    source_url: { control: "text" },
    source_name: { control: "text" },
    source_label: { control: "text" },
    thumbnail_url: { control: "text" },
    thumbnail_alt: { control: "text" },
    tag_names: { control: "object" },
    published_date: { control: "date" },
    date_value_kind: {
      control: { type: "select" },
      options: ["elapsed-time", "absolute-date"],
    },
    date_display_variant: {
      control: { type: "select" },
      options: ["date-day", "date-day-time"],
    },
    relative_suffix: { control: "text" },
  },
  args: {
    news_title: NEWS_TITLE,
    source_url: SOURCE_URL,
    source_name: SOURCE_NAME,
    source_label: SOURCE_LABEL,
    thumbnail_url: THUMBNAIL_URL,
    thumbnail_alt: THUMBNAIL_ALT,
    tag_names: TAG_NAMES,
    published_date: PUBLISHED_DATE,
    date_value_kind: DATE_VALUE_KIND,
    date_display_variant: DATE_DISPLAY_VARIANT,
    relative_suffix: RELATIVE_SUFFIX,
  },
};

export const default_story = {};
