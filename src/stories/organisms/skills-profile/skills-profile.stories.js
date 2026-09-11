import profile_data from "../../../../web/modules/custom/jurenites_skills/data/skills.json";
import { skills_profile_markup } from "./skills-profile.markup.js";

const SECTION_HEADING = profile_data.section_heading;
const SECTION_DESCRIPTION = profile_data.section_description;
const SUPPORTING_NOTE = profile_data.supporting_note;
const SKILL_ITEMS = profile_data.skill_items;
const RATINGS_REVIEWED = false;
const TIMELINE_URL = "/timeline";
const UNRATED_ITEMS = SKILL_ITEMS.map((skill_item) => ({ ...skill_item, skill_score: null }));
const BOUNDARY_ITEMS = [
  { ...SKILL_ITEMS[0], skill_score: 0 },
  { ...SKILL_ITEMS[1], skill_score: 5 },
  { ...SKILL_ITEMS[2], skill_score: null },
];

export default {
  title: "Organisms/Skills Profile",
  tags: ["autodocs"],
  render: skills_profile_markup,
  parameters: { docs: { description: { component: "Editable CV-backed technology profile. Decimal ratings are provisional suggestions until personally reviewed, never inferred test results. Native details explains the scale; missing ratings stay unassessed. Uses the Drupal starter content and shared theme SCSS." } } },
  args: {
    section_heading: SECTION_HEADING, section_description: SECTION_DESCRIPTION,
    supporting_note: SUPPORTING_NOTE, skill_items: SKILL_ITEMS,
    ratings_reviewed: RATINGS_REVIEWED, timeline_url: TIMELINE_URL,
  },
  argTypes: {
    section_heading: { control: "text" }, section_description: { control: "text" },
    supporting_note: { control: "text" }, skill_items: { control: "object" },
    ratings_reviewed: { control: "boolean" }, timeline_url: { control: "text" },
  },
};

export const provisional_ratings = {};
export const reviewed_ratings = { args: { ratings_reviewed: true } };
export const not_assessed = { args: { skill_items: UNRATED_ITEMS } };
export const rating_boundaries = { args: { skill_items: BOUNDARY_ITEMS } };
export const mobile_profile = { parameters: { viewport: { defaultViewport: "mobile1" } } };
