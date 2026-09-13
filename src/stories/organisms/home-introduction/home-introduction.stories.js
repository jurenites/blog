import intro_template from "./home-introduction.template.html?raw";
import { two_tone_heading_markup } from "../../atoms/two-tone-heading/two-tone-heading.markup.js";
import { escape_html, render_template } from "../../template.js";

const LEADING_TEXT = "Personal Blog";
const SOFT_TEXT = "& Showcase projects";
const INTRO_DESCRIPTION = "Articles, videos I’ve liked on YouTube, and my own thoughts on various topics. A place to share my projects and take a closer look at the interfaces of others.";

function render_story(story_args) {
  return render_template(intro_template, {
    heading_markup: two_tone_heading_markup({
      heading_level: "h1",
      leading_text: story_args.leading_text,
      soft_text: story_args.soft_text,
      soft_text_placement: "new-line",
    }),
    intro_description: escape_html(story_args.intro_description),
  });
}

export default {
  title: "Organisms/Home Introduction",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    leading_text: { control: "text" },
    soft_text: { control: "text" },
    intro_description: { control: "text" },
  },
  args: {
    leading_text: LEADING_TEXT,
    soft_text: SOFT_TEXT,
    intro_description: INTRO_DESCRIPTION,
  },
};

export const default_story = {};
