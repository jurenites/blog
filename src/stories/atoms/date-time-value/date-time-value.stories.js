// Atom: Date Time Value. Show dates, elapsed time, and read/watch durations.
import { date_time_value_markup } from "./date-time-value.markup.js";
import { token_value } from "../../foundations/token-values.js";

const VALUE_KIND = token_value("component-date-time-value-default-kind");
const SOURCE_DATE = new Date(Date.now() - (85 * 60000)).toISOString();
const DATE_DISPLAY_VARIANT = token_value("component-date-time-value-default-date-display");
const DURATION_MINUTES = 1;
const DURATION_LABEL = "min to read";

const VALUE_KIND_OPTIONS = ["absolute-date", "elapsed-time", "duration"];
const DATE_DISPLAY_VARIANT_OPTIONS = ["date-day", "date-day-time"];

function render_date_time_value_story(story_arguments) {
  return date_time_value_markup(story_arguments);
}

export default {
  title: "Atoms/Date Time Value",
  tags: ["autodocs"],
  render: render_date_time_value_story,
  argTypes: {
    value_kind: {
      control: { type: "inline-radio" },
      options: VALUE_KIND_OPTIONS,
    },
    source_date: { control: "date" },
    date_display_variant: {
      description: "Controls the absolute date shown by date-based variants.",
      control: { type: "inline-radio" },
      options: DATE_DISPLAY_VARIANT_OPTIONS,
      type: {
        name: "enum",
        value: DATE_DISPLAY_VARIANT_OPTIONS,
      },
      table: {
        type: {
          summary: DATE_DISPLAY_VARIANT_OPTIONS.map((option_name) => `"${option_name}"`).join(" | "),
        },
      },
    },
    duration_minutes: {
      control: { type: "number", min: 1, step: 1 },
    },
    duration_label: { control: "text" },
  },
  args: {
    value_kind: VALUE_KIND,
    source_date: SOURCE_DATE,
    date_display_variant: DATE_DISPLAY_VARIANT,
    duration_minutes: DURATION_MINUTES,
    duration_label: DURATION_LABEL,
  },
};

export const absolute_date = {};

export const elapsed_time = {
  args: {
    value_kind: "elapsed-time",
    relative_suffix: "ago",
  },
};

export const reading_duration = {
  args: {
    value_kind: "duration",
  },
};

export const video_duration = {
  args: {
    value_kind: "duration",
    duration_minutes: 20,
    duration_label: "min to watch",
  },
};
