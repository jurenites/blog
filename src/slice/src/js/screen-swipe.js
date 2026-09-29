// Distances use rendered pixels so each swipe covers a similar part of the phone.
export function create_swipe_motion(overflow_height, viewport_height, start_position, hold_duration, bottom_duration) {
  const motion_steps = [];
  let elapsed_time = 0;
  function add_step(scroll_position, duration_ms, easing_value = 'linear') {
    if (motion_steps.length) motion_steps[motion_steps.length - 1].easing = easing_value;
    elapsed_time += duration_ms;
    motion_steps.push({ transform: `translateY(${-scroll_position}px)`, elapsed_time });
  }
  const return_easing = 'cubic-bezier(0.16, 1, 0.3, 1)';
  const starts_bottom = start_position === 'bottom';
  const initial_position = typeof start_position === 'number'
    ? Math.min(overflow_height, Math.max(0, start_position)) : starts_bottom ? overflow_height : 0;
  add_step(initial_position, 0);
  add_step(initial_position, hold_duration);
  if (starts_bottom) {
    add_step(0, 900, return_easing);
    add_step(0, 650);
  }
  let scroll_position = starts_bottom ? 0 : initial_position;
  let swipe_index = 0;
  while (scroll_position < overflow_height) {
    const swipe_distance = viewport_height * (swipe_index % 2 ? 0.72 : 0.9);
    scroll_position = Math.min(overflow_height, scroll_position + swipe_distance);
    const reaches_bottom = scroll_position === overflow_height;
    add_step(scroll_position + (reaches_bottom ? viewport_height * 0.045 : 0),
      swipe_index % 2 ? 580 : 680, 'cubic-bezier(0.18, 0.7, 0.25, 1)');
    if (reaches_bottom) add_step(overflow_height, 360, return_easing);
    else add_step(scroll_position, swipe_index % 2 ? 240 : 340);
    swipe_index += 1;
  }
  add_step(overflow_height, bottom_duration);
  if (!starts_bottom) add_step(0, 900, return_easing);
  return {
    duration_ms: elapsed_time,
    key_frames: motion_steps.map(({ elapsed_time: step_time, ...frame_values }) => ({
      ...frame_values, offset: step_time / elapsed_time,
    })),
  };
}
