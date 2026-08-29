// Atom: Chip/tag. Use Controls for label and accent state.
import { chip_markup } from "./chip.markup.js";

const CHIP_LABEL = "UI/UX Design";
const CHIP_URL = "/blog?tag=ui-ux-design";
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
    chip_url: { control: "text" },
    is_accent: { control: "boolean" },
  },
  args: {
    chip_label: CHIP_LABEL,
    chip_url: CHIP_URL,
    is_accent: IS_ACCENT,
  },
};

export const default_story = {};
