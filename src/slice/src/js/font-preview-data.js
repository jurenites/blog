const NOT_EMBEDDED_LABEL = "Not embedded";
const GLYPH_BODY_ROW_COUNT = 4;
const GLYPH_OVERSHOOT_ROW_COUNT = 2;
const GLYPH_DESCENDER_ROW_COUNT = 1;
const uppercase_letter_pattern = /^\p{Uppercase_Letter}$/u;
const lowercase_letter_pattern = /^\p{Lowercase_Letter}$/u;
const unicode_letter_pattern = /^\p{Letter}$/u;
const greek_script_pattern = /^\p{Script=Greek}$/u;
const roundabout_extended_uppercase_order = new Map(
  [..."ĀƁĆĎĒƑĜĤĪĴĶĹƜŇǑƤǪƦŚŢŨѴŴХŶŹ"]
    .map((mapped_character, character_index) => [mapped_character, character_index]),
);
const roundabout_alternate_glyph_order = new Map(
  [..."ĀƁГĐĒŹĤƟĨĸɅМŇ≡ƠПƤƩŢŶɸХѰΏ"]
    .map((mapped_character, character_index) => [mapped_character, character_index]),
);
const four_pixel_cyrillic_uppercase_order = new Map(
  [..."АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"]
    .map((mapped_character, character_index) => [mapped_character, character_index]),
);
const four_pixel_cyrillic_lowercase_order = new Map(
  [..."абвгдеёжзийклмнопрстуфхцчшщъыьэюя"]
    .map((mapped_character, character_index) => [mapped_character, character_index]),
);

function code_point_is_between(code_point, range_start, range_end) {
  return code_point >= range_start && code_point <= range_end;
}

function is_keyboard_symbol(code_point) {
  return code_point_is_between(code_point, 0x21, 0x2F)
    || code_point_is_between(code_point, 0x3A, 0x40)
    || code_point_is_between(code_point, 0x5B, 0x60)
    || code_point_is_between(code_point, 0x7B, 0x7E);
}

export function create_glyph_metric_viewport(font_record) {
  const font_ascender = Math.abs(Number(font_record?.ascender) || 0);
  const font_descender = Math.abs(Number(font_record?.descender) || 0);
  const row_unit_size = Math.max(
    font_ascender / GLYPH_BODY_ROW_COUNT,
    font_descender / GLYPH_DESCENDER_ROW_COUNT,
    1,
  );
  const rows_above_baseline = GLYPH_BODY_ROW_COUNT + GLYPH_OVERSHOOT_ROW_COUNT;
  const total_row_count = rows_above_baseline + GLYPH_DESCENDER_ROW_COUNT;
  const baseline_y = rows_above_baseline * row_unit_size;

  return {
    ascender_y: baseline_y - font_ascender,
    baseline_y,
    descender_y: baseline_y + font_descender,
    overshoot_divider_y: row_unit_size,
    row_unit_size,
    view_height: total_row_count * row_unit_size,
    view_start_y: 0,
  };
}

export function group_glyph_inventory(glyph_inventory, font_identifier) {
  const numeric_mappings = glyph_inventory.filter(({ code_point }) =>
    code_point_is_between(code_point, 0x30, 0x39));
  const latin_uppercase_mappings = glyph_inventory.filter(({ code_point }) =>
    code_point_is_between(code_point, 0x41, 0x5A));
  const latin_lowercase_mappings = glyph_inventory.filter(({ code_point }) =>
    code_point_is_between(code_point, 0x61, 0x7A));
  const intermediate_groups = font_identifier === "roundabout"
    ? [{
      group_name: "roundabout-extended-uppercase",
      glyph_mappings: glyph_inventory
        .filter(({ character }) => roundabout_extended_uppercase_order.has(character))
        .toSorted((first_mapping, second_mapping) =>
          roundabout_extended_uppercase_order.get(first_mapping.character)
          - roundabout_extended_uppercase_order.get(second_mapping.character)),
    }]
    : [];
  const language_groups = font_identifier === "4pixel"
    ? [
      {
        group_name: "cyrillic-uppercase",
        glyph_mappings: glyph_inventory
          .filter(({ character }) => four_pixel_cyrillic_uppercase_order.has(character))
          .toSorted((first_mapping, second_mapping) =>
            four_pixel_cyrillic_uppercase_order.get(first_mapping.character)
            - four_pixel_cyrillic_uppercase_order.get(second_mapping.character)),
      },
      {
        group_name: "cyrillic-lowercase",
        glyph_mappings: glyph_inventory
          .filter(({ character }) => four_pixel_cyrillic_lowercase_order.has(character))
          .toSorted((first_mapping, second_mapping) =>
            four_pixel_cyrillic_lowercase_order.get(first_mapping.character)
            - four_pixel_cyrillic_lowercase_order.get(second_mapping.character)),
      },
    ]
    : [
      {
        group_name: "greek-uppercase",
        glyph_mappings: glyph_inventory.filter(({ character }) =>
          unicode_letter_pattern.test(character)
          && greek_script_pattern.test(character)
          && uppercase_letter_pattern.test(character)
          && !roundabout_alternate_glyph_order.has(character)),
      },
      {
        group_name: "roundabout-alternate-set",
        glyph_mappings: glyph_inventory
          .filter(({ character }) => roundabout_alternate_glyph_order.has(character))
          .toSorted((first_mapping, second_mapping) =>
            roundabout_alternate_glyph_order.get(first_mapping.character)
            - roundabout_alternate_glyph_order.get(second_mapping.character)),
      },
      {
        group_name: "greek-lowercase",
        glyph_mappings: glyph_inventory.filter(({ character }) =>
          unicode_letter_pattern.test(character)
          && greek_script_pattern.test(character)
          && lowercase_letter_pattern.test(character)),
      },
    ];
  const keyboard_symbol_mappings = glyph_inventory.filter(({ code_point }) =>
    is_keyboard_symbol(code_point));
  const primary_groups = [
    { group_name: "numeric", glyph_mappings: numeric_mappings },
    { group_name: "latin-uppercase", glyph_mappings: latin_uppercase_mappings },
    ...intermediate_groups,
    { group_name: "latin-lowercase", glyph_mappings: latin_lowercase_mappings },
    ...language_groups,
    { group_name: "keyboard-symbols", glyph_mappings: keyboard_symbol_mappings },
  ].filter(({ glyph_mappings }) => glyph_mappings.length > 0);
  const primary_code_points = new Set(primary_groups.flatMap(({ glyph_mappings }) =>
    glyph_mappings.map(({ code_point }) => code_point)));

  return {
    additional_mappings: glyph_inventory.filter(({ code_point }) =>
      !primary_code_points.has(code_point)),
    primary_groups,
  };
}

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
