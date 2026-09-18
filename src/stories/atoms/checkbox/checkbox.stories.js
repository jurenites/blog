import { checkbox_markup } from "./checkbox.markup.js";

const FIELD_ID = "checkbox-option";
const FIELD_NAME = "checkbox_option";
const FIELD_LABEL = "Include this option";
const FIELD_VALUE = "yes";
const ACCESSIBLE_LABEL = "Include this option";
const CHECKBOX_STATE = "empty";
const CHECKBOX_STATES = ["empty", "filled", "partially"];
const IS_REQUIRED = false;
const IS_DISABLED = false;

export default {
  title: "Atoms/Checkbox",
  tags: ["autodocs"],
  render: (story_args, story_context) => `<div class="storybook-stack">${checkbox_markup({
    ...story_args,
    field_id: `${story_args.field_id}-${story_context.id}`,
  })}</div>`,
  parameters: {
    docs: { description: { component: "Native checkbox with supplied empty, filled and partially selected artwork. The 24px input highlights on hover inside a non-interactive 40px square. With a label, the wrapper keeps its 40px height and removes its left padding to bring the label closer. Space toggles the focused control and clears the partial state." } },
  },
  argTypes: {
    field_id: { control: "text" },
    field_name: { control: "text" },
    field_label: { control: "text" },
    field_value: { control: "text" },
    accessible_label: { control: "text" },
    checkbox_state: { control: "select", options: CHECKBOX_STATES },
    is_required: { control: "boolean" },
    is_disabled: { control: "boolean" },
  },
  args: {
    field_id: FIELD_ID,
    field_name: FIELD_NAME,
    field_label: FIELD_LABEL,
    field_value: FIELD_VALUE,
    accessible_label: ACCESSIBLE_LABEL,
    checkbox_state: CHECKBOX_STATE,
    is_required: IS_REQUIRED,
    is_disabled: IS_DISABLED,
  },
};

export const empty_state = {};
export const filled_state = { args: { checkbox_state: "filled" } };
export const partially_state = { args: { checkbox_state: "partially" } };
export const without_label = { args: { field_label: "" } };
export const disabled_state = { args: { is_disabled: true } };
