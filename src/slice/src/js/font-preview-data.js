const NOT_EMBEDDED_LABEL = "Not embedded";

export function format_unicode_code_point(code_point) {
  const numeric_code_point = Number(code_point);
  if (!Number.isInteger(numeric_code_point) || numeric_code_point < 0) {
    return NOT_EMBEDDED_LABEL;
  }

  return `U+${numeric_code_point.toString(16).toUpperCase().padStart(4, "0")}`;
}

export function safe_glyph_name(glyph_record, code_point) {
  const embedded_name = String(glyph_record?.name ?? "").trim();
  if (embedded_name) {
    return embedded_name;
  }

  const mapped_character = Number.isInteger(code_point)
    ? String.fromCodePoint(code_point)
    : "";
  return mapped_character || `glyph-${glyph_record?.index ?? "unknown"}`;
}

export function create_glyph_inventory(font_record) {
  const glyph_index_map = font_record?.tables?.cmap?.glyphIndexMap
    ?? font_record?.encoding?.cmap?.glyphIndexMap
    ?? {};

  return Object.entries(glyph_index_map)
    .map(([code_point_value, glyph_index_value]) => {
      const code_point = Number(code_point_value);
      const glyph_index = Number(glyph_index_value);
      const glyph_record = font_record?.glyphs?.get(glyph_index);
      return {
        character: Number.isInteger(code_point) ? String.fromCodePoint(code_point) : "",
        code_point,
        glyph_index,
        glyph_name: safe_glyph_name(glyph_record, code_point),
        glyph_record,
      };
    })
    .filter(({ code_point, glyph_index, glyph_record }) => Number.isInteger(code_point)
      && code_point >= 0
      && code_point <= 0x10FFFF
      && glyph_index > 0
      && glyph_record?.name !== ".notdef"
      && Array.isArray(glyph_record?.path?.commands)
      && glyph_record.path.commands.some((path_command) => path_command.type !== "M"))
    .sort((first_mapping, second_mapping) => first_mapping.code_point - second_mapping.code_point);
}

function format_path_number(path_value) {
  return Number.isFinite(path_value)
    ? Number(path_value.toFixed(2)).toString()
    : "0";
}

export function serialize_glyph_path(glyph_record) {
  const path_commands = glyph_record?.path?.commands ?? [];
  return path_commands.map((path_command) => {
    const coordinate_names = ["x", "y", "x1", "y1", "x2", "y2"];
    const coordinate_values = coordinate_names
      .filter((coordinate_name) => Number.isFinite(path_command[coordinate_name]))
      .map((coordinate_name) => `${coordinate_name}=${format_path_number(path_command[coordinate_name])}`);
    return [path_command.type, ...coordinate_values].join(" ");
  }).join("\n");
}

export function localized_font_name(font_names, name_key) {
  const platform_names = ["windows", "macintosh", "unicode"];
  for (const platform_name of platform_names) {
    const localized_names = font_names?.[platform_name]?.[name_key];
    if (!localized_names) {
      continue;
    }

    const preferred_value = localized_names.en
      ?? Object.values(localized_names).find((name_value) => String(name_value).trim());
    if (preferred_value) {
      return String(preferred_value).trim();
    }
  }

  return NOT_EMBEDDED_LABEL;
}

export function create_font_metadata(font_record) {
  const font_names = font_record?.names ?? {};
  const numeric_metadata = (metadata_value) => Number.isFinite(metadata_value)
    ? String(metadata_value)
    : NOT_EMBEDDED_LABEL;
  return [
    ["Family", localized_font_name(font_names, "fontFamily")],
    ["Style", localized_font_name(font_names, "fontSubfamily")],
    ["Full name", localized_font_name(font_names, "fullName")],
    ["PostScript name", localized_font_name(font_names, "postScriptName")],
    ["Version", localized_font_name(font_names, "version")],
    ["Copyright", localized_font_name(font_names, "copyright")],
    ["License", localized_font_name(font_names, "license")],
    ["License URL", localized_font_name(font_names, "licenseURL")],
    ["Designer", localized_font_name(font_names, "designer")],
    ["Description", localized_font_name(font_names, "description")],
    ["Units per em", numeric_metadata(font_record?.unitsPerEm)],
    ["Ascender", numeric_metadata(font_record?.ascender)],
    ["Descender", numeric_metadata(font_record?.descender)],
    ["Glyph count", numeric_metadata(font_record?.glyphs?.length)],
  ];
}

export function glyph_unicode_mappings(glyph_record) {
  const unicode_values = Array.isArray(glyph_record?.unicodes)
    ? glyph_record.unicodes
    : [];
  return unicode_values
    .filter((code_point) => Number.isInteger(code_point))
    .map(format_unicode_code_point)
    .join(", ") || NOT_EMBEDDED_LABEL;
}

export { NOT_EMBEDDED_LABEL };
