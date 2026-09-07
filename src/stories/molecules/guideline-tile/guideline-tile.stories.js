import guideline_logo_url from "../../../../web/themes/custom/jurenites_theme/logo.svg?url";
import { guideline_tile_markup } from "./guideline-tile.markup.js";

const GUIDELINE_TITLE = "Logo Icon";
const GUIDELINE_SUMMARY = "The compact Jurenites mark, its source asset, spacing, sizing, and correct use.";
const GUIDELINE_URL = "#";
const PREVIEW_KIND = "logo-icon";
const COLOR_TITLE = "Color";
const COLOR_SUMMARY = "The live foundation, brand, and system palettes generated from the project token source.";

function render_guideline_tile(story_arguments) {
  return `<div class="storybook-stack storybook-stack--wide">${guideline_tile_markup(story_arguments)}</div>`;
}

export default {
  title: "Molecules/Guidelines/Guideline Tile",
  tags: ["autodocs"],
  render: render_guideline_tile,
  argTypes: {
    guideline_title: { control: "text" },
    guideline_summary: { control: "text" },
    guideline_url: { control: "text" },
    preview_kind: {
      control: { type: "select" },
      options: ["logo-icon", "color"],
    },
    logo_icon_url: { control: "text" },
  },
  args: {
    guideline_title: GUIDELINE_TITLE,
    guideline_summary: GUIDELINE_SUMMARY,
    guideline_url: GUIDELINE_URL,
    preview_kind: PREVIEW_KIND,
    logo_icon_url: guideline_logo_url,
  },
};

export const logo_icon = {};

export const color_guideline = {
  name: "Color",
  args: {
    guideline_title: COLOR_TITLE,
    guideline_summary: COLOR_SUMMARY,
    preview_kind: "color",
  },
};

export const overview_grid = {
  render: (story_arguments) => `
    <div class="guidelines-grid">
      <div class="guidelines-grid__item">${guideline_tile_markup(story_arguments)}</div>
      <div class="guidelines-grid__item">${guideline_tile_markup({
        ...story_arguments,
        guideline_title: COLOR_TITLE,
        guideline_summary: COLOR_SUMMARY,
        preview_kind: "color",
      })}</div>
    </div>
  `,
  parameters: {
    controls: { disable: true },
  },
};
