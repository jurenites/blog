export const PIXEL_CELL_COUNT = 25;

export function create_blank_pixel_pattern() {
  return Array.from({ length: PIXEL_CELL_COUNT }, () => false);
}

export function update_pixel_cell(pixel_pattern, cell_index, is_filled) {
  if (!Number.isInteger(cell_index) || cell_index < 0 || cell_index >= PIXEL_CELL_COUNT) {
    return pixel_pattern;
  }

  const updated_pattern = [...pixel_pattern];
  updated_pattern[cell_index] = Boolean(is_filled);
  return updated_pattern;
}

export function filled_pixel_count(pixel_pattern) {
  return pixel_pattern.filter(Boolean).length;
}
