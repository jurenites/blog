export const date_formatters = {

  month_day_year: {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
  long_date: {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  iso_date: null,
};

export const date_format_options = Object.keys(date_formatters);

export function normalized_iso_date(source_date) {
  if (typeof source_date === "number") {
    return new Date(source_date).toISOString().slice(0, 10);
  }

  if (source_date instanceof Date) {
    return source_date.toISOString().slice(0, 10);
  }

  return String(source_date ?? "");
}

export function formatted_date_value(source_date, format_variant) {
  const iso_date_value = normalized_iso_date(source_date);
  const parsed_date = new Date(`${iso_date_value}T12:00:00`);

  if (Number.isNaN(parsed_date.getTime())) {
    return iso_date_value;
  }

  if (format_variant === "iso_date") {
    return iso_date_value;
  }

  return new Intl.DateTimeFormat("en-US", date_formatters[format_variant]).format(parsed_date);
}
