// Atom: Icon. SVG geometry is stored in the shared public icon assets folder.
import { icon_markup } from "./icon.markup.js";

const ICON_NAME = "arrow-left";
const CLASS_NAME = "";

function render_story(story_args) {
  return icon_markup(story_args);
}

export default {
  title: "Atoms/Icon",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    icon_name: { control: "text" },
    class_name: { control: "text" },
  },
  args: {
    icon_name: ICON_NAME,
    class_name: CLASS_NAME,
  },
};

export const default_story = {};
