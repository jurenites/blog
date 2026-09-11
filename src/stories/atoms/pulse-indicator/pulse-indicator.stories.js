import { pulse_indicator_markup } from "./pulse-indicator.markup.js";

const IS_ANIMATION_PAUSED = false;

function render_story(story_args) {
  return `<div class="storybook-shell storybook-shell--pulse-indicator-preview">${pulse_indicator_markup(story_args)}</div>`;
}

export default {
  title: "Atoms/Pulse Indicator",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    is_animation_paused: {
      control: "boolean",
      description: "Pauses the expanding radius so its current frame can be inspected.",
    },
  },
  args: {
    is_animation_paused: IS_ANIMATION_PAUSED,
  },
};

export const default_story = {};

export const paused_state = {
  name: "Paused",
  args: {
    is_animation_paused: true,
  },
};
