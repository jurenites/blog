const thumbnail_controllers = new Map();
let pointer_position = null;
let frame_request = 0;
let last_frame_time = 0;
let global_controller = null;
let motion_preference = null;
let fine_pointer = null;

export function thumbnail_coordinates(pointer_x, pointer_y, frame_bounds) {
  const fraction_x = Math.max(0, Math.min(1, (pointer_x - frame_bounds.left) / frame_bounds.width));
  const fraction_y = Math.max(0, Math.min(1, (pointer_y - frame_bounds.top) / frame_bounds.height));
  return { fraction_x, fraction_y, offset_x: fraction_x * 2 - 1, offset_y: fraction_y * 2 - 1 };
}

function update_thumbnails(frame_time) {
  frame_request = 0;
  const elapsed_time = last_frame_time ? Math.min(frame_time - last_frame_time, 100) : 16;
  last_frame_time = frame_time;
  const motion_allowed = !motion_preference.matches && fine_pointer.matches && !document.hidden;
  let gradient_unsettled = false;
  for (const [thumbnail_element, thumbnail_state] of thumbnail_controllers) {
    if (!thumbnail_element.isConnected) {
      release_thumbnail(thumbnail_element);
      continue;
    }
    const frame_bounds = thumbnail_element.getBoundingClientRect();
    const frame_visible = frame_bounds.bottom >= 0 && frame_bounds.top <= window.innerHeight
      && frame_bounds.width > 0 && frame_bounds.height > 0;
    const pointer_inside = motion_allowed && frame_visible && pointer_position
      && pointer_position.client_x >= frame_bounds.left && pointer_position.client_x <= frame_bounds.right
      && pointer_position.client_y >= frame_bounds.top && pointer_position.client_y <= frame_bounds.bottom;
    const cursor_values = pointer_inside
      ? thumbnail_coordinates(pointer_position.client_x, pointer_position.client_y, frame_bounds)
      : { fraction_x: 0, fraction_y: 0, offset_x: 0, offset_y: 0 };
    const target_x = thumbnail_state.frame_view.x + cursor_values.fraction_x * thumbnail_state.frame_view.width;
    const target_y = thumbnail_state.frame_view.y + cursor_values.fraction_y * thumbnail_state.frame_view.height;
    // Time-based exponential following: speed decreases with remaining distance.
    const follow_fraction = motion_allowed && frame_visible
      ? 1 - Math.exp(-elapsed_time / thumbnail_state.gradient_duration)
      : 1;
    thumbnail_state.highlight_x += (target_x - thumbnail_state.highlight_x) * follow_fraction;
    thumbnail_state.highlight_y += (target_y - thumbnail_state.highlight_y) * follow_fraction;
    const remaining_distance = Math.hypot(target_x - thumbnail_state.highlight_x, target_y - thumbnail_state.highlight_y);
    if (remaining_distance < Math.min(thumbnail_state.frame_view.width, thumbnail_state.frame_view.height) / 960) {
      thumbnail_state.highlight_x = target_x;
      thumbnail_state.highlight_y = target_y;
    } else if (thumbnail_state.highlight_node) {
      gradient_unsettled = true;
    }
    thumbnail_state.highlight_node?.setAttribute('gradientTransform', `translate(${thumbnail_state.highlight_x} ${thumbnail_state.highlight_y}) ${thumbnail_state.gradient_basis}`);
    thumbnail_state.layer_nodes.forEach((layer_node, layer_index) => {
      const depth_strength = thumbnail_state.depth_strengths[layer_index];
      const frame_view = thumbnail_state.frame_view;
      const horizontal_travel = thumbnail_state.horizontal_travel[layer_index];
      const target_transform = !pointer_inside ? 'none' : horizontal_travel !== null
        ? `translateX(${cursor_values.offset_x * horizontal_travel}px)`
        : `perspective(${Math.max(frame_view.width, frame_view.height) * 2}px) translate3d(${cursor_values.offset_x * depth_strength * frame_view.width / 64}px, ${cursor_values.offset_y * depth_strength * frame_view.height / 32}px, 0) rotateX(${-cursor_values.offset_y * depth_strength * 1.95}deg) rotateY(${cursor_values.offset_x * depth_strength * 1.95}deg)`;
      if (!motion_allowed || !frame_visible) {
        thumbnail_state.layer_animations[layer_index]?.cancel();
        thumbnail_state.layer_targets[layer_index] = 'none';
        return;
      }
      // Gradient settling must not restart layer animations on every frame.
      if (thumbnail_state.layer_targets[layer_index] === target_transform) return;
      const current_transform = getComputedStyle(layer_node).transform;
      thumbnail_state.layer_animations[layer_index]?.cancel();
      thumbnail_state.layer_targets[layer_index] = target_transform;
      const layer_animation = layer_node.animate(
        [{ transform: current_transform }, { transform: target_transform }],
        { duration: thumbnail_state.motion_duration, easing: 'ease-out', fill: 'forwards' },
      );
      thumbnail_state.layer_animations[layer_index] = layer_animation;
      if (target_transform === 'none') {
        layer_animation.onfinish = () => layer_animation.cancel();
      }
    });
  }
  if (!thumbnail_controllers.size) stop_global_events();
  else if (gradient_unsettled) schedule_update();
  else last_frame_time = 0;
}

function schedule_update() {
  if (!frame_request) frame_request = requestAnimationFrame(update_thumbnails);
}

function stop_global_events() {
  global_controller?.abort();
  global_controller = null;
  pointer_position = null;
  if (frame_request) cancelAnimationFrame(frame_request);
  frame_request = 0;
  last_frame_time = 0;
}

function release_thumbnail(thumbnail_element) {
  const thumbnail_state = thumbnail_controllers.get(thumbnail_element);
  thumbnail_state?.layer_animations.forEach((layer_animation) => layer_animation?.cancel());
  if (thumbnail_state?.highlight_node) {
    for (const [attribute_name, attribute_value] of thumbnail_state.gradient_attributes) {
      if (attribute_value === null) thumbnail_state.highlight_node.removeAttribute(attribute_name);
      else thumbnail_state.highlight_node.setAttribute(attribute_name, attribute_value);
    }
  }
  thumbnail_controllers.delete(thumbnail_element);
}

export function initialize_dynamic_thumbnails(thumbnail_context = document) {
  const thumbnail_elements = [...thumbnail_context.querySelectorAll('[data-dynamic-thumbnail]')];
  if (thumbnail_context.matches?.('[data-dynamic-thumbnail]')) thumbnail_elements.unshift(thumbnail_context);
  thumbnail_elements.forEach((thumbnail_element) => {
    if (thumbnail_controllers.has(thumbnail_element)) return;
    const artwork_element = thumbnail_element.matches('svg') ? thumbnail_element : thumbnail_element.querySelector('svg');
    const frame_view = artwork_element?.viewBox.baseVal;
    if (!frame_view || frame_view.width <= 0 || frame_view.height <= 0) return;
    const thumbnail_styles = getComputedStyle(thumbnail_element);
    const duration_value = thumbnail_styles.getPropertyValue('--motion-duration-medium-default').trim();
    const gradient_value = thumbnail_styles.getPropertyValue('--motion-duration-long-default').trim();
    const layer_nodes = [...thumbnail_element.querySelectorAll('[data-thumbnail-depth]')];
    const depth_numbers = layer_nodes.map((layer_node) => BigInt(layer_node.dataset.thumbnailDepth));
    const depth_order = [...new Set(depth_numbers)].sort((first_depth, second_depth) => first_depth < second_depth ? -1 : first_depth > second_depth ? 1 : 0);
    const highlight_node = thumbnail_element.querySelector('[data-thumbnail-highlight]');
    const gradient_attributes = highlight_node ? ['gradientTransform', 'gradientUnits', 'cx', 'cy', 'r', 'fx', 'fy'].map((attribute_name) => [attribute_name, highlight_node.getAttribute(attribute_name)]) : [];
    let gradient_basis = '';
    if (highlight_node) {
      const gradient_matrix = highlight_node.gradientTransform.baseVal.consolidate()?.matrix || new DOMMatrix();
      const relative_units = highlight_node.gradientUnits.baseVal !== 1;
      const radius_length = highlight_node.r.baseVal;
      const radius_value = radius_length.unitType === 2
        ? radius_length.valueInSpecifiedUnits / 100 * (relative_units ? 1 : Math.hypot(frame_view.width, frame_view.height) / Math.SQRT2)
        : radius_length.value;
      const background_shape = [...artwork_element.querySelectorAll('[fill]')].find((painted_node) => painted_node.getAttribute('fill') === `url(#${highlight_node.id})`);
      const background_bounds = background_shape?.getBBox() || frame_view;
      const scale_x = radius_value * (relative_units ? background_bounds.width : 1);
      const scale_y = radius_value * (relative_units ? background_bounds.height : 1);
      gradient_basis = `matrix(${gradient_matrix.a * scale_x} ${gradient_matrix.b * scale_y} ${gradient_matrix.c * scale_x} ${gradient_matrix.d * scale_y} 0 0)`;
      highlight_node.setAttribute('gradientUnits', 'userSpaceOnUse');
      highlight_node.setAttribute('cx', '0');
      highlight_node.setAttribute('cy', '0');
      highlight_node.setAttribute('r', '1');
      highlight_node.removeAttribute('fx');
      highlight_node.removeAttribute('fy');
    }
    thumbnail_controllers.set(thumbnail_element, {
      frame_view,
      gradient_basis,
      gradient_attributes,
      depth_strengths: depth_numbers.map((depth_number) => (depth_order.indexOf(depth_number) + 1) / depth_order.length),
      layer_nodes,
      horizontal_travel: layer_nodes.map((layer_node) => {
        if (!layer_node.classList.contains('dynamic-thumbnail__layer--horizontal')) return null;
        const artwork_bounds = layer_node.getBBox();
        // Move only within the artwork's existing overscan, never expose an edge.
        return Math.max(0, Math.min(frame_view.width / 32, frame_view.x - artwork_bounds.x, artwork_bounds.x + artwork_bounds.width - frame_view.x - frame_view.width));
      }),
      highlight_node,
      layer_animations: [],
      layer_targets: [],
      highlight_x: frame_view.x,
      highlight_y: frame_view.y,
      gradient_duration: (parseFloat(gradient_value) * (gradient_value.endsWith('ms') ? 1 : 1000) || 375) * 1.5,
      motion_duration: parseFloat(duration_value) * (duration_value.endsWith('ms') ? 1 : 1000) || 200,
    });
  });
  if (!thumbnail_controllers.size || global_controller) return;
  global_controller = new AbortController();
  motion_preference = matchMedia('(prefers-reduced-motion: reduce)');
  fine_pointer = matchMedia('(any-hover: hover) and (any-pointer: fine)');
  const event_options = { signal: global_controller.signal, passive: true };
  document.addEventListener('pointermove', (pointer_event) => {
    if (pointer_event.pointerType === 'touch' || motion_preference.matches || !fine_pointer.matches) return;
    pointer_position = { client_x: pointer_event.clientX, client_y: pointer_event.clientY };
    schedule_update();
  }, event_options);
  window.addEventListener('scroll', schedule_update, event_options);
  window.addEventListener('resize', schedule_update, event_options);
  document.addEventListener('visibilitychange', () => { pointer_position = null; schedule_update(); }, event_options);
  window.addEventListener('blur', () => { pointer_position = null; schedule_update(); }, event_options);
  document.documentElement.addEventListener('pointerleave', () => { pointer_position = null; schedule_update(); }, event_options);
  motion_preference.addEventListener('change', schedule_update, event_options);
  fine_pointer.addEventListener('change', schedule_update, event_options);
  schedule_update();
}

export function detach_dynamic_thumbnails(thumbnail_context = document) {
  for (const thumbnail_element of thumbnail_controllers.keys()) {
    if (thumbnail_context === thumbnail_element || thumbnail_context.contains(thumbnail_element)) release_thumbnail(thumbnail_element);
  }
  if (!thumbnail_controllers.size) stop_global_events();
}
