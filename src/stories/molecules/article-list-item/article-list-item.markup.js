import article_list_item_template from "./article-list-item.template.html?raw";
import article_list_item_tags_template from "./article-list-item-tags.template.html?raw";
import article_list_item_tag_template from "./article-list-item-tag.template.html?raw";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
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
  title_tag_items = [],
}) {
  return render_template(article_list_item_template, {
    title_tags_content: title_tag_items.length ? render_template(article_list_item_tags_template, {
      tag_items_content: title_tag_items.map((tag_item) => render_template(article_list_item_tag_template, {
        tag_chip_content: chip_markup({ chip_label: tag_item.tag_name, chip_url: tag_item.tag_url }),
      })).join(""),
    }) : "",
    teaser_title: escape_html(teaser_title),
    title_arrow_content: icon_markup({ icon_name: "arrow-right", class_name: "article-list-item__internal-mark" }),
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
