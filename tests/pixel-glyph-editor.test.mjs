import assert from "node:assert/strict";
import test from "node:test";
import {
  PIXEL_CELL_COUNT,
  create_blank_pixel_pattern,
  filled_pixel_count,
  update_pixel_cell,
} from "../src/slice/src/js/pixel-glyph-editor-data.js";

test("the editor always starts as a blank 5 by 5 pattern", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(blank_pattern.length, PIXEL_CELL_COUNT);
  assert.equal(filled_pixel_count(blank_pattern), 0);
});

test("filling and erasing is immutable and deterministic", () => {
  const blank_pattern = create_blank_pixel_pattern();
  const filled_pattern = update_pixel_cell(blank_pattern, 12, true);
  const erased_pattern = update_pixel_cell(filled_pattern, 12, false);
  assert.equal(blank_pattern[12], false);
  assert.equal(filled_pattern[12], true);
  assert.equal(filled_pixel_count(erased_pattern), 0);
});

test("out of range cell updates leave the pattern unchanged", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(update_pixel_cell(blank_pattern, 25, true), blank_pattern);
});
