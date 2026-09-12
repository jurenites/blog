import { blockquote_markup } from "./blockquote.markup.js";

const QUOTE_TEXT = "A useful design system makes the ordinary decisions quiet, repeatable, and easy to trust.";
const CONTINUATION_TEXT = "Longer quotations keep their paragraph breaks, giving each thought enough room to be read in context.";

export default {
  title: "Atoms/Blockquote",
  tags: ["autodocs"],
  render: blockquote_markup,
  argTypes: {
    quote_text: { control: "text" },
    continuation_text: { control: "text" },
  },
  args: {
    quote_text: QUOTE_TEXT,
    continuation_text: CONTINUATION_TEXT,
  },
};

export const default_story = {};
