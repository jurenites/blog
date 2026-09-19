import news_list_item_template from "./news-list-item.template.html?raw";
import { author_identity_markup } from "../author-identity/author-identity.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { date_time_value_markup } from "../../atoms/date-time-value/date-time-value.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { escape_html, render_template } from "../../template.js";

export function news_list_item_markup({
  news_title,
  source_url,
  source_name,
  source_author_url = "",
  source_avatar_url = "",
  source_avatar_initials = "",
  thumbnail_url,
  thumbnail_alt,
  tag_names = [],
  published_date,
  date_value_kind = "elapsed-time",
  date_display_variant = "date-day",
  relative_suffix = "ago",
}) {
  return render_template(news_list_item_template, {
    news_title: escape_html(news_title),
    source_url: escape_html(source_url),
    source_identity_content: author_identity_markup({
      author_name: source_name,
      author_url: source_author_url,
      avatar_image_url: source_avatar_url,
      avatar_initials: source_avatar_initials,
      avatar_size: "small",
    }),
    thumbnail_url: escape_html(thumbnail_url),
    thumbnail_alt: escape_html(thumbnail_alt),
    tag_list_content: tag_names
      .map((tag_name) =>
        chip_markup({
          chip_label: tag_name,
          is_accent: true,
        }),
      )
      .join(""),
    published_date_content: date_time_value_markup({
      value_kind: date_value_kind,
      source_date: published_date,
      date_display_variant,
      relative_suffix,
    }),
    external_icon_content: icon_markup({
      icon_name: "external-link",
      class_name: "news-list-item__external-mark",
    }),
  });
}
