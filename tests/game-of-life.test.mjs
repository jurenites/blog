import { test } from 'node:test';
import { strict as assert_checks } from 'node:assert';
import { evolve_generation, plant_glider, measure_life_grid, resize_life_board, paint_live_line } from '../src/slice/src/js/game-of-life-engine.js';

test('fast pointer movement fills every cell between samples, in either direction', () => {
  const forward_cells = create_board([]);
  const backward_cells = create_board([]);
  paint_live_line(forward_cells, [1, 4], [10, 4], 12, 12);
  paint_live_line(backward_cells, [10, 4], [1, 4], 12, 12);
  assert_checks.deepEqual(forward_cells, create_board(Array.from({length: 10}, (_cell_value, cell_index) => [cell_index + 1, 4])));
  assert_checks.deepEqual(forward_cells, backward_cells);
});

test('diagonal and steep pointer lines are connected and single-cell wide', () => {
  for (const end_cell of [[9, 9], [4, 10], [10, 4]]) {
    const board_cells = create_board([]);
    paint_live_line(board_cells, [1, 1], end_cell, 12, 12);
    const expected_length = Math.max(end_cell[0] - 1, end_cell[1] - 1) + 1;
    assert_checks.equal(board_cells.reduce((cell_total, cell_value) => cell_total + cell_value, 0), expected_length);
    assert_checks.equal(board_cells[13], 1);
    assert_checks.equal(board_cells[end_cell[1] * 12 + end_cell[0]], 1);
  }
});

test('a stationary pointer paints one cell, holds it alive, and releases it back to Life', () => {
  let board_cells = create_board([]);
  const held_cell = [5, 5];
  paint_live_line(board_cells, held_cell, held_cell, 12, 12);
  assert_checks.deepEqual(board_cells, create_board([held_cell]));
  for (let generation_index = 0; generation_index < 20; generation_index += 1) {
    board_cells = evolve_generation(board_cells, new Uint8Array(144), 12, 12, held_cell);
    assert_checks.deepEqual(board_cells, create_board([held_cell]));
  }
  assert_checks.deepEqual(next_board(board_cells), create_board([]));
});

test('shared 1px borders fit the requested 799px and 281px grids', () => {
  const detail_grid = measure_life_grid(800, 450);
  assert_checks.equal(detail_grid.column_count, 114);
  assert_checks.equal(detail_grid.grid_width, 799);
  const thumbnail_grid = measure_life_grid(281, 281 * 9 / 16);
  assert_checks.equal(thumbnail_grid.column_count, 40);
  assert_checks.equal(thumbnail_grid.grid_width, 281);
  assert_checks.equal(thumbnail_grid.cell_pitch, 7);
  for (const available_width of [279.5, 320, 343, 600, 799]) {
    const measured_grid = measure_life_grid(available_width, available_width * 9 / 16);
    assert_checks.ok(measured_grid.grid_width <= available_width);
    assert_checks.ok(measured_grid.grid_height <= available_width * 9 / 16);
  }
});

test('resizing preserves surviving coordinates and leaves newly exposed cells dead', () => {
  const small_board = create_board([[1, 1], [3, 3]], 4);
  const larger_board = resize_life_board(small_board, 4, 4, 6, 5);
  assert_checks.equal(larger_board[7], 1);
  assert_checks.equal(larger_board[21], 1);
  assert_checks.equal(larger_board.reduce((cell_total, cell_value) => cell_total + cell_value, 0), 2);
  assert_checks.deepEqual(resize_life_board(larger_board, 6, 5, 2, 2), create_board([[1, 1]], 2));
});

function create_board(living_cells, board_size = 12) {
  const board_cells = new Uint8Array(board_size * board_size);
  for (const [column_index, row_index] of living_cells) board_cells[row_index * board_size + column_index] = 1;
  return board_cells;
}

function next_board(board_cells, board_size = 12) {
  return evolve_generation(board_cells, new Uint8Array(board_cells.length), board_size, board_size);
}

test('empty world stays empty and an isolated cell dies', () => {
  assert_checks.deepEqual(next_board(create_board([])), create_board([]));
  assert_checks.deepEqual(next_board(create_board([[4, 4]])), create_board([]));
});

test('block stays still and updates do not overwrite the previous generation', () => {
  const board_cells = create_board([[4, 4], [5, 4], [4, 5], [5, 5]]);
  const original_cells = board_cells.slice();
  assert_checks.deepEqual(next_board(board_cells), original_cells);
  assert_checks.deepEqual(board_cells, original_cells);
});

test('blinker alternates and returns after two generations', () => {
  const board_cells = create_board([[4, 5], [5, 5], [6, 5]]);
  assert_checks.deepEqual(next_board(board_cells), create_board([[5, 4], [5, 5], [5, 6]]));
  assert_checks.deepEqual(next_board(next_board(board_cells)), board_cells);
});

test('a glider translates one cell diagonally after four synchronous steps', () => {
  let board_cells = create_board([]);
  plant_glider(board_cells, 3, 3, 12, 12);
  for (let generation_index = 0; generation_index < 4; generation_index += 1) board_cells = next_board(board_cells);
  const expected_cells = create_board([]);
  plant_glider(expected_cells, 4, 4, 12, 12);
  assert_checks.deepEqual(board_cells, expected_cells);
});

test('simulation and glider fixtures wrap across field boundaries', () => {
  const edge_cells = create_board([[11, 5], [0, 5], [1, 5]]);
  assert_checks.deepEqual(next_board(edge_cells), create_board([[0, 4], [0, 5], [0, 6]]));
  const corner_cells = create_board([]);
  plant_glider(corner_cells, 11, 11, 12, 12);
  assert_checks.equal(corner_cells.reduce((total_count, cell_state) => total_count + cell_state, 0), 5);
  assert_checks.deepEqual(next_board(create_board([[5, 11], [5, 0], [5, 1]])), create_board([[4, 0], [5, 0], [6, 0]]));
});
