import { text_input_markup } from "./text-input.markup.js";

const INPUT_ID = "reader-email";
const INPUT_LABEL = "Email address";
const INPUT_NAME = "reader_email";
const INPUT_TYPE = "email";
const INPUT_PLACEHOLDER = "reader@example.com";
const HINT_TEXT = "Used only for new article notifications.";
const IS_REQUIRED = true;

function render_story(story_args) {
  return `<div class="storybook-stack storybook-stack--medium">${text_input_markup(story_args)}</div>`;
}

export default {
  title: "Atoms/Text Input",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    input_id: { control: "text" },
    input_label: { control: "text" },
    input_name: { control: "text" },
    input_type: {
      control: { type: "select" },
      options: ["text", "email", "search", "url"],
    },
    input_placeholder: { control: "text" },
    hint_text: { control: "text" },
    is_required: { control: "boolean" },
  },
  args: {
    input_id: INPUT_ID,
    input_label: INPUT_LABEL,
    input_name: INPUT_NAME,
    input_type: INPUT_TYPE,
    input_placeholder: INPUT_PLACEHOLDER,
    hint_text: HINT_TEXT,
    is_required: IS_REQUIRED,
  },
};

export const default_story = {};
