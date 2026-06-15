// Molecule: Article Teaser. Eyebrow + title + excerpt + meta + read link.
import article_template from "./article-teaser.template.html?raw";
import { escape_html, render_template } from "../template.js";

function render_story({ eyebrow_heading, teaser_title, teaser_excerpt, teaser_meta, link_label }) {
  return render_template(article_template, {
    eyebrow: escape_html(eyebrow_heading),
    title: escape_html(teaser_title),
    excerpt: escape_html(teaser_excerpt),
    meta: escape_html(teaser_meta),
    linkLabel: escape_html(link_label),
  });
}

export default {
  title: "Molecules/Article Teaser",
  tags: ["autodocs"],
  render: render_story,
  argTypes: {
    eyebrow_heading: { control: "text" },
    teaser_title: { control: "text" },
    teaser_excerpt: { control: "text" },
    teaser_meta: { control: "text" },
    link_label: { control: "text" },
  },
  args: {
    eyebrow_heading: "Writing",
    teaser_title: "Rewinding an Interface Through Time",
    teaser_excerpt: "How a time-slider concept turned into a repeatable design process.",
    teaser_meta: "Jun 2026 - 6 min read",
    link_label: "Read article",
  },
};

export const default_story = {};
