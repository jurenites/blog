import { font_preview_markup } from "../font-preview/font-preview.markup.js";

const FONT_TITLE = "Roundabout";
const FONT_URL = "/assets/fonts/roundabout-regular.ttf";
const DOWNLOAD_FILENAME = "roundabout-regular.ttf";
const SAMPLE_TEXT = "The quick brown fox jumps over the lazy dog.";

export default {
  title: "Organisms/Font Preview/Roundabout",
  parameters: { layout: "padded" },
  args: {
    font_title: FONT_TITLE,
    sample_text: SAMPLE_TEXT,
  },
};

export const INTERACTIVE_PREVIEW = {
  render: ({ font_title, sample_text }) => font_preview_markup({
    component_id: "roundabout-font-preview",
    font_identifier: "roundabout",
    font_title,
    font_url: FONT_URL,
    download_filename: DOWNLOAD_FILENAME,
    sample_text,
  }),
};
