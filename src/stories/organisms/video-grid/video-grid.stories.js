import article_list_item_story from "../../molecules/article-list-item/article-list-item.stories.js";
import { article_list_item_markup } from "../../molecules/article-list-item/article-list-item.markup.js";
import { escape_html, render_template } from "../../template.js";
import video_grid_template from "./video-grid.template.html?raw";
import video_grid_item_template from "./video-grid-item.template.html?raw";

const INTRODUCTION_TEXT = "These are videos I’ve enjoyed and think are worth watching to learn something new. Some explore topics I haven’t covered elsewhere on this site.";
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
    video_items_markup: story_arguments.video_items.map((video_item) =>
      render_template(video_grid_item_template, {
        article_item_markup: article_list_item_markup({ ...story_arguments, ...video_item }),
      }),
    ).join(""),
  });
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
  },
};

export const default_story = {};
