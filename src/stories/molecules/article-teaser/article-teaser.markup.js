import article_teaser_template from "./article-teaser.template.html?raw";
import article_teaser_tag_list_template from "./article-teaser-tag-list.template.html?raw";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { author_byline_markup } from "../author-byline/author-byline.markup.js";
import { escape_html, render_template } from "../../template.js";

export function article_teaser_markup({
  tag_name,
  tag_url,
  teaser_title,
  teaser_excerpt,
  article_url,
  thumbnail_url,
  thumbnail_alt,
  author_name,
  author_prefix_text = "Written by",
  avatar_initials,
  avatar_image_url,
  published_date,
  date_display_variant = "date-day",
  reading_time_minutes,
  reading_time_label,
}) {
  const tag_list_content = render_template(article_teaser_tag_list_template, {
    tag_chip: chip_markup({
      chip_label: tag_name,
      chip_url: tag_url,
    }),
  });

  return render_template(article_teaser_template, {
    tag_list_content,
    teaser_title: escape_html(teaser_title),
    article_url: escape_html(article_url),
    teaser_excerpt: escape_html(teaser_excerpt),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    author_byline_content: author_byline_markup({
      author_prefix_text,
      author_name,
      avatar_initials,
      avatar_image_url,
      avatar_size: "medium",
      byline_layout: "stacked",
      published_date,
      date_value_kind: "absolute-date",
      date_display_variant,
      reading_time_minutes,
      reading_time_label,
      topic_list: "",
    }),
  });
}
