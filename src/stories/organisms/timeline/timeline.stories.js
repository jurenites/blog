import { timeline_markup } from "./timeline.markup.js";

const TIMELINE_HEADING = "Timeline";
const TIMELINE_INTRODUCTION = "Commercial projects and personal milestones, ordered by when each story began.";
const TIMELINE_ITEMS = [
  {
    item_name: "oksenate.gov",
    item_kind: "project",
    organization_name: "Thrive.io",
    periods: [{ start_date: "2026-07-01", end_date: "2026-07-01" }],
    hours_worked: 160,
  },
  {
    item_name: "Accountia",
    item_kind: "project",
    organization_name: "Thrive.io",
    periods: [
      { start_date: "2021-10-01", end_date: "2026-08-01" },
      { start_date: "2020-03-01", end_date: "2020-10-01" },
    ],
    hours_worked: 5500,
    emphasis_kind: "featured",
  },
  {
    item_name: "My daughter's birthday",
    item_kind: "event",
    periods: [{ start_date: "2023-11-09", end_date: "2023-11-09" }],
    item_summary: "A personal milestone.",
  },
  {
    item_name: "Nokia",
    item_kind: "project",
    organization_name: "Thrive.io",
    periods: [{ start_date: "2018-11-01", end_date: "2018-12-01" }],
    hours_worked: 260,
    emphasis_kind: "featured",
  },
  {
    item_name: "Program DB Novo Ministries",
    item_kind: "project",
    organization_name: "Thrive.io",
    periods: [{ start_date: "2017-07-01", end_date: "2018-09-01" }],
    hours_worked: 650,
  },
  {
    item_name: "Mullikin Law",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    periods: [{ start_date: "2011-06-01", end_date: "2011-08-01" }],
    hours_worked: 50,
    emphasis_kind: "heart",
  },
  {
    item_name: "Oklahoma Children's Theatre",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    periods: [{ start_date: "2011-06-01", end_date: "2012-12-01" }],
    hours_worked: 600,
    emphasis_kind: "featured",
  },
  {
    item_name: "HIPAA Security Assessment Toolkit",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    periods: [{ start_date: "2010-11-01", end_date: "2010-12-01" }],
    hours_worked: 100,
  },
];

function render_timeline_story(story_arguments) {
  return timeline_markup(story_arguments);
}

export default {
  title: "Organisms/Timeline",
  tags: ["autodocs"],
  render: render_timeline_story,
  args: {
    timeline_heading: TIMELINE_HEADING,
    timeline_introduction: TIMELINE_INTRODUCTION,
    timeline_items: TIMELINE_ITEMS,
  },
};

export const career_and_life_timeline = {};
