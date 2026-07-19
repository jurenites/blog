import { pagination_markup } from "./pagination.markup.js";

const CURRENT_PAGE = 4;
const PAGE_COUNT = 12;

function render_story(story_args) {
  return pagination_markup(story_args);
}

export default {
  title: "Molecules/Pagination",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    current_page: {
      control: { type: "number", min: 1, max: 99, step: 1 },
      description: "Currently selected page number.",
    },
    page_count: {
      control: { type: "number", min: 1, max: 99, step: 1 },
      description: "Total number of available pages.",
    },
  },
  args: {
    current_page: CURRENT_PAGE,
    page_count: PAGE_COUNT,
  },
};

export const default_story = {};
