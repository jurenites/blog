const GALLERY_INSTANCES = new WeakMap();
export function initialize_accountia_showcases(page_context = document) {
  page_context.querySelectorAll('[data-accountia-gallery]').forEach(gallery_element => {
    if (GALLERY_INSTANCES.has(gallery_element)) return;
    const frame_items = [...gallery_element.querySelectorAll('[data-gallery-frame]')];
    const play_button = gallery_element.querySelector('[data-gallery-play]');
    let current_index = 0;
    let timer_handle;
    function show_frame(next_index) {
      current_index = (next_index + frame_items.length) % frame_items.length;
      frame_items.forEach((frame_element, frame_index) => { frame_element.hidden = frame_index !== current_index; });
      gallery_element.querySelector('[data-gallery-count]').textContent = `${current_index + 1} / ${frame_items.length}`;
      gallery_element.querySelector('[data-gallery-original]').href = frame_items[current_index].querySelector('img').src;
    }
    function stop_playback() {
      clearInterval(timer_handle);
      timer_handle = null;
      play_button.setAttribute('aria-pressed', 'false');
      play_button.textContent = 'Play sequence';
    }
    gallery_element.querySelector('[data-gallery-previous]').addEventListener('click', () => { stop_playback(); show_frame(current_index - 1); });
    gallery_element.querySelector('[data-gallery-next]').addEventListener('click', () => { stop_playback(); show_frame(current_index + 1); });
    play_button.addEventListener('click', () => {
      if (timer_handle) { stop_playback(); return; }
      play_button.setAttribute('aria-pressed', 'true');
      play_button.textContent = 'Pause sequence';
      timer_handle = setInterval(() => {
        if (!gallery_element.isConnected) { stop_playback(); return; }
        const element_bounds = gallery_element.getBoundingClientRect();
        if (!gallery_element.matches(':hover, :focus-within') && !document.hidden && element_bounds.bottom > 0 && element_bounds.top < innerHeight) show_frame(current_index + 1);
      }, 5000);
    });
    if (frame_items.length === 1) gallery_element.querySelectorAll('button').forEach(button_element => { button_element.hidden = true; });
    if (frame_items.length > 2 && !matchMedia('(prefers-reduced-motion: reduce)').matches) play_button.click();
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
    video_wrapper.querySelector('[data-video-expand]').addEventListener('click', button_event => {
      const expanded_state = video_wrapper.classList.toggle('accountia-preview__recording--expanded');
      button_event.currentTarget.setAttribute('aria-pressed', String(expanded_state));
    });
    GALLERY_INSTANCES.set(video_wrapper, true);
  });
}
