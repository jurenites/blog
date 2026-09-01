const DATE_DISPLAY_FORMATS = {
  "date-day": {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  "date-day-time": {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
};

export function normalized_iso_date(source_date) {
  const parsed_date = source_date instanceof Date
    ? source_date
    : new Date(source_date);

  return Number.isNaN(parsed_date.getTime()) ? String(source_date ?? "") : parsed_date.toISOString();
}

export function formatted_date_display(source_date, display_variant) {
  const parsed_date = new Date(source_date);

  if (Number.isNaN(parsed_date.getTime())) {
    return String(source_date ?? "");
  }

  return new Intl.DateTimeFormat("en-US", DATE_DISPLAY_FORMATS[display_variant]).format(parsed_date);
}

export function formatted_time_since(source_date, unit_labels = {}) {
  const source_timestamp = new Date(source_date).getTime();
  const current_timestamp = Date.now();

  if (Number.isNaN(source_timestamp) || Number.isNaN(current_timestamp)) {
    return String(source_date ?? "");
  }

  const elapsed_minutes = Math.max(0, Math.floor((current_timestamp - source_timestamp) / 60000));
  const elapsed_hours = Math.floor(elapsed_minutes / 60);
  const remaining_minutes = elapsed_minutes % 60;
  const minute_text = unit_labels.minute ?? "minute";
  const minutes_text = unit_labels.minutes ?? "minutes";
  const hour_text = unit_labels.hour ?? "hour";
  const hours_text = unit_labels.hours ?? "hours";
  const time_parts = [];

  if (elapsed_hours > 0) {
    time_parts.push(`${elapsed_hours} ${elapsed_hours === 1 ? hour_text : hours_text}`);
  }

  if (remaining_minutes > 0 || elapsed_hours === 0) {
    time_parts.push(`${remaining_minutes} ${remaining_minutes === 1 ? minute_text : minutes_text}`);
  }

  return time_parts.join(" ");
}
