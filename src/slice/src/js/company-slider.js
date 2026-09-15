const slider_instances = new Map();
const STEP_PAUSE_DURATION = 3000;
const STEP_TRANSITION_DURATION = 700;

export function initialize_company_sliders(page_context = document) {
  const slider_elements = [...page_context.querySelectorAll('[data-company-slider]')];
  if (page_context.matches?.('[data-company-slider]')) slider_elements.unshift(page_context);
  slider_elements.forEach((slider_element) => {
    if (slider_instances.has(slider_element)) return;
    const track_element = slider_element.querySelector('[data-company-track]');
    if (!track_element?.children.length) return;
    const slider_document = slider_element.ownerDocument;
    const slider_window = slider_document.defaultView;
    const motion_query = slider_window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener_controller = new AbortController();
    const event_options = { signal: listener_controller.signal };
    let scroll_targets = [];
    let travel_direction = 1;
    let pause_timer = 0;
    let frame_request = 0;
    let is_visible = false;
    let pointer_paused = false;
    let focus_paused = false;
    let touch_paused = false;
    let is_destroyed = false;
    const cancel_transition = () => {
      slider_window.cancelAnimationFrame(frame_request);
      frame_request = 0;
      track_element.classList.remove('company-slider__track--animating');
    };
    const can_autoplay = () => !is_destroyed && is_visible && !slider_document.hidden
      && !motion_query.matches && !pointer_paused && !focus_paused && !touch_paused && scroll_targets.length > 1;
    const schedule_step = () => {
      slider_window.clearTimeout(pause_timer);
      if (can_autoplay()) pause_timer = slider_window.setTimeout(advance_step, STEP_PAUSE_DURATION);
    };
    const animate_to_target = (target_offset) => {
      cancel_transition();
      const initial_offset = track_element.scrollLeft;
      if (motion_query.matches || Math.abs(target_offset - initial_offset) < 1) {
        track_element.scrollLeft = target_offset;
        schedule_step();
        return;
      }
      // Native snapping fights per-frame scrolling. Restore it at the exact
      // card boundary after a single eased transition, without moving the DOM.
      track_element.classList.add('company-slider__track--animating');
      const started_at = slider_window.performance.now();
      const animate_frame = (frame_time) => {
        const elapsed_fraction = Math.min(1, (frame_time - started_at) / STEP_TRANSITION_DURATION);
        const eased_fraction = elapsed_fraction * elapsed_fraction * (3 - 2 * elapsed_fraction);
        track_element.scrollLeft = initial_offset + (target_offset - initial_offset) * eased_fraction;
        if (elapsed_fraction < 1) {
          frame_request = slider_window.requestAnimationFrame(animate_frame);
        } else {
          frame_request = 0;
          track_element.classList.remove('company-slider__track--animating');
          schedule_step();
        }
      };
      frame_request = slider_window.requestAnimationFrame(animate_frame);
    };
    const target_in_direction = (step_direction) => step_direction > 0
      ? scroll_targets.find((target_offset) => target_offset > track_element.scrollLeft + 1)
      : scroll_targets.findLast((target_offset) => target_offset < track_element.scrollLeft - 1);
    function advance_step() {
      if (!can_autoplay()) return;
      let next_offset = target_in_direction(travel_direction);
      if (next_offset === undefined) {
        travel_direction *= -1;
        next_offset = target_in_direction(travel_direction);
      }
      if (next_offset !== undefined) animate_to_target(next_offset);
    }
    const sync_playback = () => {
      slider_window.clearTimeout(pause_timer);
      if (!can_autoplay()) cancel_transition();
      else if (!frame_request) schedule_step();
    };
    const measure_track = () => {
      cancel_transition();
      const maximum_scroll = Math.max(0, track_element.scrollWidth - track_element.clientWidth);
      const first_offset = track_element.firstElementChild.getBoundingClientRect().left;
      scroll_targets = [...new Set([0, ...[...track_element.children].map((company_item) =>
        Math.min(maximum_scroll, Math.max(0, company_item.getBoundingClientRect().left - first_offset))), maximum_scroll])];
      sync_playback();
    };
    slider_element.querySelector('[data-company-controls]')?.setAttribute('hidden', '');
    slider_element.addEventListener('pointerenter', (pointer_event) => {
      pointer_paused = pointer_event.pointerType === 'mouse';
      sync_playback();
    }, event_options);
    slider_element.addEventListener('pointerleave', () => { pointer_paused = false; sync_playback(); }, event_options);
    slider_element.addEventListener('focusin', () => { focus_paused = true; sync_playback(); }, event_options);
    slider_element.addEventListener('focusout', (focus_event) => {
      focus_paused = slider_element.contains(focus_event.relatedTarget);
      sync_playback();
    }, event_options);
    track_element.addEventListener('pointerdown', () => { touch_paused = true; sync_playback(); }, event_options);
    const finish_pointer = () => { touch_paused = false; sync_playback(); };
    slider_window.addEventListener('pointerup', finish_pointer, event_options);
    slider_window.addEventListener('pointercancel', finish_pointer, event_options);
    track_element.addEventListener('wheel', () => {
      cancel_transition();
      schedule_step();
    }, { ...event_options, passive: true });
    track_element.addEventListener('scroll', () => {
      if (!frame_request) schedule_step();
    }, { ...event_options, passive: true });
    track_element.addEventListener('keydown', (keyboard_event) => {
      if (keyboard_event.target !== track_element || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(keyboard_event.key)) return;
      keyboard_event.preventDefault();
      slider_window.clearTimeout(pause_timer);
      const next_offset = keyboard_event.key === 'Home' ? 0
        : keyboard_event.key === 'End' ? scroll_targets.at(-1)
          : target_in_direction(keyboard_event.key === 'ArrowLeft' ? -1 : 1);
      if (next_offset !== undefined) animate_to_target(next_offset);
    }, event_options);
    slider_document.addEventListener('visibilitychange', sync_playback, event_options);
    motion_query.addEventListener('change', sync_playback, event_options);
    const resize_observer = new slider_window.ResizeObserver(measure_track);
    resize_observer.observe(track_element);
    const visibility_observer = new slider_window.IntersectionObserver(([entry_state]) => {
      is_visible = entry_state.isIntersecting;
      sync_playback();
    });
    visibility_observer.observe(slider_element);
    measure_track();
    slider_instances.set(slider_element, () => {
      is_destroyed = true;
      slider_window.clearTimeout(pause_timer);
      cancel_transition();
      listener_controller.abort();
      resize_observer.disconnect();
      visibility_observer.disconnect();
    });
  });
}

export function detach_company_sliders(page_context = document) {
  slider_instances.forEach((destroy_slider, slider_element) => {
    if (page_context === slider_element || page_context.contains(slider_element)) {
      destroy_slider();
      slider_instances.delete(slider_element);
    }
  });
}
