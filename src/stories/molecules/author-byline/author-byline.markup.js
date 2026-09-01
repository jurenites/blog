import author_byline_template from "./author-byline.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { date_display_markup } from "../../atoms/date-display/date-display.markup.js";
import { numeric_text_markup } from "../../numeric-text.js";
import { escape_html, render_template } from "../../template.js";

export function author_byline_markup({
  author_name,
  author_url,
  avatar_initials,
  published_date,
  reading_time,
  topic_list,
}) {
  const topic_items = String(topic_list)
    .split(",")
    .map((topic_name) => topic_name.trim())
    .filter(Boolean)
    .map((topic_name) => `<li class="article-tags__item">${chip_markup({ chip_label: topic_name })}</li>`)
    .join("");

  const author_name_markup = author_url
    ? `<a href="${escape_html(author_url)}">${escape_html(author_name)}</a>`
    : escape_html(author_name);

  return render_template(author_byline_template, {
    avatar_content: avatar_markup({ avatar_initials }),
    author_name_markup,
    published_date: date_display_markup({
      source_date: published_date,
      value_mode: "month-day-year",
    }),
    reading_time: numeric_text_markup(reading_time),
    topic_items,
  });
}
