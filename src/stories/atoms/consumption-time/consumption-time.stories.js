// Atom: Consumption Time. Show a read or watch duration with split color roles.
import { consumption_time_markup } from "./consumption-time.markup.js";

const CONSUMPTION_TIME_MINUTES = 1;
const CONSUMPTION_TIME_LABEL = "min to read";
const VIDEO_TIME_MINUTES = 20;
const VIDEO_TIME_LABEL = "min to watch";

function render_consumption_time_story(story_arguments) {
  return consumption_time_markup(story_arguments);
}

export default {
  title: "Atoms/Consumption Time",
  tags: ["autodocs"],
  render: render_consumption_time_story,
  argTypes: {
    consumption_time_minutes: {
      control: { type: "number", min: 1, step: 1 },
    },
    consumption_time_label: { control: "text" },
  },
  args: {
    consumption_time_minutes: CONSUMPTION_TIME_MINUTES,
    consumption_time_label: CONSUMPTION_TIME_LABEL,
  },
};

export const default_story = {};

export const video_duration = {
  args: {
    consumption_time_minutes: VIDEO_TIME_MINUTES,
    consumption_time_label: VIDEO_TIME_LABEL,
  },
};
