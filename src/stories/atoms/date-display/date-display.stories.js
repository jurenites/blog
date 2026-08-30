// Atom: Date Display. Show an absolute date or an elapsed time since a date.
import { date_display_markup } from "./date-display.markup.js";
import { token_value } from "../../foundations/token-values.js";

const VALUE_MODE = token_value("component-date-display-default-mode");
const SOURCE_DATE = new Date(Date.now() - (85 * 60000)).toISOString();
const DISPLAY_VARIANT = token_value("component-date-display-default-display");

const VALUE_MODE_OPTIONS = ["month-day-year", "time-since"];
const DISPLAY_VARIANT_OPTIONS = ["date-day", "date-day-time"];

function render_story({ value_mode, source_date, display_variant }) {
  return date_display_markup({
    source_date,
    value_mode,
    display_variant,
  });
}

export default {
  title: "Atoms/Date Display",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    value_mode: {
      control: { type: "inline-radio" },
      options: VALUE_MODE_OPTIONS,
    },
    source_date: { control: "date" },
    display_variant: {
      description: "Controls whether an absolute date includes its time.",
      control: { type: "inline-radio" },
      options: DISPLAY_VARIANT_OPTIONS,
      type: {
        name: "enum",
        value: DISPLAY_VARIANT_OPTIONS,
      },
      table: {
        type: {
          summary: DISPLAY_VARIANT_OPTIONS.map((option_name) => `"${option_name}"`).join(" | "),
        },
      },
    },
  },
  args: {
    value_mode: VALUE_MODE,
    source_date: SOURCE_DATE,
    display_variant: DISPLAY_VARIANT,
  },
};

export const default_story = {};
