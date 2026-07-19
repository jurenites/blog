import author_byline_template from "./author-byline.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { date_value_markup, date_value_raw_markup } from "../../atoms/date-value/date-value.markup.js";
import { escape_html, render_template } from "../../template.js";

export function author_byline_markup({
  author_name,
  avatar_initials,
  published_date,
  reading_time,
  topic_list,
}) {
  const topic_items = String(topic_list)
    .split(",")
    .map((topic_name) => topic_name.trim())
    .filter(Boolean)
    .map((topic_name) => chip_markup({ chip_label: topic_name }))
    .join("");

  return render_template(author_byline_template, {
    avatar_content: avatar_markup({ avatar_initials }),
    author_name: escape_html(author_name),
    published_date: date_value_markup({
      source_date: published_date,
      format_variant: "month-day-year",
    }),
    reading_time: date_value_raw_markup({ raw_value: reading_time }),
    topic_items,
  });
}
