import article_list_item_template from "./article-list-item.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { date_display_markup } from "../../atoms/date-display/date-display.markup.js";
import { numeric_text_markup } from "../../numeric-text.js";
import { escape_html, render_template } from "../../template.js";

export function article_list_item_markup({
  teaser_title,
  teaser_excerpt,
  article_url,
  thumbnail_url,
  thumbnail_alt,
  author_name,
  avatar_initials,
  avatar_image_url,
  published_date,
  date_display_variant = "date-day",
  reading_time,
}) {
  return render_template(article_list_item_template, {
    teaser_title: escape_html(teaser_title),
    teaser_excerpt: escape_html(teaser_excerpt),
    article_url: escape_html(article_url),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    avatar_content: avatar_markup({
      avatar_initials,
      image_url: avatar_image_url,
    }),
    author_name: escape_html(author_name),
    date_display: date_display_markup({
      source_date: published_date,
      value_mode: "month-day-year",
      display_variant: date_display_variant,
    }),
    reading_time: numeric_text_markup(reading_time),
  });
}
