import profile_data from "../../../../web/modules/custom/jurenites_skills/data/skills.json";
import { skills_profile_markup } from "./skills-profile.markup.js";

const SKILL_ITEMS = profile_data.skill_items;
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
  parameters: { docs: { description: { component: "Editable CV-backed technology profile. Decimal ratings are provisional suggestions until personally reviewed, never inferred test results. Missing ratings stay unassessed. Uses the Drupal starter content and shared theme SCSS." } } },
  args: {
    skill_items: SKILL_ITEMS,
  },
  argTypes: {
    skill_items: { control: "object" },
  },
};

export const provisional_ratings = {};
export const not_assessed = { args: { skill_items: UNRATED_ITEMS } };
export const rating_boundaries = { args: { skill_items: BOUNDARY_ITEMS } };
export const mobile_profile = { parameters: { viewport: { defaultViewport: "mobile1" } } };
