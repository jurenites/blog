// Atom: Crossfade Dot. Use Controls to inspect inactive and active states.
import { crossfade_dot_markup } from "./crossfade-dot.markup.js";

const DOT_LABEL = "Show image 1 of 2";
const IS_ACTIVE = false;

function render_story(story_args) {
  return crossfade_dot_markup(story_args);
}

export default {
  title: "Atoms/Crossfade Dot",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    dot_label: { control: "text" },
    is_active: { control: "boolean" },
  },
  args: {
    dot_label: DOT_LABEL,
    is_active: IS_ACTIVE,
  },
};

export const default_story = {};
