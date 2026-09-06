import assert from "node:assert/strict";
import test from "node:test";
import {
  PIXEL_CELL_COUNT,
  create_blank_pixel_pattern,
  update_pixel_cell,
} from "../src/slice/src/js/pixel-glyph-editor-data.js";

test("the editor always starts as a blank 4 by 4 pattern", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(PIXEL_CELL_COUNT, 16);
  assert.equal(blank_pattern.length, PIXEL_CELL_COUNT);
  assert.equal(blank_pattern.every((cell_value) => cell_value === false), true);
});

test("filling and erasing is immutable and deterministic", () => {
  const blank_pattern = create_blank_pixel_pattern();
  const filled_pattern = update_pixel_cell(blank_pattern, 12, true);
  const erased_pattern = update_pixel_cell(filled_pattern, 12, false);
  assert.equal(blank_pattern[12], false);
  assert.equal(filled_pattern[12], true);
  assert.equal(erased_pattern[12], false);
});

test("out of range cell updates leave the pattern unchanged", () => {
  const blank_pattern = create_blank_pixel_pattern();
  assert.equal(update_pixel_cell(blank_pattern, 16, true), blank_pattern);
});
