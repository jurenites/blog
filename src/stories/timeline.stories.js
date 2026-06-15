import "./timeline.css";
import template from "./timeline.template.html?raw";
import eventTemplate from "./timeline-event.template.html?raw";
import { escapeHtml, renderTemplate } from "./template.js";

const events = [
  {
    year: "2010",
    title: "First PHP work",
    body: "Early backend and data-structure work that later shaped the CMS direction."
  },
  {
    year: "2011",
    title: "First solo Drupal project",
    body: "A practical point where Drupal became a real tool, not just another CMS."
  },
  {
    year: "2018",
    title: "Nokia Drupal 8 firefighting",
    body: "Short, intense bug-fixing work before a large public release."
  },
  {
    year: "2020+",
    title: "Accountia design system work",
    body: "Long-running UI, product, guideline, and implementation review work."
  }
];

function timelineMarkup(items = events) {
  const eventItems = items
    .map((item) =>
      renderTemplate(eventTemplate, {
        year: escapeHtml(item.year),
        title: escapeHtml(item.title),
        body: escapeHtml(item.body),
      }),
    )
    .join("");
  return renderTemplate(template, { events: eventItems });
}

export default {
  title: "Components/Timeline",
  tags: ["autodocs"]
};

export const TimelinePreview = {
  render: () => timelineMarkup()
};
