import timeline_template from "./timeline.template.html?raw";
import timeline_year_template from "./timeline-year.template.html?raw";
import timeline_item_template from "./timeline-item.template.html?raw";
import { date_time_value_markup } from "../../atoms/date-time-value/date-time-value.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { escape_html, render_template } from "../../template.js";

function inclusive_month_count(start_date, end_date) {
  const start_value = new Date(start_date + "T00:00:00Z");
  const end_value = new Date(end_date + "T00:00:00Z");

  return Math.max(
    1,
    ((end_value.getUTCFullYear() - start_value.getUTCFullYear()) * 12)
      + end_value.getUTCMonth() - start_value.getUTCMonth() + 1,
  );
}

function duration_text(month_count) {
  if (month_count < 12) {
    return month_count + " " + (month_count === 1 ? "month" : "months");
  }

  const year_count = Math.floor(month_count / 12);
  const remaining_month_count = month_count % 12;
  const year_text = year_count + " " + (year_count === 1 ? "year" : "years");

  return remaining_month_count === 0
    ? year_text
    : year_text + " " + remaining_month_count + " "
      + (remaining_month_count === 1 ? "month" : "months");
}

function period_markup(timeline_period, item_kind) {
  const start_date_markup = date_time_value_markup({
    source_date: timeline_period.start_date + "T00:00:00Z",
    date_display_variant: item_kind === "event" ? "date-day" : "date-month",
  });
  if (timeline_period.start_date === timeline_period.end_date) {
    return '<span class="timeline__period">' + start_date_markup + "</span>";
  }

  const end_date_markup = date_time_value_markup({
    source_date: timeline_period.end_date + "T00:00:00Z",
    date_display_variant: "date-month",
  });
  return '<span class="timeline__period">' + start_date_markup
    + '<span aria-hidden="true">–</span>' + end_date_markup + "</span>";
}

function emphasis_markup(emphasis_kind) {
  if (emphasis_kind === "featured") {
    return '<span class="timeline__emphasis timeline__emphasis--featured">★ Featured</span>';
  }
  if (emphasis_kind === "heart") {
    return '<span class="timeline__emphasis timeline__emphasis--heart">'
      + icon_markup({
        icon_name: "heart-timeline",
        class_name: "timeline__heart-icon",
      })
      + "Special place in my heart</span>";
  }

  return "";
}

function timeline_item_markup(timeline_item) {
  const timeline_periods = timeline_item.periods ?? [];
  const total_month_count = timeline_periods.reduce(
    (month_total, timeline_period) => month_total
      + inclusive_month_count(timeline_period.start_date, timeline_period.end_date),
    0,
  );
  const normalized_month_count = Math.max(1, Math.min(36, total_month_count));
  const is_project_item = timeline_item.item_kind === "project";

  return render_template(timeline_item_template, {
    item_kind: escape_html(timeline_item.item_kind),
    item_name: escape_html(timeline_item.item_name),
    duration_marker_classes: is_project_item
      ? " timeline__marker--duration timeline__marker--duration-" + normalized_month_count
      : "",
    emphasis_markup: emphasis_markup(timeline_item.emphasis_kind),
    periods_markup: timeline_periods
      .map((timeline_period) => period_markup(timeline_period, timeline_item.item_kind))
      .join(""),
    duration_markup: is_project_item
      ? '<span class="timeline__duration">' + escape_html(duration_text(total_month_count)) + "</span>"
      : "",
    hours_markup: timeline_item.hours_worked
      ? '<span class="timeline__hours">'
        + escape_html(Number(timeline_item.hours_worked).toLocaleString("en-US")) + " h</span>"
      : "",
    organization_markup: timeline_item.organization_name
      ? '<span class="timeline__organization">'
        + escape_html(timeline_item.organization_name) + "</span>"
      : "",
    summary_markup: timeline_item.item_summary
      ? '<div class="timeline__summary"><p>'
        + escape_html(timeline_item.item_summary) + "</p></div>"
      : "",
  });
}

export function timeline_markup({
  timeline_heading,
  timeline_introduction,
  timeline_items,
}) {
  const sorted_items = [...timeline_items].sort((first_item, second_item) =>
    String(second_item.periods[0].start_date).localeCompare(first_item.periods[0].start_date),
  );
  const year_groups = new Map();

  sorted_items.forEach((timeline_item) => {
    const year_label = timeline_item.periods[0].start_date.slice(0, 4);
    const grouped_items = year_groups.get(year_label) ?? [];
    grouped_items.push(timeline_item);
    year_groups.set(year_label, grouped_items);
  });

  const timeline_years_markup = [...year_groups.entries()]
    .map(([year_label, grouped_items]) => render_template(timeline_year_template, {
      year_label: escape_html(year_label),
      timeline_items_markup: grouped_items.map(timeline_item_markup).join(""),
    }))
    .join("");

  return render_template(timeline_template, {
    timeline_heading: escape_html(timeline_heading),
    timeline_introduction: escape_html(timeline_introduction),
    timeline_item_count: escape_html(sorted_items.length),
    timeline_years_markup,
  });
}
