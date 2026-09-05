import article_list_item_template from "./article-list-item.template.html?raw";
import { author_byline_markup } from "../author-byline/author-byline.markup.js";
import { escape_html, render_template } from "../../template.js";

export function article_list_item_markup({
  teaser_title,
  teaser_excerpt,
  article_url,
  thumbnail_url,
  thumbnail_alt,
  byline_label,
  author_name,
  author_url,
  avatar_initials,
  avatar_image_url,
  avatar_size,
  published_date,
  date_value_kind = "absolute-date",
  date_display_variant = "date-day",
  reading_time_minutes,
  reading_time_label,
  topic_list,
}) {
  return render_template(article_list_item_template, {
    teaser_title: escape_html(teaser_title),
    teaser_excerpt: escape_html(teaser_excerpt),
    article_url: escape_html(article_url),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    author_byline_content: author_byline_markup({
      byline_label,
      author_name,
      author_url,
      avatar_initials,
      avatar_image_url,
      avatar_size,
      published_date,
      date_value_kind,
      date_display_variant,
      reading_time_minutes,
      reading_time_label,
      topic_list,
    }),
  });
}
