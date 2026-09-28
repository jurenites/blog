// Atom: Inline code snippet. Use Controls for the text and containing surface.
import { inline_code_markup } from "./inline-code.markup.js";
import { escape_html } from "../../template.js";
import { surface_markup } from "../surface/surface.markup.js";

const SENTENCE_PREFIX = "Run";
const SENTENCE_SUFFIX = "to compile the current theme assets.";
const SNIPPET_TEXT = "npm run build:theme";
const SURFACE_VARIANT = "default";

const SURFACE_VARIANT_OPTIONS = ["default", "raised"];

function render_story({ snippet_text, surface_variant, sentence_prefix, sentence_suffix }) {
  return surface_markup({
    surface_variant,
    nested_content: `<p>${escape_html(sentence_prefix)} ${inline_code_markup({ snippet_text })} ${escape_html(sentence_suffix)}</p>`,
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
    sentence_prefix: SENTENCE_PREFIX,
    sentence_suffix: SENTENCE_SUFFIX,
    surface_variant: SURFACE_VARIANT,
  },
};

export const default_story = {};

export const raised_surface = {
  args: {
    surface_variant: "raised",
  },
};
