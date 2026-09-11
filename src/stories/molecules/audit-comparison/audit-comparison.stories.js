import graphic_template from "./audit-comparison.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const GRAPHIC_URL = "/assets/images/projects/oksenate/lighthouse-accessibility.svg";
const GRAPHIC_DESCRIPTION = "Lighthouse accessibility score: 91 before, 98 at release, an improvement of 7 points out of 100.";
const GRAPHIC_CAPTION = "Release-time accessibility results recorded in the project notes; this graphic is a summary, not a live audit.";

export default {
  title: "Molecules/Audit Comparison",
  args: {
    graphic_url: GRAPHIC_URL,
    graphic_description: GRAPHIC_DESCRIPTION,
    graphic_caption: GRAPHIC_CAPTION,
  },
  render: (story_args) => render_template(graphic_template, {
    graphic_url: escape_html(story_args.graphic_url),
    graphic_description: escape_html(story_args.graphic_description),
    graphic_caption: escape_html(story_args.graphic_caption),
  }),
};

export const oksenate_results = {};
