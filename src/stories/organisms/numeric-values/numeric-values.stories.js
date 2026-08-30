import { elapsed_years_value, numeric_values_markup } from "./numeric-values.markup.js";

const SECTION_LABEL = "Professional experience in numbers";
const PROJECT_NUMBER = "80+";
const PROJECT_DESCRIPTION = "Projects I’ve worked on";
const CAREER_START_YEAR = 2010;
const CAREER_DESCRIPTION = "Years I’ve worked in IT";

function render_numeric_values(story_args) {
  return numeric_values_markup({
    section_label: story_args.section_label,
    numeric_items: [
      {
        numeric_number: story_args.project_number,
        numeric_description: story_args.project_description,
      },
      {
        numeric_number: elapsed_years_value(story_args.career_start_year),
        numeric_description: story_args.career_description,
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
        component: "A Home-page-ready list of statistic tiles. Each tile pairs a semantic 64px h2 Number with a subtitle-1 Description; the career example calculates elapsed years from 2010 at render time.",
      },
    },
  },
  argTypes: {
    section_label: { control: "text" },
    project_number: { control: "text" },
    project_description: { control: "text" },
    career_start_year: { control: { type: "number", min: 1900, max: 2100, step: 1 } },
    career_description: { control: "text" },
  },
  args: {
    section_label: SECTION_LABEL,
    project_number: PROJECT_NUMBER,
    project_description: PROJECT_DESCRIPTION,
    career_start_year: CAREER_START_YEAR,
    career_description: CAREER_DESCRIPTION,
  },
};

export const default_story = {};
