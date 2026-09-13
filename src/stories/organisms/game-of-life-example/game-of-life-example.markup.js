import example_template from './game-of-life-example.template.html?raw';
import { escape_html, render_template } from '../../template.js';

export function life_example_markup({ column_count = 5, row_count = 5, zoom_size = 2, living_cells = [], example_description = 'Game of Life example. Move the pointer to draw live cells. Reload to restore the pattern.' } = {}) {
  return render_template(example_template, {
    example_options: escape_html(JSON.stringify({ width: column_count, height: row_count, size: zoom_size, alive: living_cells })),
    example_description: escape_html(example_description),
  });
}
