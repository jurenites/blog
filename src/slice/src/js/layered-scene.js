const scene_controllers = new WeakMap();

/** One foreground entrance; the background never participates in animation. */
export function attach_layered_scene(scene_element) {
  const background_image = scene_element.querySelector('.layered-scene__background');
  const foreground_image = scene_element.querySelector('.layered-scene__foreground');
  if (!background_image) return () => {};
  const owner_document = scene_element.ownerDocument;
  const browser_window = owner_document.defaultView;
  const motion_preference = browser_window.matchMedia('(prefers-reduced-motion: reduce)');
  const event_controller = new AbortController();
  let scene_observer;
  let arrival_animation;
  let is_disposed = false;
  let images_ready = false;
  let scene_visible = !browser_window.IntersectionObserver;
  let entrance_started = false;
  let scene_complete = false;
  const should_animate = foreground_image?.animate && scene_element.dataset.arrivalEnabled === 'true' && !motion_preference.matches;

  const dispose_scene = () => {
    is_disposed = true;
    scene_observer?.disconnect();
    arrival_animation?.cancel();
    event_controller.abort();
  };
  const finish_scene = () => {
    if (is_disposed) return;
    scene_complete = true;
    arrival_animation?.cancel();
    scene_observer?.disconnect();
    event_controller.abort();
    scene_element.dataset.sceneState = 'complete';
  };
  const start_entrance = () => {
    if (is_disposed || scene_complete || entrance_started || !images_ready || !scene_visible || owner_document.hidden) return;
    if (!scene_element.isConnected) { dispose_scene(); return; }
    entrance_started = true;
    scene_observer?.disconnect();
    const scene_styles = browser_window.getComputedStyle(scene_element);
    const arrival_duration = Number.parseFloat(scene_styles.getPropertyValue('--component-layered-scene-arrival-duration-default'));
    const arrival_delay = Number.parseFloat(scene_styles.getPropertyValue('--component-layered-scene-arrival-delay-default'));
    if (!Number.isFinite(arrival_duration) || !Number.isFinite(arrival_delay)) { finish_scene(); return; }
    const entrance_animation = foreground_image.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: arrival_duration, delay: arrival_delay, easing: 'ease-in-out', fill: 'both',
    });
    arrival_animation?.cancel();
    arrival_animation = entrance_animation;
    arrival_animation.onfinish = finish_scene;
    scene_element.dataset.sceneState = 'appearing';
  };

  if (should_animate) {
    arrival_animation = foreground_image.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' });
    scene_element.dataset.sceneState = 'loading';
    if (browser_window.IntersectionObserver) {
      scene_observer = new browser_window.IntersectionObserver((scene_entries) => {
        if (!scene_element.isConnected) { dispose_scene(); return; }
        scene_visible = scene_entries.some((scene_entry) => scene_entry.isIntersecting);
        start_entrance();
      }, { threshold: 0.25 });
      scene_observer.observe(scene_element.querySelector('.layered-scene__frame'));
    }
    owner_document.addEventListener('visibilitychange', () => {
      if (owner_document.hidden) arrival_animation?.pause();
      else if (entrance_started && !scene_complete) arrival_animation?.play();
      else start_entrance();
    }, { signal: event_controller.signal });
    motion_preference.addEventListener('change', () => {
      if (motion_preference.matches) finish_scene();
    }, { signal: event_controller.signal });
  }
  const decode_image = async (image_element) => {
    if (!image_element) return true;
    try { await image_element.decode(); return image_element.naturalWidth > 0; }
    catch { return false; }
  };
  Promise.all([decode_image(background_image), decode_image(foreground_image)]).then(([background_loaded, foreground_loaded]) => {
    if (is_disposed) return;
    if (!background_loaded) scene_element.classList.add('has-background-error');
    if (!foreground_loaded && foreground_image) foreground_image.hidden = true;
    if (!background_loaded || !foreground_loaded || !should_animate || scene_complete) { finish_scene(); return; }
    images_ready = true;
    scene_element.dataset.sceneState = 'waiting';
    start_entrance();
  });
  return dispose_scene;
}

function matching_scenes(scene_context) {
  const scene_elements = [...scene_context.querySelectorAll('[data-layered-scene]')];
  if (scene_context.matches?.('[data-layered-scene]')) scene_elements.unshift(scene_context);
  return scene_elements;
}

export function initialize_layered_scenes(scene_context = document) {
  matching_scenes(scene_context).forEach((scene_element) => {
    if (!scene_controllers.has(scene_element)) scene_controllers.set(scene_element, attach_layered_scene(scene_element));
  });
}

export function detach_layered_scenes(scene_context = document) {
  matching_scenes(scene_context).forEach((scene_element) => {
    scene_controllers.get(scene_element)?.();
    scene_controllers.delete(scene_element);
  });
}
