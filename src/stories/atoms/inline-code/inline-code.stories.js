// Atom: Inline code snippet. Use Controls for the text and containing surface.
import { inline_code_markup } from "./inline-code.markup.js";
import { surface_markup } from "../surface/surface.markup.js";

const SNIPPET_TEXT = "npm run build:theme";
const SURFACE_VARIANT = "default";

const SURFACE_VARIANT_OPTIONS = ["default", "raised"];

function render_story({ snippet_text, surface_variant }) {
  return surface_markup({
    surface_variant,
    nested_content: inline_code_markup({ snippet_text }),
  });
}

export default {
  title: "Atoms/Inline Code",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    snippet_text: { control: "text" },
    surface_variant: {
      control: { type: "inline-radio" },
      options: SURFACE_VARIANT_OPTIONS,
    },
  },
  args: {
    snippet_text: SNIPPET_TEXT,
    surface_variant: SURFACE_VARIANT,
  },
};

export const default_story = {};

export const raised_surface = {
  args: {
    surface_variant: "raised",
  },
};
