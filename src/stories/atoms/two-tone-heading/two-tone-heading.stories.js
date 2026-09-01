import { two_tone_heading_markup } from "./two-tone-heading.markup.js";

const HEADING_LEVEL = "h3";
const HEADING_LEVEL_OPTIONS = ["h3", "h4", "h5", "h6"];
const LEADING_TEXT = "I design digital systems";
const SOFT_TEXT = "that stay useful as they grow";
const TRAILING_TEXT = "";
const SOFT_TEXT_PLACEMENT = "new-line";
const TRAILING_TEXT_PLACEMENT = "inline";
const TEXT_PLACEMENT_OPTIONS = ["inline", "new-line"];

function render_two_tone_heading(story_args) {
  return two_tone_heading_markup(story_args);
}

export default {
  title: "Atoms/Two-tone Heading",
  tags: ["autodocs"],
  render: render_two_tone_heading,
  parameters: {
    docs: {
      description: {
        component: "A semantic heading assembled from plain-text strong and soft segments. Placement controls support two colored lines or a soft phrase between strong phrases without WYSIWYG markup.",
      },
    },
  },
  argTypes: {
    heading_level: { control: { type: "inline-radio" }, options: HEADING_LEVEL_OPTIONS },
    leading_text: { control: "text" },
    soft_text: { control: "text" },
    trailing_text: { control: "text" },
    soft_text_placement: { control: { type: "inline-radio" }, options: TEXT_PLACEMENT_OPTIONS },
    trailing_text_placement: { control: { type: "inline-radio" }, options: TEXT_PLACEMENT_OPTIONS },
  },
  args: {
    heading_level: HEADING_LEVEL,
    leading_text: LEADING_TEXT,
    soft_text: SOFT_TEXT,
    trailing_text: TRAILING_TEXT,
    soft_text_placement: SOFT_TEXT_PLACEMENT,
    trailing_text_placement: TRAILING_TEXT_PLACEMENT,
  },
};

export const default_story = {};
