import pixel_glyph_editor_template from "./pixel-glyph-editor.template.html?raw";
import { escape_html, render_template } from "../../template.js";

const GRID_SIZE = 4;

function cell_button_markup() {
  return Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, cell_index) => {
    const row_number = Math.floor(cell_index / GRID_SIZE) + 1;
    const column_number = (cell_index % GRID_SIZE) + 1;
    return `<button class="pixel-glyph-editor__cell" type="button" data-pixel-cell="${cell_index}" aria-label="Row ${row_number}, column ${column_number}" aria-pressed="false"></button>`;
  }).join("");
}

export function pixel_glyph_editor_markup({ component_id }) {
  return render_template(pixel_glyph_editor_template, {
    cell_buttons: cell_button_markup(),
    component_id: escape_html(component_id),
  });
}
