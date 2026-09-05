import author_byline_template from "./author-byline.template.html?raw";
import { author_identity_markup } from "../author-identity/author-identity.markup.js";
import { chip_markup } from "../../atoms/chip/chip.markup.js";
import { date_time_value_markup } from "../../atoms/date-time-value/date-time-value.markup.js";
import { escape_html, render_template } from "../../template.js";

export function author_byline_markup({
  byline_label = "Article author",
  author_name,
  author_url,
  author_prefix_text = "",
  avatar_initials,
  avatar_image_url,
  avatar_size = "medium",
  byline_layout = "inline",
  published_date,
  date_value_kind = "absolute-date",
  date_display_variant = "date-day",
  reading_time_minutes,
  reading_time_label,
  topic_list,
}) {
  const topic_items = String(topic_list ?? "")
    .split(",")
    .map((topic_name) => topic_name.trim())
    .filter(Boolean)
    .map((topic_name) => `<li class="article-tags__item">${chip_markup({ chip_label: topic_name })}</li>`) //TODO i dotnt loike the HTML to be inside JS files it shoudl be some template wrapper instead
    .join("");

  const published_date_content = date_time_value_markup({
    value_kind: date_value_kind,
    source_date: published_date,
    date_display_variant,
  });
  const duration_content = date_time_value_markup({
    value_kind: "duration",
    duration_minutes: reading_time_minutes,
    duration_label: reading_time_label,
  });
  const has_timing_content = Boolean(published_date_content || duration_content);
  const has_timing_separator = Boolean(published_date_content && duration_content);

  return render_template(author_byline_template, {
    byline_label: escape_html(byline_label),
    byline_layout: escape_html(byline_layout),
    avatar_size: escape_html(avatar_size),
    author_identity_content: author_identity_markup({
      author_prefix_text,
      author_name,
      author_url,
      avatar_initials,
      avatar_size,
      avatar_image_url,
    }),
    published_date_content,
    duration_content,
    timing_class_name: has_timing_content ? "" : " author-byline__timing--empty",
    identity_separator_class_name: has_timing_content ? "" : " author-byline__identity-separator--hidden",
    separator_class_name: has_timing_separator ? "" : " author-byline__separator--hidden",
    topic_content: topic_items
      ? `
      <div class="author-byline__topics"><nav class="article-tags" aria-label="Topics">
      <ul class="article-tags__list">${topic_items}</ul></nav>
      </div>`
      : "",
  });
}
