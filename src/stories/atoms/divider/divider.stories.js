// Atom: Divider. Use Controls for the strong variant.
import divider_template from "./divider.template.html?raw";
import { render_template } from "../../template.js";

const IS_STRONG = false;

function render_story({ is_strong }) {
  return render_template(divider_template, { modifier: is_strong ? " divider--strong" : "" });
}

export default {
  title: "Atoms/Divider",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    is_strong: { control: "boolean" },
  },
  args: {
    is_strong: IS_STRONG,
  },
};

export const default_story = {};
