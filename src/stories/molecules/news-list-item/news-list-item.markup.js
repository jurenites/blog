import news_list_item_template from "./news-list-item.template.html?raw";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { date_time_value_markup } from "../../atoms/date-time-value/date-time-value.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { escape_html, render_template } from "../../template.js";

export function news_list_item_markup({
  news_title,
  source_url,
  source_name,
  source_label,
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
    source_name: escape_html(source_name),
    source_label: escape_html(source_label),
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
