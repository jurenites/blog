function joined_time_parts(time_parts) {
  return time_parts.join(" ");
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
    source_value.getUTCHours(), source_value.getUTCMinutes(), source_value.getUTCSeconds(),
    source_value.getUTCMilliseconds(),
  ));
}

export function formatted_time_since(source_date, unit_labels = {}, reference_date = new Date(), display_locale = "en") {
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
  const format_unit = (unit_count, unit_name) => {
    const custom_label = unit_labels[unit_count === 1 ? unit_name : `${unit_name}s`];
    return custom_label
      ? `${unit_count} ${custom_label}`
      : new Intl.NumberFormat(display_locale, {
        style: 'unit', unit: unit_name, unitDisplay: 'long', useGrouping: false,
      }).format(unit_count);
  };
  const time_parts = [];

  if (elapsed_hours >= 24) {
    const reference_calendar_date = reference_value;
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
      time_parts.push(format_unit(elapsed_years, 'year'));
    }

    if (elapsed_months > 0) {
      time_parts.push(format_unit(elapsed_months, 'month'));
    }

    if (elapsed_days > 0 || time_parts.length === 0) {
      time_parts.push(format_unit(elapsed_days, 'day'));
    }

    return joined_time_parts(time_parts);
  }

  if (elapsed_hours > 0) {
    time_parts.push(format_unit(elapsed_hours, 'hour'));
  }

  if (remaining_minutes > 0 || elapsed_hours === 0) {
    time_parts.push(format_unit(remaining_minutes, 'minute'));
  }

  return joined_time_parts(time_parts);
}
