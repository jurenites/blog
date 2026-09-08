import timeline_template from "./timeline.template.html?raw";
import timeline_year_template from "./timeline-year.template.html?raw";
import timeline_item_template from "./timeline-item.template.html?raw";
import { date_time_value_markup } from "../../atoms/date-time-value/date-time-value.markup.js";
import { icon_markup } from "../../atoms/icon/icon.markup.js";
import { escape_html, render_template } from "../../template.js";

const MAXIMUM_LANE_COUNT = 4;
const FIRST_TIMELINE_YEAR = 2010;
const MONTH_LABELS = ["Dec", "Nov", "Oct", "Sep", "Aug", "Jul", "Jun", "May", "Apr", "Mar", "Feb", "Jan"];

function calendar_month_number(date_value) {
  const calendar_date = new Date(date_value + "T00:00:00Z");
  return (calendar_date.getUTCFullYear() * 12) + calendar_date.getUTCMonth() + 1;
}

function period_markup(timeline_period) {
  const start_date_markup = date_time_value_markup({
    source_date: timeline_period.start_date + "T00:00:00Z",
    date_display_variant: "date-month",
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
    return '<span class="timeline__emphasis timeline__emphasis--featured">'
      + icon_markup({
        icon_name: "star-outline",
        class_name: "timeline__star-icon",
      })
      + "Featured</span>";
  }
  if (emphasis_kind === "heart") {
    return '<span class="timeline__emphasis timeline__emphasis--heart">'
      + icon_markup({
        icon_name: "heart-outline",
        class_name: "timeline__heart-icon",
      })
      + "Special place in my heart</span>";
  }

  return "";
}

function organization_sticky_markup(organization_heading) {
  if (!organization_heading) {
    return "";
  }
  if (organization_heading.url) {
    return '<div class="timeline__organization-sticky" data-jurenites-timeline-organization-sticky>'
      + '<a class="timeline__organization-link" target="_blank" href="'
      + escape_html(organization_heading.url) + '">'
      + escape_html(organization_heading.name) + "</a></div>";
  }
  return '<div class="timeline__organization-sticky" data-jurenites-timeline-organization-sticky>'
    + '<span class="timeline__organization-heading">'
    + escape_html(organization_heading.name) + "</span></div>";
}

function organization_transition_markup(organization_heading) {
  if (!organization_heading) {
    return "";
  }
  return '<span class="timeline__organization-transition" data-organization-name="'
    + escape_html(organization_heading.name) + '" data-organization-url="'
    + escape_html(organization_heading.url ?? "") + '" aria-hidden="true"></span>';
}

function proof_links_markup(proof_links) {
  if (!proof_links?.length) {
    return "";
  }
  return '<ul class="timeline__proof-links" aria-label="Proof links">'
    + proof_links.map((proof_link) => '<li><a href="'
      + escape_html(proof_link.url) + '">' + escape_html(proof_link.label) + "</a></li>").join("")
    + "</ul>";
}

function item_content_markup(timeline_fragment) {
  if (!timeline_fragment.show_details) {
    return "";
  }
  const timeline_item = timeline_fragment.timeline_item;
  const timeline_period = timeline_fragment.timeline_period;
  const summary_markup = timeline_fragment.period_index === 0 && timeline_item.item_summary
    ? '<div class="timeline__summary"><p>' + escape_html(timeline_item.item_summary) + "</p></div>"
    : "";
  const project_proof_links = timeline_fragment.period_index === 0
    ? timeline_item.proof_links?.slice(1) ?? []
    : [];
  const primary_project_url = timeline_item.proof_links?.[0]?.url ?? "";
  const item_title_markup = primary_project_url
    ? '<a class="timeline__item-details-link" href="' + escape_html(primary_project_url) + '">'
      + escape_html(timeline_item.item_name) + "</a>"
    : escape_html(timeline_item.item_name);

  return '<article class="timeline__item-content">'
    + '<header class="timeline__item-header"><h3 class="timeline__item-title">'
    + item_title_markup + "</h3>"
    + emphasis_markup(timeline_item.emphasis_kind) + "</header>"
    + '<div class="timeline__metadata">'
    + period_markup(timeline_period)
    + "</div>"
    + summary_markup
    + proof_links_markup(project_proof_links)
    + "</article>";
}

export function assign_timeline_lanes(timeline_items) {
  const dated_periods = timeline_items.flatMap((timeline_item, item_index) =>
    (timeline_item.periods ?? []).map((timeline_period, period_index) => ({
      item_index,
      period_index,
      start_month_number: calendar_month_number(timeline_period.start_date),
      end_month_number: calendar_month_number(timeline_period.end_date),
    })),
  ).sort((first_period, second_period) =>
    first_period.start_month_number - second_period.start_month_number
      || second_period.end_month_number - first_period.end_month_number,
  );
  const lane_end_months = Array(MAXIMUM_LANE_COUNT).fill(Number.NEGATIVE_INFINITY);
  const lane_assignments = new Map();

  dated_periods.forEach((dated_period) => {
    let available_lane_index = lane_end_months.findIndex(
      (lane_end_month) => lane_end_month < dated_period.start_month_number,
    );
    let is_overflow_overlap = false;
    if (available_lane_index === -1) {
      const earliest_end_month = Math.min(...lane_end_months);
      available_lane_index = lane_end_months.indexOf(earliest_end_month);
      is_overflow_overlap = true;
    }
    lane_end_months[available_lane_index] = Math.max(
      lane_end_months[available_lane_index],
      dated_period.end_month_number,
    );
    lane_assignments.set(dated_period.item_index + ":" + dated_period.period_index, {
      lane_number: available_lane_index + 1,
      is_overflow_overlap,
    });
  });

  return lane_assignments;
}

function timeline_year_groups(timeline_items, timeline_current_date) {
  const current_date = new Date(timeline_current_date + "T00:00:00Z");
  const current_year = current_date.getUTCFullYear();
  const current_month = current_date.getUTCMonth() + 1;
  const current_month_number = (current_year * 12) + current_month;
  const visible_timeline_items = timeline_items.filter((timeline_item) =>
    (timeline_item.periods ?? []).some((timeline_period) =>
      new Date(timeline_period.end_date + "T00:00:00Z").getUTCFullYear() >= FIRST_TIMELINE_YEAR,
    ),
  );
  const sorted_items = [...visible_timeline_items].sort((first_item, second_item) =>
    String(second_item.periods[0].start_date).localeCompare(first_item.periods[0].start_date),
  );
  let current_organization_name = "";
  sorted_items.forEach((timeline_item) => {
    timeline_item.organization_heading = null;
    if (timeline_item.organization_name
      && timeline_item.organization_name !== current_organization_name) {
      timeline_item.organization_heading = {
        name: timeline_item.organization_name,
        url: timeline_item.organization_url ?? "",
      };
      current_organization_name = timeline_item.organization_name;
    }
  });

  const lane_assignments = assign_timeline_lanes(sorted_items);
  const year_fragments = new Map();
  let maximum_year = Number.NEGATIVE_INFINITY;
  let minimum_year = Number.POSITIVE_INFINITY;

  sorted_items.forEach((timeline_item, item_index) => {
    (timeline_item.periods ?? []).forEach((timeline_period, period_index) => {
      const start_date = new Date(timeline_period.start_date + "T00:00:00Z");
      const end_date = new Date(timeline_period.end_date + "T00:00:00Z");
      if (calendar_month_number(timeline_period.start_date) > current_month_number) {
        return;
      }
      const start_year = start_date.getUTCFullYear();
      const end_year = end_date.getUTCFullYear();
      const visible_end_year = Math.min(end_year, current_year);
      maximum_year = Math.max(maximum_year, visible_end_year);
      minimum_year = Math.max(FIRST_TIMELINE_YEAR, Math.min(minimum_year, start_year));
      const lane_assignment = lane_assignments.get(item_index + ":" + period_index);

      for (
        let fragment_year = visible_end_year;
        fragment_year >= Math.max(start_year, FIRST_TIMELINE_YEAR);
        fragment_year -= 1
      ) {
        const starting_month = fragment_year === start_year ? start_date.getUTCMonth() + 1 : 1;
        let ending_month = fragment_year === end_year ? end_date.getUTCMonth() + 1 : 12;
        if (fragment_year === current_year) {
          ending_month = Math.min(ending_month, current_month);
        }
        const visible_month_count = fragment_year === current_year ? current_month : 12;
        const grouped_fragments = year_fragments.get(fragment_year) ?? [];
        grouped_fragments.push({
          project_key: 'project-' + item_index,
          period_key: 'project-' + item_index + '-period-' + period_index,
          start_month: start_date.getUTCMonth() + 1,
          continues_before: fragment_year > start_year,
          continues_after: fragment_year < visible_end_year,
          timeline_item,
          timeline_period,
          period_index,
          show_details: fragment_year === start_year,
          lane_number: lane_assignment.lane_number,
          is_overflow_overlap: lane_assignment.is_overflow_overlap,
          ending_month,
          row_start: visible_month_count - ending_month + 1,
          month_span: ending_month - starting_month + 1,
        });
        year_fragments.set(fragment_year, grouped_fragments);
      }
    });
  });

  const year_groups = [];
  if (!Number.isFinite(maximum_year) || !Number.isFinite(minimum_year)) {
    return { sorted_items, year_groups };
  }
  for (let year_number = maximum_year; year_number >= minimum_year; year_number -= 1) {
    year_groups.push({
      year_label: String(year_number),
      visible_month_count: year_number === current_year ? current_month : 12,
      timeline_fragments: year_fragments.get(year_number) ?? [],
      timeline_details: (year_fragments.get(year_number) ?? []).filter(
        (timeline_fragment) => timeline_fragment.show_details,
      ).sort((first_fragment, second_fragment) =>
        second_fragment.timeline_period.start_date.localeCompare(first_fragment.timeline_period.start_date)),
    });
  }
  const initial_organization = sorted_items.find(
    (timeline_item) => timeline_item.organization_heading,
  )?.organization_heading ?? null;
  return { initial_organization, sorted_items, year_groups };
}

function timeline_item_markup(timeline_fragment) {
  const timeline_item = timeline_fragment.timeline_item;
  return render_template(timeline_item_template, {
    project_key: escape_html(timeline_fragment.project_key),
    period_key: escape_html(timeline_fragment.period_key),
    period_label: escape_html(timeline_fragment.timeline_period.start_date + ' – ' + timeline_fragment.timeline_period.end_date),
    continuation_classes: (timeline_fragment.continues_before ? ' timeline__marker--continues-before' : '')
      + (timeline_fragment.continues_after ? ' timeline__marker--continues-after' : ''),
    item_name: escape_html(timeline_item.item_name),
    lane_number: escape_html(timeline_fragment.lane_number),
    ending_month: escape_html(timeline_fragment.ending_month),
    row_start: escape_html(timeline_fragment.row_start),
    month_span: escape_html(timeline_fragment.month_span),
    overlap_class_name: timeline_fragment.is_overflow_overlap
      ? " timeline__item--overlap"
      : "",
    organization_transition_markup: timeline_fragment.show_details
      && timeline_fragment.period_index === 0
      ? organization_transition_markup(timeline_item.organization_heading)
      : "",
  });
}

function timeline_months_markup(year_label, visible_month_count) {
  return MONTH_LABELS.slice(12 - visible_month_count).map((month_label, visible_month_index) => {
    const month_index = (12 - visible_month_count) + visible_month_index;
    const month_number = 12 - month_index;
    return '<li class="timeline__month"><time datetime="'
      + year_label + "-" + String(month_number).padStart(2, "0") + '">'
      + month_label + "</time></li>";
  }).join("");
}

export function timeline_markup({
  timeline_heading,
  timeline_introduction,
  timeline_items,
  timeline_current_date = new Date().toISOString().slice(0, 10),
}) {
  const { initial_organization, sorted_items, year_groups } = timeline_year_groups(
    timeline_items,
    timeline_current_date,
  );
  const timeline_years_markup = year_groups
    .map((year_group) => render_template(timeline_year_template, {
      year_label: escape_html(year_group.year_label),
      visible_month_count: escape_html(year_group.visible_month_count),
      timeline_months_markup: timeline_months_markup(year_group.year_label, year_group.visible_month_count),
      timeline_items_markup: year_group.timeline_fragments.map(timeline_item_markup).join(""),
      timeline_details_markup: year_group.timeline_details
        .map((timeline_fragment) => '<li class="timeline__year-detail timeline__year-detail--project" tabindex="0" data-project-key="'
          + escape_html(timeline_fragment.project_key) + '" data-period-key="'
          + escape_html(timeline_fragment.period_key) + '" data-start-month="'
          + escape_html(timeline_fragment.start_month) + '">'
          + item_content_markup(timeline_fragment) + "</li>")
        .join(""),
    }))
    .join("");

  return render_template(timeline_template, {
    timeline_heading: escape_html(timeline_heading),
    timeline_introduction: escape_html(timeline_introduction),
    timeline_item_count: escape_html(sorted_items.length),
    timeline_organization_sticky_markup: organization_sticky_markup(initial_organization),
    timeline_years_markup,
  });
}
