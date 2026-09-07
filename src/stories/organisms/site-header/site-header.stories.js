import { site_header_markup } from "./site-header.markup.js";
import { hero_section_markup } from "../hero-section/hero-section.markup.js";

const BRAND_LOGO_URL = "/assets/brand/jurenites-logo.svg";
const BRAND_NAME = "Jurenites home";
const NAVIGATION_LABELS = "Home, About, Portfolio, Blog, Contact";
const LANGUAGE_LABELS = "Eng, Rus";
const MENU_EXPANDED = false;
const BACKGROUND_IMAGE_URL = "/assets/images/hero-night.jpg";
const IMAGE_DESCRIPTION = "Working at a laptop at night.";
const SECTION_LABEL = "Introduction";
const HERO_SLIDES = [{ navigation_label: "Home", slide_heading: "Design. Build. Collaborate." }];

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
    menu_expanded: { control: "boolean" },
  },
  args: {
    brand_name: BRAND_NAME,
    brand_logo_url: BRAND_LOGO_URL,
    navigation_labels: NAVIGATION_LABELS,
    language_labels: LANGUAGE_LABELS,
    menu_expanded: MENU_EXPANDED,
  },
};

export const default_story = {};

export const homepage_overlay = {
  args: {
    background_image_url: BACKGROUND_IMAGE_URL,
    image_description: IMAGE_DESCRIPTION,
    section_label: SECTION_LABEL,
    hero_slides: HERO_SLIDES,
  },
  parameters: { layout: "fullscreen" },
  render: (story_args) => `<div class="jurenites-front-page">${site_header_markup(story_args)}${hero_section_markup(story_args)}</div>`,
};

export const mobile_menu_open = {
  args: {
    menu_expanded: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile_max",
    },
  },
};
