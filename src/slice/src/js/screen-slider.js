const SLIDER_INSTANCES = new WeakMap();
const SCREEN_DURATION = 8000;

export function initialize_screen_sliders(page_context = document) {
  const slider_elements = [...page_context.querySelectorAll('[data-screen-slider]')];
  if (page_context.matches?.('[data-screen-slider]')) slider_elements.unshift(page_context);
  slider_elements.forEach((slider_element) => {
    if (SLIDER_INSTANCES.has(slider_element)) return;
    const track_element = slider_element.querySelector('[data-slider-track]');
    const viewport_element = slider_element.querySelector('[data-slider-viewport]');
    const screen_elements = [...track_element.children];
    const dot_elements = [...slider_element.querySelectorAll('[data-slider-dot]')];
    const toggle_button = slider_element.querySelector('[data-slider-toggle]');
    const count_element = slider_element.querySelector('[data-slider-count]');
    const screen_count = screen_elements.length;
    if (!screen_count) return;
    const abort_controller = new AbortController();
    const event_options = { signal: abort_controller.signal };
    const motion_query = window.matchMedia('(prefers-reduced-motion: reduce)');
    let user_paused = motion_query.matches;
    let pointer_paused = false;
    let focus_paused = false;
    let is_visible = false;
    let drag_origin = null;
    let drag_time = 0;
    let frame_request = 0;
    let current_index = -1;
    const screen_stride = screen_elements[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track_element).gap);
    const cycle_duration = screen_count * SCREEN_DURATION;
    // Keep the loop filled to the browser edge, including after window resizing.
    const fill_loop_tail = () => {
      const clone_count = Math.ceil(viewport_element.getBoundingClientRect().width / screen_stride) + 1;
      const existing_count = track_element.querySelectorAll('[data-slider-clone]').length;
      for (let clone_index = existing_count; clone_index < clone_count; clone_index += 1) {
        const cloned_screen = screen_elements[clone_index % screen_count].cloneNode(true);
        cloned_screen.setAttribute('aria-hidden', 'true');
        cloned_screen.setAttribute('inert', '');
        cloned_screen.dataset.sliderClone = '';
        track_element.append(cloned_screen);
      }
    };
    fill_loop_tail();
    const resize_observer = new ResizeObserver(fill_loop_tail);
    resize_observer.observe(viewport_element);
    const track_animation = track_element.animate([
      { transform: 'translateX(0)' },
      { transform: `translateX(${-screen_stride * screen_count}px)` },
    ], { duration: cycle_duration, iterations: Infinity, easing: 'linear' });
    track_animation.pause();
    const normalized_time = (time_value) => ((time_value % cycle_duration) + cycle_duration) % cycle_duration;
    const update_pagination = () => {
      const next_index = Math.floor(normalized_time(Number(track_animation.currentTime) || 0) / SCREEN_DURATION + 0.5) % screen_count;
      if (next_index === current_index) return;
      current_index = next_index;
      // Keep a bounded filename-ordered window, including at both ends of the sequence.
      const first_index = Math.max(0, Math.min(current_index - 4, screen_count - 9));
      dot_elements.forEach((dot_element, dot_index) => {
        dot_element.hidden = screen_count > 10 && (dot_index < first_index || dot_index >= first_index + 9);
        dot_element.dataset.dotDistance = String(Math.min(4, Math.abs(dot_index - current_index)));
        dot_element.classList.toggle('is-active', dot_index === current_index);
        dot_element.setAttribute('aria-pressed', String(dot_index === current_index));
      });
      count_element.textContent = `${current_index + 1} / ${screen_count}`;
      // Warm the next screens before they enter the continuously moving viewport.
      for (let ahead_index = 0; ahead_index < Math.ceil(viewport_element.clientWidth / screen_stride) + 2; ahead_index += 1) {
        screen_elements[(current_index + ahead_index) % screen_count].querySelector('img').loading = 'eager';
      }
    };
    const animate_pagination = () => {
      update_pagination();
      if (track_animation.playState === 'running') frame_request = requestAnimationFrame(animate_pagination);
    };
    const sync_playback = () => {
      cancelAnimationFrame(frame_request);
      const should_play = screen_count > 1 && !user_paused && !pointer_paused && !focus_paused && drag_origin === null && is_visible && !document.hidden;
      if (should_play) {
        track_animation.play();
        frame_request = requestAnimationFrame(animate_pagination);
      } else track_animation.pause();
      toggle_button.setAttribute('aria-label', user_paused ? toggle_button.dataset.playLabel : toggle_button.dataset.pauseLabel);
      toggle_button.setAttribute('aria-pressed', String(user_paused));
    };
    const show_screen = (screen_index) => {
      track_animation.currentTime = normalized_time(screen_index * SCREEN_DURATION);
      update_pagination();
    };
    dot_elements.forEach((dot_element, dot_index) => {
      dot_element.addEventListener('click', () => show_screen(dot_index), event_options);
    });
    slider_element.querySelector('[data-slider-previous]').addEventListener('click', () => show_screen(current_index - 1), event_options);
    slider_element.querySelector('[data-slider-next]').addEventListener('click', () => show_screen(current_index + 1), event_options);
    toggle_button.addEventListener('click', () => {
      user_paused = !user_paused;
      if (!user_paused) {
        pointer_paused = false;
        focus_paused = false;
      }
      sync_playback();
    }, event_options);
    slider_element.addEventListener('pointerenter', (pointer_event) => { pointer_paused = pointer_event.pointerType === 'mouse'; sync_playback(); }, event_options);
    slider_element.addEventListener('pointerleave', () => { pointer_paused = false; sync_playback(); }, event_options);
    slider_element.addEventListener('focusin', () => { focus_paused = true; sync_playback(); }, event_options);
    slider_element.addEventListener('focusout', (focus_event) => {
      focus_paused = slider_element.contains(focus_event.relatedTarget);
      sync_playback();
    }, event_options);
    viewport_element.addEventListener('keydown', (key_event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key_event.key)) return;
      key_event.preventDefault();
      show_screen(key_event.key === 'Home' ? 0 : key_event.key === 'End' ? screen_count - 1 : current_index + (key_event.key === 'ArrowRight' ? 1 : -1));
    }, event_options);
    viewport_element.addEventListener('pointerdown', (pointer_event) => {
      if (pointer_event.button !== 0) return;
      drag_origin = pointer_event.clientX;
      drag_time = Number(track_animation.currentTime) || 0;
      viewport_element.setPointerCapture(pointer_event.pointerId);
      sync_playback();
    }, event_options);
    viewport_element.addEventListener('pointermove', (pointer_event) => {
      if (drag_origin === null) return;
      track_animation.currentTime = normalized_time(drag_time + (drag_origin - pointer_event.clientX) / screen_stride * SCREEN_DURATION);
      update_pagination();
    }, event_options);
    const finish_drag = () => { drag_origin = null; sync_playback(); };
    viewport_element.addEventListener('pointerup', finish_drag, event_options);
    viewport_element.addEventListener('pointercancel', finish_drag, event_options);
    viewport_element.addEventListener('lostpointercapture', finish_drag, event_options);
    document.addEventListener('visibilitychange', sync_playback, event_options);
    motion_query.addEventListener('change', () => { user_paused = motion_query.matches; sync_playback(); }, event_options);
    const visibility_observer = new IntersectionObserver(([entry_state]) => { is_visible = entry_state.isIntersecting; sync_playback(); });
    visibility_observer.observe(slider_element);
    update_pagination();
    sync_playback();
    SLIDER_INSTANCES.set(slider_element, () => {
      abort_controller.abort();
      visibility_observer.disconnect();
      resize_observer.disconnect();
      cancelAnimationFrame(frame_request);
      track_animation.cancel();
      track_element.querySelectorAll('[data-slider-clone]').forEach((clone_element) => clone_element.remove());
      SLIDER_INSTANCES.delete(slider_element);
    });
  });
}

export function detach_screen_sliders(page_context) {
  page_context.querySelectorAll('[data-screen-slider]').forEach((slider_element) => SLIDER_INSTANCES.get(slider_element)?.());
  if (page_context.matches?.('[data-screen-slider]')) SLIDER_INSTANCES.get(page_context)?.();
}
