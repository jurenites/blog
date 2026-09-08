import { timeline_markup } from "./timeline.markup.js";

const TIMELINE_HEADING = "Timeline";
const TIMELINE_INTRODUCTION = "Commercial projects ordered by when each engagement began.";
const TIMELINE_CURRENT_DATE = "2026-09-07";
const TIMELINE_ITEMS = [
  {
    item_name: "oksenate.gov",
    item_kind: "project",
    organization_name: "Thrive.io",
    organization_url: "https://thrive.io/",
    periods: [{ start_date: "2026-07-01", end_date: "2026-07-01" }],
    hours_worked: 160,
    item_summary: "Worked on SCSS accessibility, refined the mobile presentation, and upgraded Drupal core and contributed modules.",
    proof_links: [{ label: "Project website", url: "https://oksenate.gov/" }],
  },
  {
    item_name: "Accountia",
    item_kind: "project",
    organization_name: "Thrive.io",
    organization_url: "https://thrive.io/",
    periods: [
      { start_date: "2021-10-01", end_date: "2026-08-01" },
      { start_date: "2020-03-01", end_date: "2020-10-01" },
    ],
    hours_worked: 5500,
    emphasis_kind: "featured",
    item_summary: "Led product design and frontend development for an accounting platform, its Angular interface, and its Storybook design system.",
    proof_links: [
      { label: "Project website", url: "https://accountia.no/" },
      { label: "Figma design", url: "https://www.figma.com/file/4K0S1h3hmZxDLHEXZpaYzU/Accountia" },
    ],
  },
  {
    item_name: "Nokia",
    item_kind: "project",
    organization_name: "Thrive.io",
    organization_url: "https://thrive.io/",
    periods: [{ start_date: "2018-11-01", end_date: "2018-12-01" }],
    hours_worked: 260,
    emphasis_kind: "featured",
  },
  {
    item_name: "Program DB Novo Ministries",
    item_kind: "project",
    organization_name: "Thrive.io",
    organization_url: "https://thrive.io/",
    periods: [{ start_date: "2017-07-01", end_date: "2018-09-01" }],
    hours_worked: 650,
  },
  {
    item_name: "Mullikin Law",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    organization_url: "https://volcanoideas.ae/",
    periods: [{ start_date: "2011-06-01", end_date: "2011-08-01" }],
    hours_worked: 50,
    emphasis_kind: "heart",
  },
  {
    item_name: "Oklahoma Children's Theatre",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    organization_url: "https://volcanoideas.ae/",
    periods: [{ start_date: "2011-06-01", end_date: "2012-12-01" }],
    hours_worked: 600,
    emphasis_kind: "featured",
  },
  {
    item_name: "HIPAA Security Assessment Toolkit",
    item_kind: "project",
    organization_name: "VolcanoIdeas.ae",
    organization_url: "https://volcanoideas.ae/",
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
    timeline_current_date: TIMELINE_CURRENT_DATE,
  },
};

export const commercial_projects_timeline = {};
