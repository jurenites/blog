import { breadcrumbs_markup } from "./breadcrumbs.markup.js";

const ANCESTOR_LIST = "Home, Writing, Design systems";
const CURRENT_PAGE = "Building a quieter publishing workflow";

function render_story(story_args) {
  return breadcrumbs_markup(story_args);
}

export default {
  title: "Molecules/Breadcrumbs",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    ancestor_list: { control: "text" },
    current_page: { control: "text" },
  },
  args: {
    ancestor_list: ANCESTOR_LIST,
    current_page: CURRENT_PAGE,
  },
};

export const default_story = {};
