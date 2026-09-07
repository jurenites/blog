import guideline_logo_url from "../../../../web/themes/custom/jurenites_theme/logo.svg?url";
import { guideline_detail_markup } from "./guideline-detail.markup.js";

const GUIDELINE_SUMMARY = "The compact Jurenites mark, its source asset, spacing, sizing, and correct use.";
const GUIDELINE_BODY = "<h2>One source asset</h2><p>Use the checked-in SVG as the authoritative artwork so every surface stays aligned.</p><h2>Correct use</h2><ul><li>Keep the square aspect ratio.</li><li>Preserve the white field and black pixel artwork.</li></ul>";
const PREVIEW_KIND = "logo-icon";
const COLOR_SUMMARY = "The live foundation, brand, and system palettes generated from the project token source.";
const COLOR_BODY = "<h2>Palette and meaning</h2><p>Components should normally consume semantic theme tokens instead of raw palette values.</p>";

function render_guideline_detail(story_arguments) {
  return `<main class="storybook-stack storybook-stack--wide">${guideline_detail_markup(story_arguments)}</main>`;
}

export default {
  title: "Organisms/Guidelines/Guideline Detail",
  tags: ["autodocs"],
  render: render_guideline_detail,
  argTypes: {
    guideline_summary: { control: "text" },
    guideline_body: { control: "text" },
    preview_kind: {
      control: { type: "select" },
      options: ["logo-icon", "color"],
    },
    logo_icon_url: { control: "text" },
  },
  args: {
    guideline_summary: GUIDELINE_SUMMARY,
    guideline_body: GUIDELINE_BODY,
    preview_kind: PREVIEW_KIND,
    logo_icon_url: guideline_logo_url,
  },
};

export const logo_icon = {};

export const color_guideline = {
  name: "Color",
  args: {
    guideline_summary: COLOR_SUMMARY,
    guideline_body: COLOR_BODY,
    preview_kind: "color",
  },
};
