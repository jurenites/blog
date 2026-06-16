// Atom: Chip/tag. Use Controls for label and accent state.
import chip_template from "./chip.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ chip_label, is_accent }) {
  return render_template(chip_template, {
    modifier: is_accent ? " chip--accent" : "",
    label: escape_html(chip_label),
  });
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
    chip_label: "UI/UX",
    is_accent: false,
  },
};

export const default_story = {};
