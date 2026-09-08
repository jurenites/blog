import { breadcrumbs_markup } from "./breadcrumbs.markup.js";

const ANCESTOR_LIST = "Home, Writing, Design systems";
const BACK_LINK_URL = "#blog";
const CURRENT_PAGE = "Building a quieter publishing workflow";
const SHOW_BACK_LINK = true;
const GUIDELINE_ANCESTORS = "Guidelines";
const GUIDELINE_CURRENT_PAGE = "Logo Icon";

function render_story(story_args) {
  return breadcrumbs_markup(story_args);
}

export default {
  title: "Molecules/Blog/Breadcrumbs",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    ancestor_list: { control: "text" },
    back_link_url: { control: "text" },
    current_page: { control: "text" },
    show_back_link: { control: "boolean" },
  },
  args: {
    ancestor_list: ANCESTOR_LIST,
    back_link_url: BACK_LINK_URL,
    current_page: CURRENT_PAGE,
    show_back_link: SHOW_BACK_LINK,
  },
};

export const default_story = {};

export const guideline_detail = {
  args: {
    ancestor_list: GUIDELINE_ANCESTORS,
    current_page: GUIDELINE_CURRENT_PAGE,
    show_back_link: false,
  },
};
