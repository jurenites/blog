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
    let target_transform = 'none';

    function animate_phone() {
      frame_request = 0;
      const current_transform = getComputedStyle(phone_element).transform;
      phone_animation?.cancel();
      phone_animation = phone_element.animate(
        [{ transform: current_transform }, { transform: target_transform }],
        { duration: motion_duration, easing: 'ease-out', fill: 'forwards' },
      );
      if (target_transform === 'none') {
        const resting_animation = phone_animation;
        resting_animation.onfinish = () => resting_animation.cancel();
      }
    }

    function reset_motion() {
      cancelAnimationFrame(frame_request);
      frame_request = 0;
      target_transform = 'none';
      phone_animation?.cancel();
      reflection_gradient?.setAttribute('cx', '0.5');
      reflection_gradient?.setAttribute('cy', '0');
    }

    function return_phone() {
      reflection_gradient?.setAttribute('cx', '0.5');
      reflection_gradient?.setAttribute('cy', '0');
      target_transform = 'none';
      if (!frame_request) frame_request = requestAnimationFrame(animate_phone);
    }

    card_element.addEventListener('pointermove', (pointer_event) => {
      if (pointer_event.pointerType === 'touch' || motion_query.matches || !pointer_query.matches) return;
      const card_bounds = card_element.getBoundingClientRect();
      const offset_x = Math.max(-1, Math.min(1, (pointer_event.clientX - card_bounds.left) / card_bounds.width * 2 - 1));
      const offset_y = Math.max(-1, Math.min(1, (pointer_event.clientY - card_bounds.top) / card_bounds.height * 2 - 1));
      // Use untransformed phone geometry: the square tile otherwise dilutes
      // horizontal rotation while the cursor is over the narrow phone face.
      const phone_center_x = card_bounds.left + phone_element.offsetLeft + phone_element.offsetWidth / 2;
      const phone_center_y = card_bounds.top + phone_element.offsetTop + phone_element.offsetHeight / 2;
      const tilt_x = Math.max(-1, Math.min(1, (pointer_event.clientX - phone_center_x) / (phone_element.offsetWidth / 2)));
      const tilt_y = Math.max(-1, Math.min(1, (pointer_event.clientY - phone_center_y) / (phone_element.offsetHeight / 2)));
      // Let perspective lead the response; keep the phone close to its center.
      const travel_limit = Math.min(3, card_bounds.width * 0.01);
      reflection_gradient?.setAttribute('cx', String((offset_x + 1) / 2));
      reflection_gradient?.setAttribute('cy', String((offset_y + 1) / 2));
      target_transform = `translate(${offset_x * travel_limit}px, ${offset_y * travel_limit}px) rotateX(${-tilt_y * 10}deg) rotateY(${tilt_x * 10}deg)`;
      if (!frame_request) frame_request = requestAnimationFrame(animate_phone);
    }, event_options);
    card_element.addEventListener('pointerleave', return_phone, event_options);
    card_element.addEventListener('pointercancel', reset_motion, event_options);
    window.addEventListener('blur', reset_motion, event_options);
    document.addEventListener('visibilitychange', reset_motion, event_options);
    motion_query.addEventListener('change', reset_motion, event_options);
    pointer_query.addEventListener('change', reset_motion, event_options);
    card_controllers.set(card_element, { abort_controller, reset_motion });
  });
}
