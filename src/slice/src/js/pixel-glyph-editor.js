import {
  create_blank_pixel_pattern,
  update_pixel_cell,
} from "./pixel-glyph-editor-data.js";

export function initialize_pixel_glyph_editor(pixel_editor) {
  if (pixel_editor.jurenites_pixel_editor_initialized) {
    return;
  }
  pixel_editor.jurenites_pixel_editor_initialized = true;

  const cell_buttons = Array.from(pixel_editor.querySelectorAll("[data-pixel-cell]"));
  const preview_cells = Array.from(
    pixel_editor.querySelectorAll("[data-pixel-preview-cell]"),
  );
  let pixel_pattern = create_blank_pixel_pattern();
  let is_pointer_painting = false;
  let pointer_paint_value = true;

  function render_pixel_pattern() {
    cell_buttons.forEach((cell_button, cell_index) => {
      const is_filled = pixel_pattern[cell_index];
      cell_button.setAttribute("aria-pressed", String(is_filled));
      cell_button.classList.toggle("is-filled", is_filled);
      preview_cells[cell_index]?.classList.toggle("is-filled", is_filled);
    });
  }

  function paint_cell(cell_button, is_filled) {
    const cell_index = Number(cell_button.dataset.pixelCell);
    pixel_pattern = update_pixel_cell(pixel_pattern, cell_index, is_filled);
    render_pixel_pattern();
  }

  cell_buttons.forEach((cell_button) => {
    cell_button.addEventListener("click", (click_event) => {
      if (click_event.detail > 0) {
        return;
      }
      paint_cell(cell_button, cell_button.getAttribute("aria-pressed") !== "true");
    });

    cell_button.addEventListener("pointerdown", (pointer_event) => {
      if (pointer_event.button !== 0) {
        return;
      }
      pointer_event.preventDefault();
      is_pointer_painting = true;
      pointer_paint_value = cell_button.getAttribute("aria-pressed") !== "true";
      paint_cell(cell_button, pointer_paint_value);
    });
  });

  pixel_editor.ownerDocument.addEventListener("pointermove", (pointer_event) => {
    if (!is_pointer_painting) {
      return;
    }
    const hovered_element = pixel_editor.ownerDocument.elementFromPoint(
      pointer_event.clientX,
      pointer_event.clientY,
    );
    const hovered_cell = hovered_element?.closest?.("[data-pixel-cell]");
    if (hovered_cell && pixel_editor.contains(hovered_cell)) {
      paint_cell(hovered_cell, pointer_paint_value);
    }
  });

  function end_pointer_painting() {
    is_pointer_painting = false;
  }
  pixel_editor.ownerDocument.addEventListener("pointerup", end_pointer_painting);
  pixel_editor.ownerDocument.addEventListener("pointercancel", end_pointer_painting);
  render_pixel_pattern();
}

export function initialize_pixel_glyph_editors(pixel_editor_context) {
  pixel_editor_context
    .querySelectorAll("[data-jurenites-pixel-glyph-editor]")
    .forEach((pixel_editor) => initialize_pixel_glyph_editor(pixel_editor));
}
