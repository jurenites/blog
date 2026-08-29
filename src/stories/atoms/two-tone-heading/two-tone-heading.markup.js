import two_tone_heading_template from "./two-tone-heading.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const ALLOWED_HEADING_LEVELS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

function segment_markup(segment_text, tone_variant) {
  if (!segment_text) {
    return "";
  }

  return `<span class="two-tone-heading__segment two-tone-heading__segment--${tone_variant}">${escape_html(segment_text)}</span>`;
}

function segment_separator(segment_placement) {
  return segment_placement === "new-line"
    ? '<br class="two-tone-heading__line-break">'
    : " ";
}

export function two_tone_heading_markup({
  heading_level,
  leading_text,
  soft_text,
  trailing_text,
  soft_text_placement,
  trailing_text_placement,
}) {
  const heading_tag = ALLOWED_HEADING_LEVELS.has(heading_level) ? heading_level : "h2";
  const heading_segments = [];
  const leading_markup = segment_markup(leading_text, "strong");
  const soft_markup = segment_markup(soft_text, "soft");
  const trailing_markup = segment_markup(trailing_text, "strong");

  if (leading_markup) {
    heading_segments.push(leading_markup);
  }
  if (soft_markup) {
    if (heading_segments.length) {
      heading_segments.push(segment_separator(soft_text_placement));
    }
    heading_segments.push(soft_markup);
  }
  if (trailing_markup) {
    if (heading_segments.length) {
      heading_segments.push(segment_separator(trailing_text_placement));
    }
    heading_segments.push(trailing_markup);
  }

  return render_template(two_tone_heading_template, {
    heading_segments: heading_segments.join(""),
    heading_tag,
  });
}
