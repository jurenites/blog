export const GRID_COLUMNS = 250;
export const GRID_ROWS = 200;
export const GLIDER_CELLS = [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]];

export function measure_life_grid(available_width, available_height, cell_size = 8, border_size = 1) {
  const cell_pitch = cell_size - border_size;
  const column_count = Math.max(1, Math.floor((available_width - border_size) / cell_pitch));
  const row_count = Math.max(1, Math.floor((available_height - border_size) / cell_pitch));
  const grid_width = column_count * cell_pitch + border_size;
  const grid_height = row_count * cell_pitch + border_size;
  return {
    column_count, row_count, cell_pitch, grid_width, grid_height,
    offset_horizontal: Math.max(0, Math.floor((available_width - grid_width) / 2)),
    offset_vertical: Math.max(0, Math.floor((available_height - grid_height) / 2)),
  };
}

export function resize_life_board(current_cells, previous_columns, previous_rows, next_columns, next_rows) {
  const resized_cells = new Uint8Array(next_columns * next_rows);
  for (let row_index = 0; row_index < Math.min(previous_rows, next_rows); row_index += 1) {
    resized_cells.set(current_cells.subarray(row_index * previous_columns, row_index * previous_columns + Math.min(previous_columns, next_columns)), row_index * next_columns);
  }
  return resized_cells;
}

// Every neighbour is read from the previous generation; edges wrap to a torus.
export function evolve_generation(current_cells, next_cells, column_count = GRID_COLUMNS, row_count = GRID_ROWS, held_cell = null) {
  for (let row_index = 0; row_index < row_count; row_index += 1) {
    const upper_row = ((row_index + row_count - 1) % row_count) * column_count;
    const center_row = row_index * column_count;
    const lower_row = ((row_index + 1) % row_count) * column_count;
    for (let column_index = 0; column_index < column_count; column_index += 1) {
      const left_column = (column_index + column_count - 1) % column_count;
      const right_column = (column_index + 1) % column_count;
      const cell_index = center_row + column_index;
      const neighbour_count = current_cells[upper_row + left_column] + current_cells[upper_row + column_index]
        + current_cells[upper_row + right_column] + current_cells[center_row + left_column]
        + current_cells[center_row + right_column] + current_cells[lower_row + left_column]
        + current_cells[lower_row + column_index] + current_cells[lower_row + right_column];
      next_cells[cell_index] = Number(neighbour_count === 3 || (current_cells[cell_index] === 1 && neighbour_count === 2));
    }
  }
  // The hovered cell is an external input, held alive between generations.
  if (held_cell) next_cells[held_cell[1] * column_count + held_cell[0]] = 1;
  return next_cells;
}

// Join sampled pointer positions with a one-cell-wide, gap-free raster line.
export function paint_live_line(current_cells, start_cell, end_cell, column_count, row_count) {
  let [column_index, row_index] = start_cell;
  const [end_column, end_row] = end_cell;
  const column_distance = Math.abs(end_column - column_index);
  const row_distance = -Math.abs(end_row - row_index);
  const column_step = column_index < end_column ? 1 : -1;
  const row_step = row_index < end_row ? 1 : -1;
  let error_value = column_distance + row_distance;
  while (true) {
    if (column_index >= 0 && column_index < column_count && row_index >= 0 && row_index < row_count) {
      current_cells[row_index * column_count + column_index] = 1;
    }
    if (column_index === end_column && row_index === end_row) break;
    const doubled_error = 2 * error_value;
    if (doubled_error >= row_distance) { error_value += row_distance; column_index += column_step; }
    if (doubled_error <= column_distance) { error_value += column_distance; row_index += row_step; }
  }
}

export function plant_glider(current_cells, column_index, row_index, column_count = GRID_COLUMNS, row_count = GRID_ROWS) {
  for (const [offset_column, offset_row] of GLIDER_CELLS) {
    current_cells[((row_index + offset_row + row_count) % row_count) * column_count
      + ((column_index + offset_column + column_count) % column_count)] = 1;
  }
}
