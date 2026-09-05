import { input_text_markup } from "./input-text.markup.js";

const FIELD_DATA_TYPE = "string";
const FIELD_CONTROL = "text";
const FIELD_ID = "profile-value";
const FIELD_NAME = "profile_value";
const FIELD_LABEL = "Profile value";
const FIELD_PLACEHOLDER = "Enter a value";
const FIELD_DESCRIPTION = "Use the controls to preview the standard Drupal field presentations.";
const VALIDATION_STATE = "default";
const VALIDATION_MESSAGE = "Review this field before continuing.";
const CHOICE_OPTIONS = "Yes, No";
const SELECTED_VALUES = "Yes";
const IS_REQUIRED = false;
const IS_DISABLED = false;

const FIELD_CONTROL_OPTIONS = [
  "text",
  "password",
  "textarea",
  "select",
  "single-checkbox",
  "radio-group",
  "checkbox-group",
  "choice-chips",
  "file-upload",
];
const FIELD_DATA_TYPE_OPTIONS = ["string", "long-text", "boolean", "list", "file"];
const VALIDATION_STATE_OPTIONS = ["default", "error"];

function render_story(story_args) {
  return `<div class="storybook-stack storybook-stack--medium">${input_text_markup(story_args)}</div>`;
}

export default {
  title: "Molecules/Input fields/Input text",
  tags: ["autodocs"],
  render: render_story,
  parameters: {
    docs: {
      description: {
        component: "One Drupal-compatible field composition with nine standard control families. Use Controls for type, required, disabled, selection, and validation states.",
      },
    },
  },
  argTypes: {
    field_data_type: { control: { type: "inline-radio" }, options: FIELD_DATA_TYPE_OPTIONS },
    field_control: { control: { type: "select" }, options: FIELD_CONTROL_OPTIONS },
    field_id: { control: "text" },
    field_name: { control: "text" },
    field_label: { control: "text" },
    field_placeholder: { control: "text" },
    field_description: { control: "text" },
    validation_state: { control: { type: "inline-radio" }, options: VALIDATION_STATE_OPTIONS },
    validation_message: { control: "text" },
    choice_options: { control: "text" },
    selected_values: { control: "text" },
    is_required: { control: "boolean" },
    is_disabled: { control: "boolean" },
  },
  args: {
    field_data_type: FIELD_DATA_TYPE,
    field_control: FIELD_CONTROL,
    field_id: FIELD_ID,
    field_name: FIELD_NAME,
    field_label: FIELD_LABEL,
    field_placeholder: FIELD_PLACEHOLDER,
    field_description: FIELD_DESCRIPTION,
    validation_state: VALIDATION_STATE,
    validation_message: VALIDATION_MESSAGE,
    choice_options: CHOICE_OPTIONS,
    selected_values: SELECTED_VALUES,
    is_required: IS_REQUIRED,
    is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
