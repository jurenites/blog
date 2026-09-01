// Molecule: Article Teaser. Square editorial card with a three-tile composition.
import { article_teaser_markup } from "./article-teaser.markup.js";
import { token_value } from "../../foundations/token-values.js";

const EYEBROW_HEADING = "Writing";
const TEASER_TITLE = "Rewinding an Interface Through Time";
const TEASER_EXCERPT = "How a time-slider concept turned into a repeatable design process.";
const ARTICLE_URL = "#";
const THUMBNAIL_URL = "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX";
const THUMBNAIL_ALT = "Uploaded article photograph";
const AUTHOR_NAME = "Alexander Ilivanov";
const AVATAR_INITIALS = "AI";
const AVATAR_IMAGE_URL = "http://jurenites.local/sites/default/files/styles/thumbnail/public/pictures/2026-08/Alexander_ilivanpov_avatar_512.jpeg.webp?itok=666UO5aR";
const PUBLISHED_DATE = "2026-06-15";
const DATE_DISPLAY_VARIANT = token_value("component-date-display-default-display");
const READING_TIME = "6 minutes";
const ARTICLE_GRID_ITEMS = [
  {
    eyebrow_heading: "Process",
    teaser_title: "Rewinding an Interface Through Time",
    teaser_excerpt: "How a time-slider concept turned into a repeatable design process.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0001.JPG.webp?itok=3HPjYrtX",
    thumbnail_alt: "Uploaded article photograph",
    published_date: "2026-06-15",
    reading_time: "6 minutes",
  },
  {
    eyebrow_heading: "Design",
    teaser_title: "Building a Material-First Visual Language",
    teaser_excerpt: "Notes on turning a small set of shapes, surfaces, and shadows into a coherent interface.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0029.JPG.webp",
    thumbnail_alt: "Uploaded design process photograph",
    published_date: "2026-07-04",
    reading_time: "8 minutes",
  },
  {
    eyebrow_heading: "Development",
    teaser_title: "Keeping Storybook and Drupal in Lockstep",
    teaser_excerpt: "A shared component contract keeps authored examples and rendered content visually consistent.",
    thumbnail_url: "http://jurenites.local/sites/default/files/styles/medium/public/2026-08/DSC_0025.JPG.webp",
    thumbnail_alt: "Uploaded development workspace photograph",
    published_date: "2026-08-12",
    reading_time: "5 minutes",
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
    eyebrow_heading: { control: "text" },
    teaser_title: { control: "text" },
    teaser_excerpt: { control: "text" },
    article_url: { control: "text" },
    thumbnail_url: { control: "text" },
    thumbnail_alt: { control: "text" },
    author_name: { control: "text" },
    avatar_initials: { control: "text" },
    avatar_image_url: { control: "text" },
    published_date: { control: "date" },
    date_display_variant: {
      control: { type: "select" },
      options: ["date-day", "date-day-time"],
    },
    reading_time: { control: "text" },
  },
  args: {
    eyebrow_heading: EYEBROW_HEADING,
    teaser_title: TEASER_TITLE,
    teaser_excerpt: TEASER_EXCERPT,
    article_url: ARTICLE_URL,
    thumbnail_url: THUMBNAIL_URL,
    thumbnail_alt: THUMBNAIL_ALT,
    author_name: AUTHOR_NAME,
    avatar_initials: AVATAR_INITIALS,
    avatar_image_url: AVATAR_IMAGE_URL,
    published_date: PUBLISHED_DATE,
    date_display_variant: DATE_DISPLAY_VARIANT,
    reading_time: READING_TIME,
  },
};

export const default_story = {};

export const three_tile_grid = {
  render: render_article_grid_story,
  parameters: {
    controls: { disable: true },
  },
};
