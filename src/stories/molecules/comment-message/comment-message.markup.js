import comment_message_template from "./comment-message.template.html?raw";
import { avatar_markup } from "../../atoms/avatar/avatar.markup.js";
import { date_display_markup } from "../../atoms/date-display/date-display.markup.js";
import { formatted_date_display } from "../../date-format.js";
import { escape_html, render_template } from "../../template.js";

export function comment_message_markup({
  comment_author_name,
  comment_body,
  comment_created_date,
  comment_permalink_url = "#",
  avatar_initials,
  avatar_image_url = "",
}) {
  return render_template(comment_message_template, {
    avatar_content: avatar_markup({
      avatar_initials,
      avatar_size: "medium",
      image_url: avatar_image_url,
    }),
    comment_author_name: escape_html(comment_author_name),
    comment_body: escape_html(comment_body),
    comment_permalink_url: escape_html(comment_permalink_url),
    comment_timestamp: date_display_markup({
      source_date: comment_created_date,
      value_mode: "time-since",
      display_variant: "date-day-time",
      relative_suffix: "ago",
      exact_date_title: formatted_date_display(comment_created_date, "date-day-time"),
    }),
  });
}
