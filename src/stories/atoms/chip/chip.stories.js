// Atom: Chip/tag. Use Controls for label and destination.
import { chip_markup } from "./chip.markup.js";

const CHIP_LABEL = "#UI/UX Design";
const CHIP_URL = "/blog?tag=ui-ux-design";
const IS_SELECTABLE = false;
const IS_SELECTED = false;
const MANUAL_REFERENCE_LABEL = "#tag";

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
    is_selectable: { control: "boolean" },
    is_selected: { control: "boolean" },
  },
  args: {
    chip_label: CHIP_LABEL,
    chip_url: CHIP_URL,
    is_selectable: IS_SELECTABLE,
    is_selected: IS_SELECTED,
  },
};

export const default_story = {};

export const manual_reference = {
  args: { chip_label: MANUAL_REFERENCE_LABEL },
};
