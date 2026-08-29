import article_teaser_template from "./article-teaser.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { date_value_markup, date_value_raw_markup } from "../../atoms/date-value/date-value.markup.js";
import { token_value } from "../../foundations/token-values.js";
import { escape_html, render_template } from "../../template.js";

export function article_teaser_markup({
  eyebrow_heading,
  teaser_title,
  teaser_excerpt,
  article_url,
  thumbnail_url,
  thumbnail_alt,
  author_name,
  avatar_initials,
  avatar_image_url,
  published_date,
  date_format,
  reading_time,
}) {
  return render_template(article_teaser_template, {
    eyebrow_heading: escape_html(eyebrow_heading),
    teaser_title: escape_html(teaser_title),
    article_url: escape_html(article_url),
    teaser_excerpt: escape_html(teaser_excerpt),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    avatar_content: avatar_markup({
      avatar_initials,
      image_url: avatar_image_url,
    }),
    author_name: escape_html(author_name),
    date_value: date_value_markup({
      source_date: published_date,
      format_variant: date_format,
      display_variant: token_value("component-date-value-default-display"),
    }),
    reading_time: date_value_raw_markup({
      raw_value: reading_time,
      display_variant: "time",
    }),
  });
}
