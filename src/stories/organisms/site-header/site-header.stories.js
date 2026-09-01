import { site_header_markup } from "./site-header.markup.js";

const BRAND_LOGO_URL = "/assets/brand/jurenites-logo.svg";
const BRAND_NAME = "Jurenites home";
const NAVIGATION_LABELS = "Home, About, Portfolio, Blog, Contact";
const LANGUAGE_LABELS = "Eng, Rus";

function render_story(story_args) {
  return site_header_markup(story_args);
}

export default {
  title: "Organisms/Top Nav Menu Site Header",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    brand_name: { control: "text" },
    brand_logo_url: { control: "text" },
    navigation_labels: { control: "text" },
    language_labels: { control: "text" },
  },
  args: {
    brand_name: BRAND_NAME,
    brand_logo_url: BRAND_LOGO_URL,
    navigation_labels: NAVIGATION_LABELS,
    language_labels: LANGUAGE_LABELS,
  },
};

export const default_story = {};
