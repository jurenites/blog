import { content_layout_markup } from "./content-layout.markup.js";
import { token_value } from "../../foundations/token-values.js";

const CONTENT_WIDTH = token_value("component-content-layout-default-width");
const CONTENT_WIDTH_OPTIONS = ["readable", "wide"];
const PAGE_HEADING = "Building a quieter publishing workflow";
const INTRODUCTORY_TEXT = "A single compositional layout demonstrates the readable content frame used by Drupal pages and nodes.";
const SHOW_SIDEBAR = true;

function render_story(story_args) {
  return `<div class="storybook-shell">${content_layout_markup(story_args)}</div>`;
}

export default {
  title: "Components/Content Layout",
  tags: ["autodocs"],
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "One shared content frame for Drupal pages and nodes. Controls cover semantic readable and wide widths plus an optional sidebar.",
      },
    },
  },
  argTypes: {
    content_width: { control: { type: "inline-radio" }, options: CONTENT_WIDTH_OPTIONS },
    page_heading: { control: "text" },
    introductory_text: { control: "text" },
    show_sidebar: { control: "boolean" },
  },
  args: {
    content_width: CONTENT_WIDTH,
    page_heading: PAGE_HEADING,
    introductory_text: INTRODUCTORY_TEXT,
    show_sidebar: SHOW_SIDEBAR,
  },
};

export const default_story = {};
