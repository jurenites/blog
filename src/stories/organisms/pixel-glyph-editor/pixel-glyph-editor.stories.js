import { pixel_glyph_editor_markup } from "./pixel-glyph-editor.markup.js";

const COMPONENT_ID = "four-pixel-glyph-editor";

export default {
  title: "Organisms/Pixel Glyph Editor",
  parameters: { layout: "padded" },
};

export const BLANK_GRID = {
  render: () => pixel_glyph_editor_markup({ component_id: COMPONENT_ID }),
};
