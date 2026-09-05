import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import opentype_library from "opentype.js";
import {
  NOT_EMBEDDED_LABEL,
  create_font_metadata,
  create_glyph_inventory,
  format_unicode_code_point,
  localized_font_name,
  safe_glyph_name,
  serialize_glyph_path,
} from "../src/slice/src/js/font-preview-data.js";

const FONT_ASSET_PATHS = [
  "src/public/assets/fonts/roundabout-regular.ttf",
  "src/public/assets/fonts/4pixel.ttf",
];

function parse_font_asset(font_asset_path) {
  const font_bytes = readFileSync(font_asset_path);
  const font_buffer = font_bytes.buffer.slice(
    font_bytes.byteOffset,
    font_bytes.byteOffset + font_bytes.byteLength,
  );
  return opentype_library.parse(font_buffer);
}

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
