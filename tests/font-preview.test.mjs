import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import opentype_library from "opentype.js";
import {
  NOT_EMBEDDED_LABEL,
  create_font_metadata,
  create_glyph_metric_viewport,
  create_glyph_inventory,
  format_unicode_code_point,
  group_glyph_inventory,
  localized_font_name,
  safe_glyph_name,
  serialize_glyph_path,
} from "../src/slice/src/js/font-preview-data.js";

const FONT_ASSET_PATHS = [
  "src/public/assets/fonts/roundabout-regular.ttf",
  "src/public/assets/fonts/4pixel.ttf",
];
const FONT_PREVIEW_TEMPLATE_PATHS = [
  "src/stories/organisms/font-preview/font-preview.template.html",
  "web/themes/custom/jurenites_theme/templates/paragraph/paragraph--font-preview.html.twig",
];
const FONT_PREVIEW_BEHAVIOR_PATH = "src/slice/src/js/font-preview.js";
const FONT_PREVIEW_MARKUP_HELPER_PATH =
  "src/stories/organisms/font-preview/font-preview.markup.js";
const FONT_PREVIEW_STYLES_PATH = "src/slice/src/scss/organisms/_font-preview.scss";

function parse_font_asset(font_asset_path) {
  const font_bytes = readFileSync(font_asset_path);
  const font_buffer = font_bytes.buffer.slice(
    font_bytes.byteOffset,
    font_bytes.byteOffset + font_bytes.byteLength,
  );
  return opentype_library.parse(font_buffer);
}

test("font preview keeps the input as its only editable sample surface", () => {
  FONT_PREVIEW_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");

    assert.match(template_source, /text-input__control|\{\{text_input\}\}/);
    assert.doesNotMatch(template_source, /font-preview__specimen|data-font-preview-specimen/);
  });

  const behavior_source = readFileSync(FONT_PREVIEW_BEHAVIOR_PATH, "utf8");
  assert.doesNotMatch(behavior_source, /font-preview-specimen|specimen_text/);
});

test("glyph tiles render only the mapped character as visible content", () => {
  const behavior_source = readFileSync(FONT_PREVIEW_BEHAVIOR_PATH, "utf8");
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");

  assert.match(behavior_source, /glyph_button\.append\(glyph_character\)/);
  assert.match(behavior_source, /glyph_button\.setAttribute\(\s*"aria-label"/);
  assert.match(behavior_source, /glyph_button\.dataset\.tooltipTrigger = ""/);
  assert.match(behavior_source, /glyph_button\.dataset\.tooltipColorVariant = "full-black"/);
  assert.match(behavior_source, /glyph_button\.dataset\.tooltipLabel = \[/);
  assert.doesNotMatch(behavior_source, /glyph_button\.title\s*=/);
  assert.doesNotMatch(behavior_source, /font-preview__glyph-(?:code|name)/);
  assert.doesNotMatch(styles_source, /font-preview__glyph-(?:code|name)/);
});

test("all glyph tiles keep the fixed basic-tile width for both fonts", () => {
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");

  assert.match(
    styles_source,
    /\.font-preview__glyph-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit, var\(--shape-basic-tile\)\)/s,
  );
  assert.doesNotMatch(
    styles_source,
    /\.font-preview__glyph-grid\s*\{[^}]*minmax\(var\(--shape-basic-tile\), 1fr\)/s,
  );
});

test("glyph detail uses one baseline-anchored seven-row coordinate system", () => {
  const behavior_source = readFileSync(FONT_PREVIEW_BEHAVIOR_PATH, "utf8");
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");

  assert.match(behavior_source, /toPathData\(\{ decimalPlaces: 2, flipY: false \}\)/);
  assert.doesNotMatch(styles_source, /\.font-preview--4pixel \.font-preview__glyph-svg/);
  assert.match(styles_source, /height:\s*calc\(var\(--shape-basic-tile\) \* 7\)/);

  FONT_ASSET_PATHS.forEach((font_asset_path) => {
    const font_record = parse_font_asset(font_asset_path);
    const glyph_viewport = create_glyph_metric_viewport(font_record);
    const rendered_body_rows = (
      glyph_viewport.baseline_y - glyph_viewport.ascender_y
    ) / glyph_viewport.row_unit_size;
    const rendered_top_rows = glyph_viewport.ascender_y / glyph_viewport.row_unit_size;
    const rendered_total_rows = glyph_viewport.view_height / glyph_viewport.row_unit_size;

    assert.equal(rendered_body_rows, 4);
    assert.equal(rendered_top_rows, 2);
    assert.equal(rendered_total_rows, 7);
    assert.ok(glyph_viewport.descender_y <= glyph_viewport.view_height);
  });

  const four_pixel_font = parse_font_asset(FONT_ASSET_PATHS[1]);
  const four_pixel_viewport = create_glyph_metric_viewport(four_pixel_font);
  const tall_glyph_box = four_pixel_font.charToGlyph("Ё").getBoundingBox();
  const descending_glyph_box = four_pixel_font.charToGlyph("$").getBoundingBox();

  assert.ok(four_pixel_viewport.baseline_y - tall_glyph_box.y2 >= 0);
  assert.ok(
    four_pixel_viewport.baseline_y - descending_glyph_box.y1
      <= four_pixel_viewport.view_height,
  );
});

test("glyph dialogs grow from their selected tile with reduced-motion support", () => {
  const behavior_source = readFileSync(FONT_PREVIEW_BEHAVIOR_PATH, "utf8");
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");

  FONT_PREVIEW_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");
    assert.match(template_source, /data-font-preview-glyph-transition-target/);
  });

  assert.match(behavior_source, /owner_document\.startViewTransition/);
  assert.match(behavior_source, /data-font-preview-glyph-transition-source/);
  assert.match(behavior_source, /data-font-preview-glyph-transition-active/);
  assert.match(behavior_source, /prefers-reduced-motion: reduce/);
  assert.match(
    styles_source,
    /::view-transition-group\(font-preview-selected-glyph\)[\s\S]*animation-duration:\s*var\(--motion-duration-extra-long\)/,
  );
  assert.match(
    styles_source,
    /@media \(prefers-reduced-motion: reduce\)[\s\S]*::view-transition-group\(font-preview-selected-glyph\)[\s\S]*animation-duration:\s*var\(--motion-duration-instant-default\)/,
  );
});

for (const [font_asset_path, font_identifier, expected_group_names] of [
  [FONT_ASSET_PATHS[0], "roundabout", [
    "numeric",
    "latin-uppercase",
    "roundabout-extended-uppercase",
    "latin-lowercase",
    "greek-uppercase",
    "roundabout-alternate-set",
    "greek-lowercase",
    "keyboard-symbols",
  ]],
  [FONT_ASSET_PATHS[1], "4pixel", [
    "numeric",
    "latin-uppercase",
    "latin-lowercase",
    "cyrillic-uppercase",
    "cyrillic-lowercase",
    "keyboard-symbols",
  ]],
]) {
  test(`${font_identifier} prioritizes familiar glyph groups and collapses the remainder`, () => {
    const glyph_inventory = create_glyph_inventory(parse_font_asset(font_asset_path));
    const grouped_inventory = group_glyph_inventory(glyph_inventory, font_identifier);
    const primary_group_names = grouped_inventory.primary_groups.map(({ group_name }) => group_name);
    const primary_mappings = grouped_inventory.primary_groups.flatMap(({ glyph_mappings }) =>
      glyph_mappings);
    const primary_code_points = new Set(
      primary_mappings.map(({ code_point }) => code_point),
    );
    const displayed_code_points = new Set([
      ...primary_code_points,
      ...grouped_inventory.additional_mappings.map(({ code_point }) => code_point),
    ]);
    const numeric_code_points = grouped_inventory.primary_groups[0].glyph_mappings
      .map(({ code_point }) => code_point);
    const keyboard_characters = grouped_inventory.primary_groups
      .find(({ group_name }) => group_name === "keyboard-symbols")
      .glyph_mappings.map(({ character }) => character);

    assert.deepEqual(primary_group_names, expected_group_names);
    assert.deepEqual(numeric_code_points, [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39]);
    assert.ok(["!", "#", "{", "("].every((character) => keyboard_characters.includes(character)));
    assert.equal(displayed_code_points.size, glyph_inventory.length);
    assert.ok(grouped_inventory.additional_mappings.every(({ code_point }) =>
      !primary_code_points.has(code_point)));
    assert.ok(grouped_inventory.additional_mappings.length > 0);
  });
}

test("Roundabout separates Greek capital and lowercase glyph grids", () => {
  const glyph_inventory = create_glyph_inventory(parse_font_asset(FONT_ASSET_PATHS[0]));
  const grouped_inventory = group_glyph_inventory(glyph_inventory, "roundabout");
  const greek_uppercase_group = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "greek-uppercase");
  const greek_lowercase_group = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "greek-lowercase");
  const additional_characters = new Set(
    grouped_inventory.additional_mappings.map(({ character }) => character),
  );

  assert.ok(greek_uppercase_group.glyph_mappings.length > 0);
  assert.ok(greek_lowercase_group.glyph_mappings.length > 0);
  assert.ok(greek_uppercase_group.glyph_mappings.every(({ character }) =>
    /^\p{Uppercase_Letter}$/u.test(character)));
  assert.ok(greek_uppercase_group.glyph_mappings.every(({ code_point }) =>
    code_point !== 0x038F));
  assert.ok(greek_lowercase_group.glyph_mappings.every(({ character }) =>
    /^\p{Lowercase_Letter}$/u.test(character)));
  assert.ok(additional_characters.has("ͺ"));
});

test("Roundabout exposes the requested alternate sequence between Greek groups", () => {
  const glyph_inventory = create_glyph_inventory(parse_font_asset(FONT_ASSET_PATHS[0]));
  const grouped_inventory = group_glyph_inventory(glyph_inventory, "roundabout");
  const primary_group_names = grouped_inventory.primary_groups.map(({ group_name }) => group_name);
  const alternate_glyph_mappings = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "roundabout-alternate-set")
    .glyph_mappings;

  assert.equal(
    alternate_glyph_mappings.map(({ character }) => character).join(""),
    "ĀƁГĐĒŹĤƟĨĸɅМŇ≡ƠПƤƩŢŶɸХѰΏ",
  );
  assert.equal(alternate_glyph_mappings.length, 24);
  assert.equal(alternate_glyph_mappings.at(-1).code_point, 0x038F);
  assert.equal(
    primary_group_names.indexOf("roundabout-alternate-set"),
    primary_group_names.indexOf("greek-uppercase") + 1,
  );
  assert.equal(
    primary_group_names.indexOf("greek-lowercase"),
    primary_group_names.indexOf("roundabout-alternate-set") + 1,
  );
});

test("Roundabout exposes the requested extended uppercase sequence between Latin groups", () => {
  const glyph_inventory = create_glyph_inventory(parse_font_asset(FONT_ASSET_PATHS[0]));
  const grouped_inventory = group_glyph_inventory(glyph_inventory, "roundabout");
  const primary_group_names = grouped_inventory.primary_groups.map(({ group_name }) => group_name);
  const extended_uppercase_characters = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "roundabout-extended-uppercase")
    .glyph_mappings.map(({ character }) => character);
  const additional_characters = new Set(
    grouped_inventory.additional_mappings.map(({ character }) => character),
  );

  assert.equal(
    extended_uppercase_characters.join(""),
    "ĀƁĆĎĒƑĜĤĪĴĶĹƜŇǑƤǪƦŚŢŨѴŴХŶŹ",
  );
  assert.equal(
    primary_group_names.indexOf("roundabout-extended-uppercase"),
    primary_group_names.indexOf("latin-uppercase") + 1,
  );
  assert.equal(
    primary_group_names.indexOf("latin-lowercase"),
    primary_group_names.indexOf("roundabout-extended-uppercase") + 1,
  );
  assert.ok(extended_uppercase_characters.every((character) =>
    !additional_characters.has(character)));
});

test("4pixel separates Cyrillic capital and lowercase glyph grids", () => {
  const glyph_inventory = create_glyph_inventory(parse_font_asset(FONT_ASSET_PATHS[1]));
  const grouped_inventory = group_glyph_inventory(glyph_inventory, "4pixel");
  const cyrillic_uppercase_characters = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "cyrillic-uppercase")
    .glyph_mappings.map(({ character }) => character);
  const cyrillic_lowercase_characters = grouped_inventory.primary_groups
    .find(({ group_name }) => group_name === "cyrillic-lowercase")
    .glyph_mappings.map(({ character }) => character);
  const additional_characters = new Set(
    grouped_inventory.additional_mappings.map(({ character }) => character),
  );

  assert.equal(
    cyrillic_uppercase_characters.join(""),
    "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ",
  );
  assert.equal(
    cyrillic_lowercase_characters.join(""),
    "абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
  );
  assert.equal(cyrillic_uppercase_characters.length, 33);
  assert.equal(cyrillic_lowercase_characters.length, 33);
  assert.ok(["ѐ", "ӿ"].every((character) => additional_characters.has(character)));
});

test("font preview templates expose a shared collapsed additional-glyph control", () => {
  FONT_PREVIEW_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");

    assert.match(template_source, /data-font-preview-primary-groups/);
    assert.match(template_source, /data-font-preview-additional-region/);
  });

  const markup_sources = [
    readFileSync(FONT_PREVIEW_MARKUP_HELPER_PATH, "utf8"),
    readFileSync(FONT_PREVIEW_TEMPLATE_PATHS[1], "utf8"),
  ];
  markup_sources.forEach((markup_source) => {
    assert.match(markup_source, /data-font-preview-additional-toggle/);
    assert.match(markup_source, /chevron-down/);
    assert.match(markup_source, /aria-expanded=(?:"false"|\\"false\\")/);
  });
});

test("additional-glyph toggle reuses the secondary Button hover treatment", () => {
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");
  const more_toggle_styles = styles_source.match(
    /\.font-preview__more-toggle\s*\{([\s\S]*?)\n\}/,
  )?.[1] ?? "";

  assert.match(more_toggle_styles, /&:hover\s*\{/);
  assert.match(more_toggle_styles, /border-color: var\(--theme-dark-border-outline-default\)/);
  assert.match(more_toggle_styles, /background: var\(--theme-dark-action-secondary-hover\)/);
  assert.match(more_toggle_styles, /color: var\(--color-palette-brand-tertiary\)/);
});

test("glyph dialogs use typed metadata and the shared Path data disclosure", () => {
  FONT_PREVIEW_TEMPLATE_PATHS.forEach((template_path) => {
    const template_source = readFileSync(template_path, "utf8");

    assert.match(template_source, /data-font-preview-path-region/);
    assert.match(template_source, /class="font-preview__path-code"/);
    assert.doesNotMatch(template_source, /<(?:details|summary)\b/);
  });

  const markup_sources = [
    readFileSync(FONT_PREVIEW_MARKUP_HELPER_PATH, "utf8"),
    readFileSync(FONT_PREVIEW_TEMPLATE_PATHS[1], "utf8"),
  ];
  markup_sources.forEach((markup_source) => {
    assert.match(markup_source, /data-font-preview-path-toggle/);
    assert.match(markup_source, /aria-expanded="false"/);
    assert.match(markup_source, /chevron-down/);
    assert.match(markup_source, /font-preview__path-icon/);
  });

  const behavior_source = readFileSync(FONT_PREVIEW_BEHAVIOR_PATH, "utf8");
  const styles_source = readFileSync(FONT_PREVIEW_STYLES_PATH, "utf8");
  assert.match(behavior_source, /set_path_data_visibility/);
  assert.match(behavior_source, /path_data_region\.hidden = !is_visible/);
  assert.match(styles_source, /\.font-preview__glyph-data dt[\s\S]*typography-caption/);
  assert.match(styles_source, /\.font-preview__glyph-data dd[\s\S]*typography-machine-readable/);
  assert.match(
    styles_source,
    /\.font-preview__path-toggle[\s\S]*width: var\(--shape-basic-tile\)/,
  );
  assert.match(
    styles_source,
    /\.font-preview__path-toggle[\s\S]*justify-content: center/,
  );
  assert.match(
    styles_source,
    /\.font-preview__path-details pre[\s\S]*background-color: var\(--color-palette-dark-black\)/,
  );
  assert.match(
    styles_source,
    /\.font-preview__path-code[\s\S]*typography-machine-readable/,
  );
});

test("Unicode labels use uppercase values padded to at least four digits", () => {
  assert.equal(format_unicode_code_point(0x53), "U+0053");
  assert.equal(format_unicode_code_point(0x1F642), "U+1F642");
});

for (const font_asset_path of FONT_ASSET_PATHS) {
  test(`${font_asset_path} exposes ordered cmap glyphs with drawable outlines`, () => {
    const parsed_font = parse_font_asset(font_asset_path);
    const glyph_inventory = create_glyph_inventory(parsed_font);

    assert.ok(glyph_inventory.length > 0);
    assert.ok(glyph_inventory.every(({ glyph_record }) => glyph_record.path.commands.length > 0));
    assert.ok(glyph_inventory.every(({ glyph_index, glyph_name }) => glyph_index > 0 && glyph_name !== ".notdef"));
    assert.deepEqual(
      glyph_inventory.map(({ code_point }) => code_point),
      glyph_inventory.map(({ code_point }) => code_point).toSorted((first_value, second_value) => first_value - second_value),
    );
  });
}

test("Roundabout uppercase S has the real mapping and serializable outline", () => {
  const parsed_font = parse_font_asset(FONT_ASSET_PATHS[0]);
  const glyph_mapping = create_glyph_inventory(parsed_font)
    .find(({ code_point }) => code_point === 0x53);

  assert.equal(glyph_mapping.glyph_name, "S");
  assert.equal(format_unicode_code_point(glyph_mapping.code_point), "U+0053");
  assert.match(serialize_glyph_path(glyph_mapping.glyph_record), /^M /);
});

test("glyph names and missing name-table values have honest fallbacks", () => {
  assert.equal(safe_glyph_name({ index: 7 }, 0x41), "A");
  assert.equal(safe_glyph_name({ index: 7 }, undefined), "glyph-7");
  assert.equal(localized_font_name({}, "license"), NOT_EMBEDDED_LABEL);
  const empty_metadata = new Map(create_font_metadata({ names: {} }));
  assert.equal(empty_metadata.get("License"), NOT_EMBEDDED_LABEL);
  assert.equal(empty_metadata.get("License URL"), NOT_EMBEDDED_LABEL);
  assert.equal(empty_metadata.get("Units per em"), NOT_EMBEDDED_LABEL);
});

test("current binaries expose their actual embedded copyright and license strings", () => {
  const embedded_licenses = FONT_ASSET_PATHS.map((font_asset_path) => {
    const metadata_rows = new Map(create_font_metadata(parse_font_asset(font_asset_path)));
    return metadata_rows.get("License");
  });

  assert.deepEqual(embedded_licenses, ["Non-Commercial License", "Open Font License"]);
});

test("font metadata includes embedded names and measurable font metrics", () => {
  const metadata_rows = new Map(create_font_metadata(parse_font_asset(FONT_ASSET_PATHS[0])));

  assert.equal(metadata_rows.get("Family"), "Roundabout");
  assert.notEqual(metadata_rows.get("Full name"), NOT_EMBEDDED_LABEL);
  assert.notEqual(metadata_rows.get("PostScript name"), NOT_EMBEDDED_LABEL);
  assert.match(metadata_rows.get("Units per em"), /^\d+$/);
  assert.match(metadata_rows.get("Glyph count"), /^\d+$/);
});
