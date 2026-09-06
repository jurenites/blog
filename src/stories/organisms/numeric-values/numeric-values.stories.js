import { numeric_values_markup } from "./numeric-values.markup.js";

const SECTION_LABEL = "Professional experience in numbers";
const PROJECT_NUMBER = "80+";
const PROJECT_DESCRIPTION = "Projects I’ve worked on";
const PROJECT_ICON_URL = "";
const CAREER_NUMBER = "16";
const CAREER_DESCRIPTION = "Years I’ve worked in IT";
const CAREER_ICON_URL = "";
const LARGE_PROJECT_NUMBER = "10,000+";

function render_numeric_values(story_args) {
  return numeric_values_markup({
    section_label: story_args.section_label,
    numeric_items: [
      {
        numeric_number: story_args.project_number,
        numeric_description: story_args.project_description,
        numeric_icon_url: story_args.project_icon_url,
      },
      {
        numeric_number: story_args.career_number,
        numeric_description: story_args.career_description,
        numeric_icon_url: story_args.career_icon_url,
      },
    ],
  });
}

export default {
  title: "Organisms/Numeric Values",
  tags: ["autodocs"],
  render: render_numeric_values,
  parameters: {
    docs: {
      description: {
        component: "A Home-page-ready list of up to eight statistic tiles, with no more than four per row. Each tile pairs an optional attached SVG, an authored 64px h2 Number, and subtitle-1 Text; long grouped values use the compact number-size token so affixes remain inside the tile. When a tile enters the viewport, its integer rolls once from zero to the authored value with a short, decelerating drum motion; reduced-motion visitors see the final value immediately. Attached artwork keeps its intrinsic dimensions and aspect ratio, with an 80px maximum width.",
      },
    },
  },
  argTypes: {
    section_label: { control: "text" },
    project_number: { control: "text" },
    project_description: { control: "text" },
    project_icon_url: { control: "text" },
    career_number: { control: "text" },
    career_description: { control: "text" },
    career_icon_url: { control: "text" },
  },
  args: {
    section_label: SECTION_LABEL,
    project_number: PROJECT_NUMBER,
    project_description: PROJECT_DESCRIPTION,
    project_icon_url: PROJECT_ICON_URL,
    career_number: CAREER_NUMBER,
    career_description: CAREER_DESCRIPTION,
    career_icon_url: CAREER_ICON_URL,
  },
};

export const default_story = {};

export const large_value_story = {
  args: {
    project_number: LARGE_PROJECT_NUMBER,
  },
};
