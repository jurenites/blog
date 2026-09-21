const PHOTO_CONTROLLERS = new WeakMap();

function find_photos(page_context) {
  return [
    ...(page_context.matches?.('[data-photo-stages]') ? [page_context] : []),
    ...page_context.querySelectorAll('[data-photo-stages]'),
  ];
}

/** Keep the displayed node untouched until the next image has fully decoded. */
export function initialize_progressive_photos(page_context = document) {
  find_photos(page_context).forEach((initial_image) => {
    if (PHOTO_CONTROLLERS.has(initial_image)) return;
    let image_candidates;
    try {
      image_candidates = JSON.parse(initial_image.dataset.photoStages);
    } catch {
      return;
    }
    if (!Array.isArray(image_candidates) || !image_candidates.length) return;

    let visible_image = initial_image;
    let loaded_index = -1;
    let attempted_index = -1;
    let next_stride = 1;
    let request_active = false;
    let photo_visible = initial_image.dataset.photoLazy !== 'true';
    let photo_disposed = false;
    let viewport_observer;
    let resize_observer;

    function target_index() {
      const display_width = visible_image.getBoundingClientRect().width;
      const pixel_density = navigator.connection?.saveData ? 1 : window.devicePixelRatio || 1;
      const required_width = Math.ceil(display_width * pixel_density);
      const matching_index = image_candidates.findIndex((image_candidate) => image_candidate.image_width >= required_width);
      return matching_index < 0 ? image_candidates.length - 1 : matching_index;
    }

    async function refine_photo() {
      if (request_active || !photo_visible || photo_disposed || !visible_image.isConnected) return;
      request_active = true;
      while (!photo_disposed && visible_image.isConnected && attempted_index < target_index()) {
        const request_index = Math.min(attempted_index + next_stride, target_index());
        const next_image = new Image();
        // Copy semantics and component styling before decoding, but never copy
        // the preview URL or allow lazy loading on a detached preload image.
        for (const image_attribute of visible_image.attributes) {
          if (!['src', 'srcset', 'loading'].includes(image_attribute.name)) {
            next_image.setAttribute(image_attribute.name, image_attribute.value);
          }
        }
        next_image.decoding = 'async';
        const request_started = performance.now();
        next_image.src = image_candidates[request_index].image_url;
        attempted_index = request_index;
        try {
          await next_image.decode();
          if (photo_disposed || !visible_image.isConnected) break;
          const request_duration = performance.now() - request_started;
          next_image.dataset.photoState = request_index >= target_index() ? 'complete' : 'refining';
          next_image.dataset.photoWidth = String(image_candidates[request_index].image_width);
          resize_observer?.unobserve(visible_image);
          PHOTO_CONTROLLERS.delete(visible_image);
          visible_image.replaceWith(next_image);
          visible_image = next_image;
          loaded_index = request_index;
          PHOTO_CONTROLLERS.set(visible_image, dispose_photo);
          resize_observer?.observe(visible_image);
          // Actual request + decode time also works where Network Information
          // is unavailable. Cached/fast stages skip one unnecessary download.
          next_stride = request_duration < 120 ? 2 : 1;
        } catch {
          // Try a higher derivative if one fails; retain the last decoded node.
          next_stride = 1;
        }
      }
      if (!photo_disposed) {
        visible_image.dataset.photoState = loaded_index >= target_index() ? 'complete' : 'error';
      }
      request_active = false;
    }

    function dispose_photo() {
      photo_disposed = true;
      viewport_observer?.disconnect();
      resize_observer?.disconnect();
      PHOTO_CONTROLLERS.delete(visible_image);
    }

    PHOTO_CONTROLLERS.set(initial_image, dispose_photo);
    if ('ResizeObserver' in window) {
      resize_observer = new ResizeObserver(() => { void refine_photo(); });
      resize_observer.observe(initial_image);
    }
    if (!photo_visible && 'IntersectionObserver' in window) {
      viewport_observer = new IntersectionObserver((entry_list) => {
        if (entry_list.some((photo_entry) => photo_entry.isIntersecting)) {
          photo_visible = true;
          viewport_observer.disconnect();
          void refine_photo();
        }
      }, { rootMargin: '200px' });
      viewport_observer.observe(initial_image);
    } else {
      photo_visible = true;
      void refine_photo();
    }
  });
}

export function detach_progressive_photos(page_context) {
  find_photos(page_context).forEach((image_element) => PHOTO_CONTROLLERS.get(image_element)?.());
}
