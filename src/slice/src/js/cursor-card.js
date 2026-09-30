import { install_screen_sequence } from './screen-sequence.js';

const card_controllers = new Map();

export function detach_cursor_cards(card_context = document) {
  for (const [card_element, card_state] of card_controllers) {
    if (card_context === card_element || card_context.contains(card_element)) {
      card_state.abort_controller.abort();
      card_state.reset_motion();
      card_controllers.delete(card_element);
    }
  }
}

export function initialize_cursor_cards(card_context = document) {
  const card_elements = [...card_context.querySelectorAll('[data-cursor-card]')];
  if (card_context.matches?.('[data-cursor-card]')) card_elements.unshift(card_context);
  card_elements.forEach((card_element) => {
    if (card_controllers.has(card_element)) return;
    const phone_element = card_element.querySelector('[data-card-phone]');
    const reflection_gradient = card_element.querySelector('[data-card-reflection]');
    if (!phone_element) return;
    const abort_controller = new AbortController();
    const event_options = { signal: abort_controller.signal, passive: true };
    install_screen_sequence(card_element, abort_controller.signal);
    if (card_element.dataset.followCursor === 'false') {
      card_controllers.set(card_element, { abort_controller, reset_motion: () => {} });
      return;
    }
    const motion_query = matchMedia('(prefers-reduced-motion: reduce)');
    const pointer_query = matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const duration_value = getComputedStyle(card_element).getPropertyValue('--motion-duration-long-default').trim();
    const motion_duration = parseFloat(duration_value) * (duration_value.endsWith('ms') ? 1 : 1000) || 375;
    let phone_animation = null;
    let frame_request = 0;
    let card_geometry = null;
    let pointer_position = null;
    let current_motion = [0, 0, 0, 0];
    let target_motion = [0, 0, 0, 0];
    let previous_time = 0;

    function invalidate_geometry() {
      card_geometry = null;
    }

    function animate_phone(frame_time) {
      frame_request = 0;
      if (pointer_position) {
        if (!card_geometry) {
          const card_bounds = card_element.getBoundingClientRect();
          card_geometry = {
            left_edge: card_bounds.left, top_edge: card_bounds.top,
            card_width: card_bounds.width, card_height: card_bounds.height,
            phone_width: phone_element.offsetWidth, phone_height: phone_element.offsetHeight,
            phone_left: phone_element.offsetLeft, phone_top: phone_element.offsetTop,
          };
        }
        const clamp_offset = (offset_value) => Math.max(-1, Math.min(1, offset_value));
        const pointer_x = pointer_position.client_x - card_geometry.left_edge;
        const pointer_y = pointer_position.client_y - card_geometry.top_edge;
        const offset_x = clamp_offset(pointer_x / card_geometry.card_width * 2 - 1);
        const offset_y = clamp_offset(pointer_y / card_geometry.card_height * 2 - 1);
        const tilt_x = clamp_offset((pointer_x - card_geometry.phone_left) / card_geometry.phone_width * 2 - 1);
        const tilt_y = clamp_offset((pointer_y - card_geometry.phone_top) / card_geometry.phone_height * 2 - 1);
        const travel_limit = Math.min(3, card_geometry.card_width * 0.01);
        target_motion = [offset_x * travel_limit, offset_y * travel_limit, -tilt_y * 10, tilt_x * 10];
        reflection_gradient?.setAttribute('cx', String((offset_x + 1) / 2));
        reflection_gradient?.setAttribute('cy', String((offset_y + 1) / 2));
        pointer_position = null;
      }
      // Reuse one paused effect; never sample computed transforms or restart
      // browser animations while the pointer is moving.
      const elapsed_time = previous_time ? Math.min(64, frame_time - previous_time) : 16;
      previous_time = frame_time;
      const easing_step = 1 - Math.exp(-elapsed_time / (motion_duration / 4));
      current_motion = current_motion.map((motion_value, motion_index) => {
        const remaining_value = target_motion[motion_index] - motion_value;
        return Math.abs(remaining_value) < 0.01 ? target_motion[motion_index] : motion_value + remaining_value * easing_step;
      });
      const [travel_x, travel_y, rotation_x, rotation_y] = current_motion;
      const phone_transform = `translate(${travel_x}px, ${travel_y}px) rotateX(${rotation_x}deg) rotateY(${rotation_y}deg)`;
      const key_frames = [{ transform: phone_transform }, { transform: phone_transform }];
      if (!phone_animation) {
        phone_animation = phone_element.animate(key_frames, { duration: 1, fill: 'both' });
        phone_animation.pause();
        phone_animation.currentTime = 0;
      } else {
        phone_animation.effect.setKeyframes(key_frames);
      }
      if (current_motion.some((motion_value, motion_index) => motion_value !== target_motion[motion_index])) {
        frame_request = requestAnimationFrame(animate_phone);
      } else {
        previous_time = 0;
        if (target_motion.every((motion_value) => motion_value === 0)) {
          phone_animation.cancel();
          phone_animation = null;
        }
      }
    }

    function reset_motion() {
      cancelAnimationFrame(frame_request);
      frame_request = 0;
      previous_time = 0;
      pointer_position = null;
      card_geometry = null;
      current_motion = [0, 0, 0, 0];
      target_motion = [0, 0, 0, 0];
      phone_animation?.cancel();
      phone_animation = null;
      reflection_gradient?.setAttribute('cx', '0.5');
      reflection_gradient?.setAttribute('cy', '0');
    }

    function return_phone() {
      pointer_position = null;
      card_geometry = null;
      reflection_gradient?.setAttribute('cx', '0.5');
      reflection_gradient?.setAttribute('cy', '0');
      target_motion = [0, 0, 0, 0];
      if (phone_animation && !frame_request) frame_request = requestAnimationFrame(animate_phone);
    }

    card_element.addEventListener('pointermove', (pointer_event) => {
      if (pointer_event.pointerType === 'touch' || motion_query.matches || !pointer_query.matches) return;
      pointer_position = { client_x: pointer_event.clientX, client_y: pointer_event.clientY };
      if (!frame_request) frame_request = requestAnimationFrame(animate_phone);
    }, event_options);
    const resize_observer = new ResizeObserver(invalidate_geometry);
    resize_observer.observe(card_element);
    resize_observer.observe(phone_element);
    abort_controller.signal.addEventListener('abort', () => resize_observer.disconnect(), { once: true });
    window.addEventListener('scroll', invalidate_geometry, { ...event_options, capture: true });
    window.addEventListener('resize', invalidate_geometry, event_options);
    card_element.addEventListener('pointerleave', return_phone, event_options);
    card_element.addEventListener('pointercancel', reset_motion, event_options);
    window.addEventListener('blur', reset_motion, event_options);
    document.addEventListener('visibilitychange', reset_motion, event_options);
    motion_query.addEventListener('change', reset_motion, event_options);
    pointer_query.addEventListener('change', reset_motion, event_options);
    card_controllers.set(card_element, { abort_controller, reset_motion });
  });
}
