// Molecule: Project Card. Composes the chip atom and shared link typography.
import card_template from "./project-card.template.html?raw";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { escape_html, render_template } from "../../template.js";

const CARD_TITLE = "Interactive CV Timeline";
const PROJECT_URL = "/portfolio/interactive-cv-timeline";
const TAG_LIST = "#Figma, #SQL";
const SHOW_MEDIA = true;
const PROJECT_GALLERY_ITEMS = [
  {
    card_title: "Roundabout",
    project_url: "/portfolio/roundabout",
    tag_list: "#Font, #Typography",
  },
  {
    card_title: "4pixel",
    project_url: "/portfolio/4pixel",
    tag_list: "#Font, #Pixel",
  },
  {
    card_title: "Interactive CV Timeline",
    project_url: "/portfolio/interactive-cv-timeline",
    tag_list: "#Figma, #SQL",
  },
  {
    card_title: "Design System",
    project_url: "/portfolio/design-system",
    tag_list: "#Design, #Development",
  },
];
const PORTFOLIO_TAG_OPTIONS = [
  {
    chip_label: "#Design",
    chip_url: "/portfolio?tag=design",
    is_selected: false,
  },
  {
    chip_label: "#Font",
    chip_url: "/portfolio",
    is_selected: true,
  },
  {
    chip_label: "#Development",
    chip_url: "/portfolio?tag=development",
    is_selected: false,
  },
];

function project_tag_item_markup(tag_item) {
  const tag_slug = tag_item
    .replace(/^#+\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const tag_chip_markup = chip_markup({
    chip_label: tag_item,
    chip_url: `/portfolio?tag=${encodeURIComponent(tag_slug)}`,
  });

  return `<li class="article-tags__item">${tag_chip_markup}</li>`;
}

function project_card_markup({ card_title, project_url, tag_list, show_media }) {
  const tag_items = String(tag_list)
    .split(",")
    .map((tag_item) => tag_item.trim())
    .filter(Boolean)
    .map(project_tag_item_markup)
    .join("");

  const tag_list_markup = tag_items
    ? `<nav class="article-tags" aria-label="Tags"><ul class="article-tags__list">${tag_items}</ul></nav>`
    : "";

  const media_markup = show_media
    ? `<div class="project-card__media"></div>`
    : "";

  return render_template(card_template, {
    media: media_markup,
    title: escape_html(card_title),
    project_url: escape_html(project_url),
    tag_list: tag_list_markup,
  });
}

function render_story(story_arguments) {
  return `<div class="storybook-stack storybook-stack--narrow">${project_card_markup(story_arguments)}</div>`;
}

function render_gallery_story() {
  const portfolio_tag_chips = PORTFOLIO_TAG_OPTIONS.map((tag_option) => {
    const tag_chip_markup = chip_markup({
      chip_label: tag_option.chip_label,
      chip_url: tag_option.chip_url,
      is_accent: tag_option.is_selected,
      is_current: tag_option.is_selected,
      accessible_label: tag_option.is_selected
        ? `Show all Portfolio projects; current tag is ${tag_option.chip_label}`
        : `Filter Portfolio projects by ${tag_option.chip_label}`,
    });

    return `<li class="article-tags__item">${tag_chip_markup}</li>`;
  }).join("");
  const project_tiles = PROJECT_GALLERY_ITEMS.map((project_item) => project_card_markup({
    ...project_item,
    show_media: true,
  })).join("");

  return `
    <div class="storybook-stack storybook-stack--portfolio-gallery">
      <nav class="article-tags portfolio-filter" aria-label="Filter Portfolio projects by tag">
        <span class="article-tags__label portfolio-filter__label">Filter projects by tag</span>
        <ul class="article-tags__list portfolio-filter__list">${portfolio_tag_chips}</ul>
      </nav>
      <div class="portfolio-grid">${project_tiles}</div>
    </div>
  `;
}

export default {
  title: "Molecules/Project Card",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    card_title: { control: "text" },
    project_url: { control: "text" },
    tag_list: { control: "text" },
    show_media: { control: "boolean" },
  },
  args: {
    card_title: CARD_TITLE,
    project_url: PROJECT_URL,
    tag_list: TAG_LIST,
    show_media: SHOW_MEDIA,
  },
};

export const default_story = {};

export const four_item_gallery = {
  render: render_gallery_story,
};
