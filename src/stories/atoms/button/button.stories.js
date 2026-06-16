// Atom: Button. One story; use the Controls tab for every variant combination.
import { button_markup } from "./button.markup.js";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";

const BUTTON_LABEL = "Contact me";
const STYLE_VARIANT = token_default_option("component-button-default-style", "component-button-style-");
const IS_DISABLED = false;

const style_variant_options = token_option_names("component-button-style-");

function render_story(story_args) {
  return button_markup(story_args);
}

export default {
  title: "Atoms/Button",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    button_label: { control: "text" },
    style_variant: {
      control: { type: "inline-radio" },
      options: style_variant_options,
    },
    is_disabled: { control: "boolean" },
  },
  args: {
    button_label: BUTTON_LABEL,
    style_variant: STYLE_VARIANT,
    is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
