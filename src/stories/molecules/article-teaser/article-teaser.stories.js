// Molecule: Article Teaser. Square editorial card with a three-tile composition.
import { article_teaser_markup } from "./article-teaser.markup.js";
import { token_value } from "../../foundations/token-values.js";

const TAG_NAME = "#Writing";
const TAG_URL = "/blog?tag=writing";
const TEASER_TITLE = "Rewinding an Interface Through Time";
const TEASER_EXCERPT = "How a time-slider concept turned into a repeatable design process.";
const ARTICLE_URL = "#";
const THUMBNAIL_URL = "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX";
const THUMBNAIL_ALT = "Uploaded article photograph";
const AUTHOR_NAME = "Alexander Ilivanov";
const AUTHOR_PREFIX_TEXT = "Written by";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "http://jurenites.local/sites/default/files/styles/thumbnail/public/pictures/2026-08/Alexander_ilivanpov_avatar_512.jpeg.webp?itok=666UO5aR";
const PUBLISHED_DATE = "2026-06-15";
const DATE_DISPLAY_VARIANT = token_value("component-date-time-value-default-date-display");
const READING_TIME_MINUTES = 6;
const READING_TIME_LABEL = "min to read";
const ARTICLE_GRID_ITEMS = [
  {
    tag_name: "#Process",
    tag_url: "/blog?tag=process",
    teaser_title: "Rewinding an Interface Through Time",
    teaser_excerpt: "How a time-slider concept turned into a repeatable design process.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX",
    thumbnail_alt: "Uploaded article photograph",
    published_date: "2026-06-15",
    reading_time_minutes: 6,
    reading_time_label: "min to read",
  },
  {
    tag_name: "#Design",
    tag_url: "/blog?tag=design",
    teaser_title: "Building a Material-First Visual Language",
    teaser_excerpt: "Notes on turning a small set of shapes, surfaces, and shadows into a coherent interface.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0029.JPG.webp",
    thumbnail_alt: "Uploaded design process photograph",
    published_date: "2026-07-04",
    reading_time_minutes: 8,
    reading_time_label: "min to read",
  },
  {
    tag_name: "#Development",
    tag_url: "/blog?tag=development",
    teaser_title: "Keeping Storybook and Drupal in Lockstep",
    teaser_excerpt: "A shared component contract keeps authored examples and rendered content visually consistent.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0025.JPG.webp",
    thumbnail_alt: "Uploaded development workspace photograph",
    published_date: "2026-08-12",
    reading_time_minutes: 5,
    reading_time_label: "min to read",
  },
];

function render_article_story(story_arguments) {
  return `<div class="storybook-stack storybook-stack--wide">${article_teaser_markup(story_arguments)}</div>`;
}

function render_article_grid_story() {
  const article_tiles = ARTICLE_GRID_ITEMS.map((article_item) => article_teaser_markup({
    ...article_item,
    article_url: ARTICLE_URL,
    author_name: AUTHOR_NAME,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    date_display_variant: DATE_DISPLAY_VARIANT,
  })).join("");

  return `<div class="article-teaser-grid">${article_tiles}</div>`;
}

export default {
  title: "Molecules/Blog/Article Teaser",
  tags: ["autodocs"],
  render: render_article_story,
  argTypes: {
    tag_name: { control: "text" },
    tag_url: { control: "text" },
    teaser_title: { control: "text" },
    teaser_excerpt: { control: "text" },
    article_url: { control: "text" },
    thumbnail_url: { control: "text" },
    thumbnail_alt: { control: "text" },
    author_name: { control: "text" },
    author_prefix_text: { control: "text" },
    avatar_initials: { control: "text" },
    avatar_image_url: { control: "text" },
    published_date: { control: "date" },
    date_display_variant: {
      control: { type: "select" },
      options: ["date-day", "date-day-time"],
    },
    reading_time_minutes: {
      control: { type: "number", min: 1, step: 1 },
    },
    reading_time_label: { control: "text" },
  },
  args: {
    tag_name: TAG_NAME,
    tag_url: TAG_URL,
    teaser_title: TEASER_TITLE,
    teaser_excerpt: TEASER_EXCERPT,
    article_url: ARTICLE_URL,
    thumbnail_url: THUMBNAIL_URL,
    thumbnail_alt: THUMBNAIL_ALT,
    author_name: AUTHOR_NAME,
    author_prefix_text: AUTHOR_PREFIX_TEXT,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    published_date: PUBLISHED_DATE,
    date_display_variant: DATE_DISPLAY_VARIANT,
    reading_time_minutes: READING_TIME_MINUTES,
    reading_time_label: READING_TIME_LABEL,
  },
};

export const default_story = {};

export const three_tile_grid = {
  render: render_article_grid_story,
  parameters: {
    controls: { disable: true },
  },
};
