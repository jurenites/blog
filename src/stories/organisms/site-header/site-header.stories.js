import { site_header_markup } from "./site-header.markup.js";

const BRAND_NAME = "jurenites";
const NAVIGATION_LABELS = "About, Work, Notes";
const ACTION_LABEL = "Contact";

function render_story(story_args) {
  return site_header_markup(story_args);
}

export default {
  title: "Organisms/Site Header",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    brand_name: { control: "text" },
    navigation_labels: { control: "text" },
    action_label: { control: "text" },
  },
  args: {
    brand_name: BRAND_NAME,
    navigation_labels: NAVIGATION_LABELS,
    action_label: ACTION_LABEL,
  },
};

export const default_story = {};
