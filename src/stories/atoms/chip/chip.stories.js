// Atom: Chip/tag. Use Controls for label and accent state.
import { chip_markup } from "./chip.markup.js";

const CHIP_LABEL = "UI/UX";
const IS_ACCENT = false;

function render_story(story_args) {
  return chip_markup(story_args);
}

export default {
  title: "Atoms/Chip",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    chip_label: { control: "text" },
    is_accent: { control: "boolean" },
  },
  args: {
    chip_label: CHIP_LABEL,
    is_accent: IS_ACCENT,
  },
};

export const default_story = {};
