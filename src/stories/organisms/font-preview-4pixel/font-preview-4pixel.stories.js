import { font_preview_markup } from "../font-preview/font-preview.markup.js";
import { pixel_glyph_editor_markup } from "../pixel-glyph-editor/pixel-glyph-editor.markup.js";

const FONT_TITLE = "4pixel";
const FONT_URL = "/assets/fonts/4pixel.ttf";
const DOWNLOAD_FILENAME = "4pixel.ttf";
const SAMPLE_TEXT = "Five big quacking zephyrs jolt my wax bed.";

export default {
  title: "Organisms/Font Preview/4pixel",
  parameters: { layout: "padded" },
  args: {
    font_title: FONT_TITLE,
    sample_text: SAMPLE_TEXT,
  },
};

export const INTERACTIVE_PREVIEW = {
  render: ({ font_title, sample_text }) => `
    <div class="storybook-stack storybook-stack--wide">
      ${font_preview_markup({
        before_data_content: pixel_glyph_editor_markup({ component_id: "four-pixel-editor" }),
        component_id: "four-pixel-font-preview",
        font_identifier: "4pixel",
        font_title,
        font_url: FONT_URL,
        download_filename: DOWNLOAD_FILENAME,
        sample_text,
      })}
    </div>
  `,
};
