import { article_list_item_markup } from "./article-list-item.markup.js";
import { token_value } from "../../foundations/token-values.js";

const ARTICLE_URL = "#";
const THUMBNAIL_URL = "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX";
const THUMBNAIL_ALT = "Uploaded article photograph";
const TEASER_TITLE = "Rewinding an Interface Through Time";
const TEASER_EXCERPT = "How a time-slider concept turned into a repeatable design process.";
const AUTHOR_NAME = "Alexander Ilivanov";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "http://jurenites.local/sites/default/files/styles/thumbnail/public/pictures/2026-08/Alexander_ilivanpov_avatar_512.jpeg.webp?itok=666UO5aR";
const PUBLISHED_DATE = "2026-06-15";
const DATE_DISPLAY_VARIANT = token_value("component-date-display-default-display");
const READING_TIME = "5 minutes";

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
    author_name: AUTHOR_NAME,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    published_date: PUBLISHED_DATE,
    date_display_variant: DATE_DISPLAY_VARIANT,
    reading_time: READING_TIME,
  },
};

export const default_story = {};
