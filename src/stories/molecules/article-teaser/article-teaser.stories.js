// Molecule: Article Teaser. Eyebrow + linked title + excerpt + meta.
import article_template from "./article-teaser.template.html?raw";
import { date_value_markup, date_value_raw_markup } from "../../atoms/date-value/date-value.markup.js";
import { token_default_option, token_option_names } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

const example_story_args = {
  eyebrow_heading: "Writing",
  teaser_title: "Rewinding an Interface Through Time",
  teaser_excerpt: "How a time-slider concept turned into a repeatable design process.",
  article_url: "#",
  published_date: "2026-06-15",
  date_format: token_default_option("component-date-value-default-format", "component-date-value-format-"),
  reading_time: "6 minutes",
};

const date_format_options = token_option_names("component-date-value-format-");
const display_variant_options = token_option_names("component-date-value-display-");

function render_story({ eyebrow_heading, teaser_title, teaser_excerpt, article_url, published_date, date_format, reading_time }) {
  return render_template(article_template, {
    eyebrow_heading: escape_html(eyebrow_heading),
    teaser_title: escape_html(teaser_title),
    article_url: escape_html(article_url),
    teaser_excerpt: escape_html(teaser_excerpt),
    date_value: date_value_markup({
      source_date: published_date,
      format_variant: date_format,
      display_variant: token_default_option("component-date-value-default-display", "component-date-value-display-"),
    }),
    reading_time: date_value_raw_markup({
      raw_value: reading_time,
      display_variant: display_variant_options[2],
    }),
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
    article_url: { control: "text" },
    published_date: { control: "date" },
    date_format: {
      control: { type: "select" },
      options: date_format_options,
    },
    reading_time: { control: "text" },
  },
  args: {
    ...example_story_args,
  },
};

export const default_story = {};
