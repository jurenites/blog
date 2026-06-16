import "./timeline.css";
import timeline_template from "./timeline.template.html?raw";
import event_template from "./timeline-event.template.html?raw";
import { escape_html, render_template } from "./template.js";

const timeline_events = [
  {
    event_year: "2010",
    event_title: "First PHP work",
    event_body: "Early backend and data-structure work that later shaped the CMS direction."
  },
  {
    event_year: "2011",
    event_title: "First solo Drupal project",
    event_body: "A practical point where Drupal became a real tool, not just another CMS."
  },
  {
    event_year: "2018",
    event_title: "Nokia Drupal 8 firefighting",
    event_body: "Short, intense bug-fixing work before a large public release."
  },
  {
    event_year: "2020+",
    event_title: "Accountia design system work",
    event_body: "Long-running UI, product, guideline, and implementation review work."
  }
];

function timeline_markup(event_list = timeline_events) {
  const event_items = event_list
    .map((event_item) =>
      render_template(event_template, {
        year: escape_html(event_item.event_year),
        title: escape_html(event_item.event_title),
        body: escape_html(event_item.event_body),
      }),
    )
    .join("");
  return render_template(timeline_template, { events: event_items });
}

export default {
  title: "Components/Timeline",
  tags: ["autodocs"]
};

export const timeline_preview_story = {
  render: () => timeline_markup()
};
