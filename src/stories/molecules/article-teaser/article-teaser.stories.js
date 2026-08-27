// Molecule: Article Teaser. Eyebrow + linked title + excerpt + meta.
import article_template from "./article-teaser.template.html?raw";
import { date_value_markup, date_value_raw_markup } from "../../atoms/date-value/date-value.markup.js";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

const EYEBROW_HEADING = "Writing";
const TEASER_TITLE = "Rewinding an Interface Through Time";
const TEASER_EXCERPT = "How a time-slider concept turned into a repeatable design process.";
const ARTICLE_URL = "#";
const THUMBNAIL_URL = "/assets/images/article-teaser-sample.svg";
const THUMBNAIL_ALT = "Abstract landscape with geometric hills and an outlined sun";
const PUBLISHED_DATE = "2026-06-15";
const DATE_FORMAT = token_value("component-date-value-default-format");
const READING_TIME = "6 minutes";
const DATE_FORMAT_OPTIONS = ["month-day-year", "long-date", "iso-date"];
const DISPLAY_VARIANT_OPTIONS = ["muted", "day", "time"];

function render_story({ eyebrow_heading, teaser_title, teaser_excerpt, article_url, thumbnail_url, thumbnail_alt, published_date, date_format, reading_time }) {
  return render_template(article_template, {
    eyebrow_heading: escape_html(eyebrow_heading),
    teaser_title: escape_html(teaser_title),
    article_url: escape_html(article_url),
    teaser_excerpt: escape_html(teaser_excerpt),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    date_value: date_value_markup({
      source_date: published_date,
      format_variant: date_format,
      display_variant: token_value("component-date-value-default-display"),
    }),
    reading_time: date_value_raw_markup({
      raw_value: reading_time,
      display_variant: DISPLAY_VARIANT_OPTIONS[2],
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
    thumbnail_url: { control: "text" },
    thumbnail_alt: { control: "text" },
    published_date: { control: "date" },
    date_format: {
      control: { type: "select" },
      options: DATE_FORMAT_OPTIONS,
    },
    reading_time: { control: "text" },
  },
  args: {
    eyebrow_heading: EYEBROW_HEADING,
    teaser_title: TEASER_TITLE,
    teaser_excerpt: TEASER_EXCERPT,
    article_url: ARTICLE_URL,
    thumbnail_url: THUMBNAIL_URL,
    thumbnail_alt: THUMBNAIL_ALT,
    published_date: PUBLISHED_DATE,
    date_format: DATE_FORMAT,
    reading_time: READING_TIME,
  },
};

export const default_story = {};
