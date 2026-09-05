import { select_input_markup } from "./select-input.markup.js";
import { escape_html } from "../../template.js";

const FIELD_ID = "preferred-topic";
const FIELD_NAME = "preferred_topic";
const FIELD_LABEL = "Preferred topic";
const OPTION_ITEMS = ["Design systems", "Drupal", "Storybook", "Accessibility"];
const SELECTED_VALUE = "Drupal";
const IS_REQUIRED = false;
const IS_DISABLED = false;

function render_story(story_args) {
  const required_indicator_markup = story_args.is_required
    ? '<span class="input-text__required" aria-hidden="true">&#x20;*</span>'
    : "";

  return `
    <div class="storybook-stack storybook-stack--medium">
      <div class="input-text__label-control">
        <label class="input-text__label" for="${escape_html(story_args.field_id)}">${escape_html(story_args.field_label)}${required_indicator_markup}</label>
        ${select_input_markup(story_args)}
      </div>
    </div>
  `;
}

export default {
  title: "Molecules/Input fields/Select Input",
  tags: ["autodocs"],
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "A progressively enhanced native select with a 40px trigger, custom option menu, selected state, and keyboard-accessible fallback.",
      },
    },
  },
  argTypes: {
    field_id: { control: "text" },
    field_name: { control: "text" },
    field_label: { control: "text" },
    option_items: { control: "object" },
    selected_value: { control: "text" },
    is_required: { control: "boolean" },
    is_disabled: { control: "boolean" },
  },
  args: {
    field_id: FIELD_ID,
    field_name: FIELD_NAME,
    field_label: FIELD_LABEL,
    option_items: OPTION_ITEMS,
    selected_value: SELECTED_VALUE,
    is_required: IS_REQUIRED,
    is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
