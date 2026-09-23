import audit_template from "./website-audit.template.html?raw";
import { button_link_markup } from "../../atoms/button/button.markup.js";
import { escape_html, render_template } from "../../template.js";

const SECTION_HEADING = "Website audit.";
const REPORT_DESCRIPTION = "We will analyze all technical and UX weaknesses of your current site and prepare a clear report with an action plan.";
const REPORT_HEADING = "What the report includes:";
const REPORT_ITEMS = [
  "Analysis of load speed and performance",
  "Check of responsiveness and mobile version",
  "SEO audit: meta tags, structure, indexing",
  "Usability and user experience analysis",
  "Assessment of code quality and architecture",
  "Recommendations for improving conversion rates",
];
const OFFER_HEADING = "Free";
const OFFER_DESCRIPTION = "A website audit is completely free for all new clients.";
const TURNAROUND_LABEL = "Turnaround time:";
const BUSINESS_DAYS = 3;
const BUTTON_LABEL = "Order";
const CONTACT_URL = "/contact";

function render_story(story_args) {
  return render_template(audit_template, {
    ...Object.fromEntries(Object.entries(story_args).map(([argument_name, argument_value]) => [argument_name, escape_html(argument_value)])),
    report_items: story_args.report_items.map((report_item) => `<li>${escape_html(report_item)}</li>`).join(""),
    order_button: button_link_markup({
      button_label: story_args.button_label,
      link_url: story_args.contact_url,
      style_variant: "primary",
      additional_class_names: "website-audit__order-button",
    }),
  });
}

export default {
  title: "Organisms/Section/Website Audit",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    section_heading: { control: "text" },
    report_description: { control: "text" },
    report_heading: { control: "text" },
    report_items: { control: "object" },
    offer_heading: { control: "text" },
    offer_description: { control: "text" },
    turnaround_label: { control: "text" },
    business_days: { control: { type: "number", min: 1, step: 1 } },
    button_label: { control: "text" },
    contact_url: { control: "text" },
  },
  args: {
    section_heading: SECTION_HEADING,
    report_description: REPORT_DESCRIPTION,
    report_heading: REPORT_HEADING,
    report_items: REPORT_ITEMS,
    offer_heading: OFFER_HEADING,
    offer_description: OFFER_DESCRIPTION,
    turnaround_label: TURNAROUND_LABEL,
    business_days: BUSINESS_DAYS,
    button_label: BUTTON_LABEL,
    contact_url: CONTACT_URL,
  },
};

export const default_story = {};
