const GALLERY_INSTANCES = new WeakMap();
export function initialize_accountia_showcases(page_context = document) {
  page_context.querySelectorAll('[data-accountia-gallery]').forEach(gallery_element => {
    if (GALLERY_INSTANCES.has(gallery_element)) return;
    const frame_items = [...gallery_element.querySelectorAll('[data-gallery-frame]')];
    const stage_element = gallery_element.querySelector('.accountia-preview__stage');
    const controls_element = gallery_element.querySelector('.accountia-preview__controls');
    const motion_query = matchMedia('(prefers-reduced-motion: reduce)');
    let current_index = 0;
    let requested_index = 0;
    let is_transitioning = false;

    async function show_frame(next_index) {
      requested_index = (next_index + frame_items.length) % frame_items.length;
      if (is_transitioning) return;
      is_transitioning = true;
      try {
        while (current_index !== requested_index) {
          const target_index = requested_index;
          const outgoing_frame = frame_items[current_index];
          const incoming_frame = frame_items[target_index];
          const incoming_image = incoming_frame.querySelector('img');
          incoming_image.loading = 'eager';
          await incoming_image.decode().catch(() => {});
          const fade_duration = motion_query.matches ? 0 : 140;
          const resize_duration = motion_query.matches ? 0 : 320;
          const outgoing_animation = outgoing_frame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: fade_duration, fill: 'forwards' });
          await outgoing_animation.finished;
          const control_top = controls_element.getBoundingClientRect().top;
          const previous_height = stage_element.getBoundingClientRect().height;
          let preserve_anchor = true;
          let anchor_request = 0;
          const input_controller = new AbortController();
          const release_anchor = () => { preserve_anchor = false; };
          window.addEventListener('wheel', release_anchor, { passive: true, signal: input_controller.signal });
          window.addEventListener('touchstart', release_anchor, { passive: true, signal: input_controller.signal });
          window.addEventListener('keydown', release_anchor, { signal: input_controller.signal });
          gallery_element.setAttribute('data-gallery-transition', '');
          outgoing_frame.hidden = true;
          incoming_frame.hidden = false;
          stage_element.scrollTop = 0;
          const next_height = stage_element.getBoundingClientRect().height;
          const height_animation = stage_element.animate([
            { height: `${previous_height}px` }, { height: `${next_height}px` },
          ], { duration: resize_duration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both' });
          const incoming_animation = incoming_frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: resize_duration, fill: 'both' });
          function anchor_controls() {
            if (preserve_anchor) {
              const offset_delta = controls_element.getBoundingClientRect().top - control_top;
              if (Math.abs(offset_delta) > 0.5) window.scrollBy({ top: offset_delta, behavior: 'instant' });
            }
          }
          function track_height() {
            anchor_controls();
            anchor_request = requestAnimationFrame(track_height);
          }
          track_height();
          try {
            await Promise.all([height_animation.finished, incoming_animation.finished]);
          } finally {
            cancelAnimationFrame(anchor_request);
            height_animation.cancel();
            incoming_animation.cancel();
            outgoing_animation.cancel();
            anchor_controls();
            input_controller.abort();
            gallery_element.removeAttribute('data-gallery-transition');
          }
          current_index = target_index;
          gallery_element.querySelector('[data-gallery-count]').textContent = `${current_index + 1} / ${frame_items.length}`;
          gallery_element.querySelector('[data-gallery-original]').href = incoming_image.src;
        }
      } finally {
        is_transitioning = false;
      }
    }
    gallery_element.querySelector('[data-gallery-previous]').addEventListener('click', () => { void show_frame(requested_index - 1); });
    gallery_element.querySelector('[data-gallery-next]').addEventListener('click', () => { void show_frame(requested_index + 1); });
    if (frame_items.length === 1) gallery_element.querySelectorAll('button').forEach(button_element => { button_element.hidden = true; });
    GALLERY_INSTANCES.set(gallery_element, true);
  });
  page_context.querySelectorAll('[data-accountia-video]').forEach(video_wrapper => {
    if (GALLERY_INSTANCES.has(video_wrapper)) return;
    const video_element = video_wrapper.querySelector('video');
    const loader_element = video_wrapper.querySelector('.media-loader');
    function finish_loading() {
      loader_element.dataset.loadingStage = 'complete';
      loader_element.setAttribute('aria-busy', 'false');
      loader_element.querySelector('progress').value = 100;
    }
    video_element.addEventListener('loadeddata', finish_loading, { once: true });
    video_element.addEventListener('error', () => { finish_loading(); video_wrapper.querySelector('[data-video-error]').hidden = false; });
    if (video_element.readyState >= 2) finish_loading();
    GALLERY_INSTANCES.set(video_wrapper, true);
  });
}
