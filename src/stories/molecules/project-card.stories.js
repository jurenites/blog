// Molecule: Project Card. Composes chip + button atoms.
import card_template from "./project-card.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ card_title, card_excerpt, tag_list, show_media, action_label }) {
  const tag_items = String(tag_list)
    .split(",")
    .map((tag_item) => tag_item.trim())
    .filter(Boolean)
    .map((tag_item) => `<span class="chip">${escape_html(tag_item)}</span>`)
    .join("");

  const media_markup = show_media
    ? `<div class="project-card__media"></div>`
    : "";

  return render_template(card_template, {
    media: media_markup,
    title: escape_html(card_title),
    excerpt: escape_html(card_excerpt),
    tag_list: tag_items,
    action_label: escape_html(action_label),
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
    card_title: "Interactive CV Timeline",
    card_excerpt: "A slider-driven career story with company logos and bookmarks.",
    tag_list: "Drupal, Figma, WebGL",
    show_media: true,
    action_label: "View project",
  },
};

export const default_story = {};
