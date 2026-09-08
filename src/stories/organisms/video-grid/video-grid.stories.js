import article_list_item_story from "../../molecules/article-list-item/article-list-item.stories.js";
import { article_list_item_markup } from "../../molecules/article-list-item/article-list-item.markup.js";
import { escape_html, render_template } from "../../template.js";
import video_grid_template from "./video-grid.template.html?raw";
import video_grid_item_template from "./video-grid-item.template.html?raw";
import { pagination_markup } from "../../molecules/pagination/pagination.markup.js";
import { initialize_video_grids } from "../../../slice/src/js/video-grid.js";

const INTRODUCTION_TEXT = "These are videos I’ve enjoyed and think are worth watching to learn something new. Some explore topics I haven’t covered elsewhere on this site.";
const PAGE_COUNT = 1;
const CURRENT_PAGE = 1;
const LAZY_PAGE_COUNT = 3;
const LOADING_DELAY = 800;
const SIMULATE_FAILURE = false;
const VIDEO_ITEMS = [
  { teaser_title: "Learning through software design", published_date: "2026-09-02" },
  { teaser_title: "A fresh perspective on interfaces", published_date: "2026-07-18" },
  { teaser_title: "What notification design forgot", published_date: "2026-06-28" },
  { teaser_title: "The details behind art direction", published_date: "2026-06-15" },
  { teaser_title: "Designing beyond the happy path", published_date: "2026-04-23" },
  { teaser_title: "Seeing patterns and the bigger picture", published_date: "2025-12-29" },
];

function render_video_grid_story(story_arguments) {
  return render_template(video_grid_template, {
    introduction_text: escape_html(story_arguments.introduction_text),
    pagination_markup: story_arguments.page_count > 1 ? pagination_markup(story_arguments) : "",
    video_items_markup: story_arguments.video_items.map((video_item) =>
      render_template(video_grid_item_template, {
        article_item_markup: article_list_item_markup({ ...story_arguments, ...video_item }),
      }),
    ).join(""),
  });
}

function render_lazy_video_grid(story_arguments) {
  const story_element = document.createElement('div');
  story_element.innerHTML = render_video_grid_story(story_arguments);
  window.requestAnimationFrame(() => initialize_video_grids(story_element, {
    async fetch_page(request_url) {
      await new Promise((resolve_delay) => { window.setTimeout(resolve_delay, LOADING_DELAY); });
      if (story_arguments.simulate_failure) throw new Error('Demonstration request failure.');
      const requested_page = Number(new URL(request_url).hash.replace('#page-', ''));
      return {
        ok: true,
        text: async () => render_video_grid_story({
          ...story_arguments,
          current_page: requested_page,
          video_items: story_arguments.video_items.map((video_item) => ({
            ...video_item,
            teaser_title: `${video_item.teaser_title} — page ${requested_page}`,
          })),
        }),
      };
    },
  }));
  return story_element;
}

export default {
  title: "Organisms/Blog/Video Grid",
  tags: ["autodocs"],
  render: render_video_grid_story,
  parameters: { layout: "fullscreen" },
  args: {
    ...article_list_item_story.args,
    introduction_text: INTRODUCTION_TEXT,
    video_items: VIDEO_ITEMS,
    current_page: CURRENT_PAGE,
    page_count: PAGE_COUNT,
    simulate_failure: SIMULATE_FAILURE,
  },
};

export const default_story = {};
export const lazy_loading = {
  render: render_lazy_video_grid,
  args: { page_count: LAZY_PAGE_COUNT },
};
export const pagination_fallback = {
  args: { page_count: LAZY_PAGE_COUNT },
};
export const loading_failure = {
  render: render_lazy_video_grid,
  args: { page_count: LAZY_PAGE_COUNT, simulate_failure: true },
};
