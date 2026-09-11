import { evolve_generation, paint_live_line, measure_life_grid, resize_life_board } from './game-of-life-engine.js';

const SIMULATION_INSTANCES = new Map();
const FRAME_INTERVAL = 1000 / 12;

function create_simulation(simulation_root) {
  const canvas_element = simulation_root.querySelector('canvas');
  const drawing_context = canvas_element.getContext('2d');
  if (!drawing_context) return () => {};
  const grid_canvas = document.createElement('canvas');
  const grid_context = grid_canvas.getContext('2d');
  const pause_button = simulation_root.querySelector('[data-life-pause]');
  const status_element = simulation_root.querySelector('[data-life-status]');
  const status_label = status_element.querySelector('[data-life-label]');
  const generation_element = status_element.querySelector('[data-life-generation]');
  const motion_preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const event_controller = new AbortController();
  const listener_options = { signal: event_controller.signal };
  let current_cells = new Uint8Array(0);
  let next_cells = new Uint8Array(0);
  let grid_layout = null;
  let generation_count = 0;
  let frame_request = 0;
  let previous_time = 0;
  let previous_pointer = null;
  let pointer_position = null;
  let is_paused = motion_preference.matches;
  let is_visible = true;
  let cell_size = 8;
  let live_size = 4;
  let border_size = 1;
  let pixel_ratio = 1;
  let living_color;

  function draw_cells() {
    if (!grid_layout) return;
    drawing_context.setTransform(1, 0, 0, 1, 0, 0);
    drawing_context.drawImage(grid_canvas, 0, 0);
    drawing_context.setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0);
    drawing_context.fillStyle = living_color;
    const live_inset = (cell_size - live_size) / 2;
    for (let cell_index = 0; cell_index < current_cells.length; cell_index += 1) {
      if (!current_cells[cell_index]) continue;
      drawing_context.fillRect(
        grid_layout.offset_horizontal + (cell_index % grid_layout.column_count) * grid_layout.cell_pitch + live_inset,
        grid_layout.offset_vertical + Math.floor(cell_index / grid_layout.column_count) * grid_layout.cell_pitch + live_inset,
        live_size, live_size,
      );
    }
    status_label.textContent = is_paused ? simulation_root.dataset.pausedLabel : simulation_root.dataset.liveLabel;
    const generation_text = generation_count.toLocaleString();
    if (generation_element.textContent !== generation_text) {
      generation_element.replaceChildren(...Array.from(generation_text, (digit_text) => {
        const digit_element = document.createElement('span');
        digit_element.className = 'game-of-life__digit';
        digit_element.textContent = digit_text;
        return digit_element;
      }));
    }
    simulation_root.dataset.generation = String(generation_count);
    simulation_root.dataset.paused = String(is_paused);
    pause_button.setAttribute('aria-label', is_paused ? pause_button.dataset.resumeLabel : pause_button.dataset.pauseLabel);
    pause_button.setAttribute('aria-pressed', String(is_paused));
  }

  function resize_canvas() {
    const canvas_bounds = canvas_element.getBoundingClientRect();
    if (canvas_bounds.width < 8 || canvas_bounds.height < 8) return;
    const computed_style = getComputedStyle(canvas_element);
    cell_size = parseFloat(computed_style.getPropertyValue('--component-game-of-life-cell-size-default'));
    live_size = parseFloat(computed_style.getPropertyValue('--component-game-of-life-live-size-default'));
    border_size = parseFloat(computed_style.getPropertyValue('--component-game-of-life-border-size-default'));
    const next_layout = measure_life_grid(canvas_bounds.width, canvas_bounds.height, cell_size, border_size);
    const first_layout = grid_layout === null;
    if (first_layout) {
      current_cells = Uint8Array.from({ length: next_layout.column_count * next_layout.row_count }, () => Number(Math.random() < 0.22));
    } else if (grid_layout.column_count !== next_layout.column_count || grid_layout.row_count !== next_layout.row_count) {
      current_cells = resize_life_board(current_cells, grid_layout.column_count, grid_layout.row_count, next_layout.column_count, next_layout.row_count);
    }
    next_cells = new Uint8Array(current_cells.length);
    grid_layout = next_layout;
    previous_pointer = null;
    pixel_ratio = window.devicePixelRatio || 1;
    // Intrinsic bitmap resolution only; CSS owns the 16:9 displayed surface.
    canvas_element.width = Math.round(canvas_bounds.width * pixel_ratio);
    canvas_element.height = Math.round(canvas_bounds.height * pixel_ratio);
    grid_canvas.width = canvas_element.width;
    grid_canvas.height = canvas_element.height;
    living_color = computed_style.color;
    grid_context.setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0);
    grid_context.fillStyle = computed_style.backgroundColor;
    grid_context.fillRect(0, 0, canvas_bounds.width, canvas_bounds.height);
    grid_context.fillStyle = computed_style.getPropertyValue('--theme-dark-border-divider-default').trim();
    // Paint shared borders once. Cell footprints are 8px, spaced 7px apart.
    for (let column_index = 0; column_index <= grid_layout.column_count; column_index += 1) {
      grid_context.fillRect(grid_layout.offset_horizontal + column_index * grid_layout.cell_pitch, grid_layout.offset_vertical, border_size, grid_layout.grid_height);
    }
    for (let row_index = 0; row_index <= grid_layout.row_count; row_index += 1) {
      grid_context.fillRect(grid_layout.offset_horizontal, grid_layout.offset_vertical + row_index * grid_layout.cell_pitch, grid_layout.grid_width, border_size);
    }
    simulation_root.dataset.columns = String(grid_layout.column_count);
    simulation_root.dataset.rows = String(grid_layout.row_count);
    simulation_root.dataset.gridWidth = String(grid_layout.grid_width);
    paint_pointer();
    draw_cells();
  }

  function animate_frame(current_time) {
    frame_request = 0;
    if (!simulation_root.isConnected) { destroy_simulation(); return; }
    if (is_paused || !is_visible || document.hidden || !grid_layout) return;
    if (current_time - previous_time >= FRAME_INTERVAL) {
      paint_pointer();
      evolve_generation(current_cells, next_cells, grid_layout.column_count, grid_layout.row_count, previous_pointer);
      [current_cells, next_cells] = [next_cells, current_cells];
      generation_count += 1;
      draw_cells();
      previous_time = current_time;
    }
    frame_request = requestAnimationFrame(animate_frame);
  }

  function update_playback() {
    cancelAnimationFrame(frame_request);
    frame_request = 0;
    previous_time = performance.now();
    if (!is_paused && is_visible && !document.hidden) frame_request = requestAnimationFrame(animate_frame);
    draw_cells();
  }

  function paint_pointer() {
    if (!grid_layout || !pointer_position) return;
    if (document.elementFromPoint(pointer_position.client_x, pointer_position.client_y) !== canvas_element) {
      previous_pointer = null;
      return;
    }
    const canvas_bounds = canvas_element.getBoundingClientRect();
    const column_index = Math.floor((pointer_position.client_x - canvas_bounds.left - grid_layout.offset_horizontal) / grid_layout.cell_pitch);
    const row_index = Math.floor((pointer_position.client_y - canvas_bounds.top - grid_layout.offset_vertical) / grid_layout.cell_pitch);
    if (column_index < 0 || column_index >= grid_layout.column_count || row_index < 0 || row_index >= grid_layout.row_count) {
      previous_pointer = null;
      return;
    }
    const current_pointer = [column_index, row_index];
    paint_live_line(current_cells, previous_pointer || current_pointer, current_pointer, grid_layout.column_count, grid_layout.row_count);
    previous_pointer = current_pointer;
  }

  function track_pointer(pointer_event) {
    if (pointer_position?.pointer_id !== pointer_event.pointerId) previous_pointer = null;
    pointer_position = { client_x: pointer_event.clientX, client_y: pointer_event.clientY, pointer_id: pointer_event.pointerId };
    paint_pointer();
    draw_cells();
  }

  function release_pointer() {
    pointer_position = null;
    previous_pointer = null;
  }

  pause_button.addEventListener('click', () => { is_paused = !is_paused; update_playback(); }, listener_options);
  canvas_element.addEventListener('pointerenter', track_pointer, listener_options);
  canvas_element.addEventListener('pointermove', track_pointer, listener_options);
  canvas_element.addEventListener('pointerdown', track_pointer, listener_options);
  canvas_element.addEventListener('pointerleave', release_pointer, listener_options);
  canvas_element.addEventListener('pointercancel', release_pointer, listener_options);
  canvas_element.addEventListener('pointerup', (pointer_event) => {
    if (pointer_event.pointerType !== 'mouse') release_pointer();
  }, listener_options);
  document.addEventListener('scroll', () => { paint_pointer(); draw_cells(); }, { ...listener_options, capture: true, passive: true });
  window.addEventListener('blur', release_pointer, listener_options);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) release_pointer();
    update_playback();
  }, listener_options);
  motion_preference.addEventListener('change', () => { is_paused = motion_preference.matches; update_playback(); }, listener_options);
  const resize_observer = new ResizeObserver(() => { resize_canvas(); update_playback(); });
  const visibility_observer = new IntersectionObserver((observer_entries) => {
    is_visible = observer_entries[0].isIntersecting;
    update_playback();
  });
  function destroy_simulation() {
    cancelAnimationFrame(frame_request);
    event_controller.abort();
    resize_observer.disconnect();
    visibility_observer.disconnect();
    SIMULATION_INSTANCES.delete(simulation_root);
  }
  resize_canvas();
  pause_button.hidden = false;
  resize_observer.observe(canvas_element);
  visibility_observer.observe(canvas_element);
  update_playback();
  return destroy_simulation;
}

export function initialize_game_of_life(page_context = document) {
  for (const [simulation_root, destroy_simulation] of SIMULATION_INSTANCES) {
    if (!simulation_root.isConnected) destroy_simulation();
  }
  const simulation_roots = [...page_context.querySelectorAll('[data-game-of-life]')];
  if (page_context.matches?.('[data-game-of-life]')) simulation_roots.unshift(page_context);
  for (const simulation_root of simulation_roots) {
    if (!SIMULATION_INSTANCES.has(simulation_root)) SIMULATION_INSTANCES.set(simulation_root, create_simulation(simulation_root));
  }
}

export function detach_game_of_life(page_context) {
  for (const [simulation_root, destroy_simulation] of SIMULATION_INSTANCES) {
    if (simulation_root === page_context || page_context.contains(simulation_root)) destroy_simulation();
  }
}
