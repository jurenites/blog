import { pull_quote_markup } from "./pull-quote.markup.js";

const QUOTE_TEXT = "A useful design system makes the ordinary decisions quiet, repeatable, and easy to trust.";
const CITATION_TEXT = "Notes on maintaining a personal publishing system";

function render_story(story_args) {
  return pull_quote_markup(story_args);
}

export default {
  title: "Molecules/Pull Quote",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    quote_text: { control: "text" },
    citation_text: { control: "text" },
  },
  args: {
    quote_text: QUOTE_TEXT,
    citation_text: CITATION_TEXT,
  },
};

export const default_story = {};
