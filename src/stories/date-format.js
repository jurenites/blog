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
  "day-month-year": {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
};

const DATE_DISPLAY_LOCALES = {
  "day-month-year": "en-GB",
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

  const display_locale = DATE_DISPLAY_LOCALES[display_variant] ?? "en-US";
  return new Intl.DateTimeFormat(display_locale, DATE_DISPLAY_FORMATS[display_variant]).format(parsed_date);
}

function joined_time_parts(time_parts, conjunction_text) {
  if (time_parts.length < 2) {
    return time_parts[0] ?? "";
  }

  if (time_parts.length === 2) {
    return `${time_parts[0]} ${conjunction_text} ${time_parts[1]}`;
  }

  return `${time_parts.slice(0, -1).join(", ")} ${conjunction_text} ${time_parts.at(-1)}`;
}

function shifted_calendar_date(source_value, added_years, added_months) {
  const target_month_index = source_value.getUTCMonth() + added_months;
  const target_year = source_value.getUTCFullYear() + added_years + Math.floor(target_month_index / 12);
  const target_month = ((target_month_index % 12) + 12) % 12;
  const target_month_last_day = new Date(Date.UTC(target_year, target_month + 1, 0)).getUTCDate();

  return new Date(Date.UTC(
    target_year,
    target_month,
    Math.min(source_value.getUTCDate(), target_month_last_day),
  ));
}

export function formatted_time_since(source_date, unit_labels = {}, reference_date = new Date()) {
  const source_value = new Date(source_date);
  const reference_value = new Date(reference_date);
  const source_timestamp = source_value.getTime();
  const current_timestamp = reference_value.getTime();

  if (Number.isNaN(source_timestamp) || Number.isNaN(current_timestamp)) {
    return String(source_date ?? "");
  }

  const elapsed_minutes = Math.max(0, Math.floor((current_timestamp - source_timestamp) / 60000));
  const elapsed_hours = Math.floor(elapsed_minutes / 60);
  const remaining_minutes = elapsed_minutes % 60;
  const year_text = unit_labels.year ?? "year";
  const years_text = unit_labels.years ?? "years";
  const month_text = unit_labels.month ?? "month";
  const months_text = unit_labels.months ?? "months";
  const day_text = unit_labels.day ?? "day";
  const days_text = unit_labels.days ?? "days";
  const minute_text = unit_labels.minute ?? "minute";
  const minutes_text = unit_labels.minutes ?? "minutes";
  const hour_text = unit_labels.hour ?? "hour";
  const hours_text = unit_labels.hours ?? "hours";
  const conjunction_text = unit_labels.conjunction ?? "and";
  const time_parts = [];

  if (elapsed_hours >= 24) {
    const reference_calendar_date = new Date(Date.UTC(
      reference_value.getUTCFullYear(),
      reference_value.getUTCMonth(),
      reference_value.getUTCDate(),
    ));
    let elapsed_years = reference_value.getUTCFullYear() - source_value.getUTCFullYear();
    if (shifted_calendar_date(source_value, elapsed_years, 0) > reference_calendar_date) {
      elapsed_years -= 1;
    }

    const year_cursor = shifted_calendar_date(source_value, elapsed_years, 0);
    let elapsed_months = ((reference_value.getUTCFullYear() - year_cursor.getUTCFullYear()) * 12)
      + reference_value.getUTCMonth() - year_cursor.getUTCMonth();
    if (shifted_calendar_date(year_cursor, 0, elapsed_months) > reference_calendar_date) {
      elapsed_months -= 1;
    }

    const month_cursor = shifted_calendar_date(year_cursor, 0, elapsed_months);
    const elapsed_days = Math.floor((reference_calendar_date - month_cursor) / 86400000);

    if (elapsed_years > 0) {
      time_parts.push(`${elapsed_years} ${elapsed_years === 1 ? year_text : years_text}`);
    }

    if (elapsed_months > 0) {
      time_parts.push(`${elapsed_months} ${elapsed_months === 1 ? month_text : months_text}`);
    }

    if (elapsed_days > 0 || time_parts.length === 0) {
      time_parts.push(`${elapsed_days} ${elapsed_days === 1 ? day_text : days_text}`);
    }

    return joined_time_parts(time_parts, conjunction_text);
  }

  if (elapsed_hours > 0) {
    time_parts.push(`${elapsed_hours} ${elapsed_hours === 1 ? hour_text : hours_text}`);
  }

  if (remaining_minutes > 0 || elapsed_hours === 0) {
    time_parts.push(`${remaining_minutes} ${remaining_minutes === 1 ? minute_text : minutes_text}`);
  }

  return joined_time_parts(time_parts, conjunction_text);
}
