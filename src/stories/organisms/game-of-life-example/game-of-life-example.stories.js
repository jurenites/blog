import { life_example_markup } from './game-of-life-example.markup.js';

const COLUMN_COUNT = 6;
const ROW_COUNT = 6;
const ZOOM_SIZE = 4;
const GLIDER_CELLS = ['b3', 'c4', 'd2', 'd3', 'd4'];
const BLINKER_CELLS = ['b3', 'c3', 'd3'];
const BLOCK_CELLS = ['b2', 'c2', 'b3', 'c3'];
const EXAMPLE_DESCRIPTION = 'Game of Life example. Move the pointer to draw live cells. Reload to restore the pattern.';

export default {
  title: 'Organisms/Game of Life Example',
  tags: ['autodocs'],
  render: life_example_markup,
  args: { column_count: COLUMN_COUNT, row_count: ROW_COUNT, zoom_size: ZOOM_SIZE, living_cells: GLIDER_CELLS, example_description: EXAMPLE_DESCRIPTION },
  argTypes: {
    column_count: { control: { type: 'number', min: 3, max: 100, step: 1 } },
    row_count: { control: { type: 'number', min: 3, max: 100, step: 1 } },
    zoom_size: { control: { type: 'number', min: 1, max: 8, step: 1 } },
    living_cells: { control: 'object' },
  },
};

export const glider_example = {};
export const blinker_example = { args: { living_cells: BLINKER_CELLS } };
export const block_example = { args: { living_cells: BLOCK_CELLS } };
