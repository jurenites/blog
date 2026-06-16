// Molecule: Project Card. Composes chip + button atoms.
import card_template from "./project-card.template.html?raw";
import { button_markup } from "../../atoms/button/button.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { escape_html, render_template } from "../../template.js";

const CARD_TITLE = "Interactive CV Timeline";
const CARD_EXCERPT = "A slider-driven career story with company logos and bookmarks.";
const TAG_LIST = "Drupal, Figma, WebGL";
const SHOW_MEDIA = true;
const ACTION_LABEL = "View project";

function render_story({ card_title, card_excerpt, tag_list, show_media, action_label }) {
  const tag_items = String(tag_list)
    .split(",")
    .map((tag_item) => tag_item.trim())
    .filter(Boolean)
    .map((tag_item) => chip_markup({ chip_label: tag_item }))
    .join("");

  const media_markup = show_media
    ? `<div class="project-card__media"></div>`
    : "";

  return render_template(card_template, {
    media: media_markup,
    title: escape_html(card_title),
    excerpt: escape_html(card_excerpt),
    tag_list: tag_items,
    action_button: button_markup({ button_label: action_label, style_variant: "secondary" }),
  });
}

export default {
  title: "Molecules/Project Card",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    card_title: { control: "text" },
    card_excerpt: { control: "text" },
    tag_list: { control: "text" },
    show_media: { control: "boolean" },
    action_label: { control: "text" },
  },
  args: {
    card_title: CARD_TITLE,
    card_excerpt: CARD_EXCERPT,
    tag_list: TAG_LIST,
    show_media: SHOW_MEDIA,
    action_label: ACTION_LABEL,
  },
};

export const default_story = {};
