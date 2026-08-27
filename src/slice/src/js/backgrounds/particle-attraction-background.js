const PARTICLE_DIAMETER = 6;
const POINTER_INFLUENCE_RADIUS = 200;
const PARTICLE_AREA_DENSITY = 850;
const MINIMUM_PARTICLE_COUNT = 120;
const MAXIMUM_PARTICLE_COUNT = 2400;

function clamp_number(number_value, minimum_value, maximum_value) {
  return Math.min(maximum_value, Math.max(minimum_value, number_value));
}

function parse_color_channels(color_value) {
  const channel_matches = color_value.match(/[\d.]+/g);

  if (color_value.startsWith("#")) {
    const normalized_value = color_value.slice(1);
    const expanded_value = normalized_value.length === 3
      ? normalized_value.split("").map((color_digit) => color_digit.repeat(2)).join("")
      : normalized_value;

    return [0, 2, 4].map((channel_index) => (
      Number.parseInt(expanded_value.slice(channel_index, channel_index + 2), 16)
    ));
  }

  return channel_matches?.slice(0, 3).map(Number) ?? [160, 160, 160];
}

function create_particle_palette(background_wrapper) {
  const computed_styles = window.getComputedStyle(background_wrapper);
  const darker_channels = parse_color_channels(
    computed_styles.getPropertyValue("--theme-dark-border-outline-default").trim(),
  );
  const lighter_channels = parse_color_channels(
    computed_styles.getPropertyValue("--theme-dark-text-primary-default").trim(),
  );
  return Array.from({ length: 64 }, (_, tone_index) => {
    const tone_ratio = tone_index / 63;
    const mixed_channels = darker_channels.map((darker_channel, channel_index) => (
      Math.round(darker_channel + ((lighter_channels[channel_index] - darker_channel) * tone_ratio))
    ));

    return `rgb(${mixed_channels.join(" ")})`;
  });
}

function desired_particle_count(viewport_width, viewport_height) {
  return clamp_number(
    Math.round((viewport_width * viewport_height) / PARTICLE_AREA_DENSITY),
    MINIMUM_PARTICLE_COUNT,
    MAXIMUM_PARTICLE_COUNT,
  );
}

function create_particle_grid(viewport_width, viewport_height, particle_count) {
  const viewport_ratio = viewport_width / Math.max(1, viewport_height);
  const column_count = Math.max(1, Math.ceil(Math.sqrt(particle_count * viewport_ratio)));
  const row_count = Math.max(1, Math.ceil(particle_count / column_count));
  const cell_width = viewport_width / column_count;
  const cell_height = viewport_height / row_count;
  const particle_list = [];

  for (let particle_index = 0; particle_index < particle_count; particle_index += 1) {
    const column_index = particle_index % column_count;
    const row_index = Math.floor(particle_index / column_count);
    const jitter_x = (Math.random() - 0.5) * cell_width * 0.42;
    const jitter_y = (Math.random() - 0.5) * cell_height * 0.42;
    const position_x = clamp_number(
      ((column_index + 0.5) * cell_width) + jitter_x,
      PARTICLE_DIAMETER / 2,
      viewport_width - (PARTICLE_DIAMETER / 2),
    );
    const position_y = clamp_number(
      ((row_index + 0.5) * cell_height) + jitter_y,
      PARTICLE_DIAMETER / 2,
      viewport_height - (PARTICLE_DIAMETER / 2),
    );

    particle_list.push({
      position_x,
      position_y,
      home_x: position_x,
      home_y: position_y,
      velocity_x: 0,
      velocity_y: 0,
      radius_size: PARTICLE_DIAMETER / 2,
      tone_ratio: 0.08 + (Math.random() * 0.54),
    });
  }

  return particle_list;
}

function build_spatial_grid(particle_list, grid_cell_size) {
  const spatial_grid = new Map();

  particle_list.forEach((particle_item, particle_index) => {
    const cell_x = Math.floor(particle_item.position_x / grid_cell_size);
    const cell_y = Math.floor(particle_item.position_y / grid_cell_size);
    const cell_key = `${cell_x}:${cell_y}`;

    if (!spatial_grid.has(cell_key)) {
      spatial_grid.set(cell_key, []);
    }

    spatial_grid.get(cell_key).push(particle_index);
  });

  return spatial_grid;
}

function separate_particles(particle_list) {
  const grid_cell_size = PARTICLE_DIAMETER + 2;
  const spatial_grid = build_spatial_grid(particle_list, grid_cell_size);

  particle_list.forEach((particle_item, particle_index) => {
    const cell_x = Math.floor(particle_item.position_x / grid_cell_size);
    const cell_y = Math.floor(particle_item.position_y / grid_cell_size);

    for (let offset_y = -1; offset_y <= 1; offset_y += 1) {
      for (let offset_x = -1; offset_x <= 1; offset_x += 1) {
        const neighbor_key = `${cell_x + offset_x}:${cell_y + offset_y}`;
        const neighbor_indices = spatial_grid.get(neighbor_key) ?? [];

        neighbor_indices.forEach((neighbor_index) => {
          if (neighbor_index <= particle_index) {
            return;
          }

          const neighbor_item = particle_list[neighbor_index];
          const delta_x = neighbor_item.position_x - particle_item.position_x;
          const delta_y = neighbor_item.position_y - particle_item.position_y;
          const distance_squared = (delta_x * delta_x) + (delta_y * delta_y);
          const minimum_distance = particle_item.radius_size + neighbor_item.radius_size + 0.5;

          if (distance_squared >= minimum_distance * minimum_distance) {
            return;
          }

          const safe_distance = Math.max(0.01, Math.sqrt(distance_squared));
          const shares_position = distance_squared < 0.0001;
          const normal_x = shares_position
            ? ((particle_index + neighbor_index) % 2 === 0 ? -1 : 1)
            : delta_x / safe_distance;
          const normal_y = shares_position ? 0 : delta_y / safe_distance;
          const overlap_size = minimum_distance - safe_distance;
          const correction_size = overlap_size * 0.52;

          particle_item.position_x -= normal_x * correction_size;
          particle_item.position_y -= normal_y * correction_size;
          neighbor_item.position_x += normal_x * correction_size;
          neighbor_item.position_y += normal_y * correction_size;
          particle_item.velocity_x -= normal_x * 0.025;
          particle_item.velocity_y -= normal_y * 0.025;
          neighbor_item.velocity_x += normal_x * 0.025;
          neighbor_item.velocity_y += normal_y * 0.025;
        });
      }
    }
  });
}

export function create_particle_attraction_background(background_wrapper) {
  const background_canvas = document.createElement("canvas");
  const canvas_context = background_canvas.getContext("2d", { alpha: false });

  if (!canvas_context) {
    return;
  }

  let viewport_width = 1;
  let viewport_height = 1;
  let particle_list = [];
  let animation_frame = 0;
  let previous_frame_time = performance.now();
  let pointer_active = false;
  let pointer_target_x = 0;
  let pointer_target_y = 0;
  let pointer_position_x = 0;
  let pointer_position_y = 0;
  let particle_palette = create_particle_palette(background_wrapper);
  const reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  background_canvas.setAttribute("aria-hidden", "true");
  background_wrapper.appendChild(background_canvas);

  function resize_background() {
    const wrapper_bounds = background_wrapper.getBoundingClientRect();
    const next_width = Math.max(1, Math.round(wrapper_bounds.width));
    const next_height = Math.max(1, Math.round(wrapper_bounds.height));
    const pixel_ratio = Math.min(2, window.devicePixelRatio || 1);

    if (next_width === viewport_width && next_height === viewport_height) {
      return;
    }

    viewport_width = next_width;
    viewport_height = next_height;
    background_canvas.width = Math.round(viewport_width * pixel_ratio);
    background_canvas.height = Math.round(viewport_height * pixel_ratio);
    background_canvas.style.width = `${viewport_width}px`;
    background_canvas.style.height = `${viewport_height}px`;
    canvas_context.setTransform(pixel_ratio, 0, 0, pixel_ratio, 0, 0);
    particle_list = create_particle_grid(
      viewport_width,
      viewport_height,
      desired_particle_count(viewport_width, viewport_height),
    );
    pointer_target_x = viewport_width / 2;
    pointer_target_y = viewport_height / 2;
    pointer_position_x = pointer_target_x;
    pointer_position_y = pointer_target_y;
    particle_palette = create_particle_palette(background_wrapper);

    if (reduced_motion) {
      draw_background();
    }
  }

  function handle_pointer_move(pointer_event) {
    const wrapper_bounds = background_wrapper.getBoundingClientRect();
    pointer_target_x = clamp_number(pointer_event.clientX - wrapper_bounds.left, 0, viewport_width);
    pointer_target_y = clamp_number(pointer_event.clientY - wrapper_bounds.top, 0, viewport_height);
    pointer_active = true;
  }

  function handle_pointer_leave() {
    pointer_active = false;
  }

  function update_particle(particle_item, frame_scale) {
    const home_delta_x = particle_item.home_x - particle_item.position_x;
    const home_delta_y = particle_item.home_y - particle_item.position_y;
    particle_item.velocity_x += home_delta_x * 0.00028 * frame_scale;
    particle_item.velocity_y += home_delta_y * 0.00028 * frame_scale;

    if (pointer_active) {
      const pointer_delta_x = pointer_position_x - particle_item.position_x;
      const pointer_delta_y = pointer_position_y - particle_item.position_y;
      const pointer_distance = Math.sqrt(
        (pointer_delta_x * pointer_delta_x) + (pointer_delta_y * pointer_delta_y),
      );

      if (pointer_distance > 0.01 && pointer_distance < POINTER_INFLUENCE_RADIUS) {
        const distance_ratio = 1 - (pointer_distance / POINTER_INFLUENCE_RADIUS);
        const attraction_force = Math.pow(distance_ratio, 1.35) * 0.011 * frame_scale;
        particle_item.velocity_x += (pointer_delta_x / pointer_distance) * attraction_force;
        particle_item.velocity_y += (pointer_delta_y / pointer_distance) * attraction_force;
      }
    }

    particle_item.velocity_x *= Math.pow(0.965, frame_scale);
    particle_item.velocity_y *= Math.pow(0.965, frame_scale);
    const velocity_size = Math.sqrt(
      (particle_item.velocity_x * particle_item.velocity_x)
      + (particle_item.velocity_y * particle_item.velocity_y),
    );

    if (velocity_size > 0.72) {
      particle_item.velocity_x = (particle_item.velocity_x / velocity_size) * 0.72;
      particle_item.velocity_y = (particle_item.velocity_y / velocity_size) * 0.72;
    }

    particle_item.position_x += particle_item.velocity_x * frame_scale;
    particle_item.position_y += particle_item.velocity_y * frame_scale;
    particle_item.position_x = clamp_number(
      particle_item.position_x,
      particle_item.radius_size,
      viewport_width - particle_item.radius_size,
    );
    particle_item.position_y = clamp_number(
      particle_item.position_y,
      particle_item.radius_size,
      viewport_height - particle_item.radius_size,
    );
  }

  function draw_background() {
    const background_color = window.getComputedStyle(background_wrapper)
      .getPropertyValue("--theme-dark-surface-background-page")
      .trim();
    canvas_context.fillStyle = background_color;
    canvas_context.fillRect(0, 0, viewport_width, viewport_height);

    particle_list.forEach((particle_item) => {
      canvas_context.beginPath();
      canvas_context.arc(
        particle_item.position_x,
        particle_item.position_y,
        particle_item.radius_size,
        0,
        Math.PI * 2,
      );
      const tone_index = Math.round(particle_item.tone_ratio * (particle_palette.length - 1));
      canvas_context.fillStyle = particle_palette[tone_index];
      canvas_context.fill();
    });
  }

  function render_background(current_time) {
    const elapsed_time = Math.min(32, current_time - previous_frame_time);
    const frame_scale = elapsed_time / (1000 / 60);
    previous_frame_time = current_time;
    pointer_position_x += (pointer_target_x - pointer_position_x) * 0.035 * frame_scale;
    pointer_position_y += (pointer_target_y - pointer_position_y) * 0.035 * frame_scale;

    if (!reduced_motion) {
      particle_list.forEach((particle_item) => update_particle(particle_item, frame_scale));
      separate_particles(particle_list);
      separate_particles(particle_list);
    }

    draw_background();
    if (!reduced_motion) {
      animation_frame = window.requestAnimationFrame(render_background);
    }
  }

  const resize_observer = new ResizeObserver(resize_background);
  resize_observer.observe(background_wrapper);
  window.addEventListener("pointermove", handle_pointer_move, { passive: true });
  document.documentElement.addEventListener("pointerleave", handle_pointer_leave, { passive: true });
  resize_background();
  animation_frame = window.requestAnimationFrame(render_background);

  background_wrapper.jurenitesParticleDestroy = function destroy_particle_background() {
    window.cancelAnimationFrame(animation_frame);
    resize_observer.disconnect();
    window.removeEventListener("pointermove", handle_pointer_move);
    document.documentElement.removeEventListener("pointerleave", handle_pointer_leave);
    background_canvas.remove();
    delete background_wrapper.jurenitesParticleDestroy;
  };
}
