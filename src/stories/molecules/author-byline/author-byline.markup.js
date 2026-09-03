import author_byline_template from "./author-byline.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { consumption_time_markup } from "../../atoms/consumption-time/consumption-time.markup.js";
import { date_display_markup } from "../../atoms/date-display/date-display.markup.js";
import { escape_html, render_template } from "../../template.js";

export function author_byline_markup({
  byline_label = "Article author",
  author_name,
  author_url,
  avatar_initials,
  avatar_image_url,
  avatar_size = "medium",
  published_date,
  date_value_mode = "month-day-year",
  date_display_variant = "date-day",
  reading_time_minutes,
  reading_time_label,
  topic_list,
}) {
  const topic_items = String(topic_list ?? "")
    .split(",")
    .map((topic_name) => topic_name.trim())
    .filter(Boolean)
    .map((topic_name) => `<li class="article-tags__item">${chip_markup({ chip_label: topic_name })}</li>`)
    .join("");

  const author_name_markup = author_url
    ? `<a href="${escape_html(author_url)}">${escape_html(author_name)}</a>`
    : escape_html(author_name);
  const consumption_time_content = consumption_time_markup({
    consumption_time_minutes: reading_time_minutes,
    consumption_time_label: reading_time_label,
  });
  const reading_time_content = consumption_time_content
    ? `<span class="author-byline__separator" aria-hidden="true">&middot;</span>${consumption_time_content}`
    : "";

  return render_template(author_byline_template, {
    byline_label: escape_html(byline_label),
    avatar_content: avatar_markup({
      avatar_initials,
      avatar_size,
      image_url: avatar_image_url,
    }),
    author_name_markup,
    published_date: date_display_markup({
      source_date: published_date,
      value_mode: date_value_mode,
      display_variant: date_display_variant,
    }),
    reading_time_content,
    topic_content: topic_items
      ? `<div class="author-byline__topics"><nav class="article-tags" aria-label="Topics"><ul class="article-tags__list date-display">${topic_items}</ul></nav></div>`
      : "",
  });
}
