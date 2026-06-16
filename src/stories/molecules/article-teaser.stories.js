// Molecule: Article Teaser. Eyebrow + linked title + excerpt + meta.
import article_template from "./article-teaser.template.html?raw";
import date_value_template from "../atoms/date-value.template.html?raw";
import date_value_raw_template from "../atoms/date-value-raw.template.html?raw";
import { date_format_options, formatted_date_value, normalized_iso_date } from "../date-format.js";
import { escape_html, render_template } from "../template.js";

function date_value_markup(source_date, format_variant) {
  const iso_date_value = normalized_iso_date(source_date);

  return render_template(date_value_template, {
    date_iso: escape_html(iso_date_value),
    display_variant: "muted",
    formatted_value: escape_html(formatted_date_value(iso_date_value, format_variant)),
  });
}

function raw_time_markup(raw_value) {
  return render_template(date_value_raw_template, {
    display_variant: "time",
    raw_value: escape_html(raw_value),
  });
}

function render_story({ eyebrow_heading, teaser_title, teaser_excerpt, article_url, published_date, date_format, reading_time }) {
  return render_template(article_template, {
    eyebrow_heading: escape_html(eyebrow_heading),
    teaser_title: escape_html(teaser_title),
    article_url: escape_html(article_url),
    teaser_excerpt: escape_html(teaser_excerpt),
    date_value: date_value_markup(published_date, date_format),
    reading_time: raw_time_markup(reading_time),
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
    eyebrow_heading: "Writing",
    teaser_title: "Rewinding an Interface Through Time",
    teaser_excerpt: "How a time-slider concept turned into a repeatable design process.",
    article_url: "#",
    published_date: "2026-06-15",
    date_format: "month_year",
    reading_time: "6 minutes",
  },
};

export const default_story = {};
