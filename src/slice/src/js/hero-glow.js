/** Continuous screen color and drifting light density; no cursor movement needed. */
export function initialize_hero_glow(hero_section) {
  if (!hero_section.matches('.hero-section--glow')) return;
  const color_element = hero_section.querySelector('.hero-section__light-color');
  if (!color_element?.animate) return;
  const beam_elements = [...hero_section.querySelectorAll('.hero-section__beam')];
  const toggle_button = hero_section.querySelector('.hero-section__light-toggle');
  if (!toggle_button) return;
  const owner_document = hero_section.ownerDocument;
  const browser_window = owner_document.defaultView;
  const motion_preference = browser_window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover_preference = browser_window.matchMedia('(hover: hover) and (pointer: fine)');
  const color_duration = Number.parseFloat(browser_window.getComputedStyle(color_element).getPropertyValue('--component-hero-section-ray-color-duration-default'));
  if (!Number.isFinite(color_duration) || color_duration <= 0) return;

  let pointer_inside = hero_section.matches(':hover');
  let touch_enabled = false;
  let scene_visible = true;
  let light_animations = [];
  let scene_observer;
  const event_controller = new AbortController();
  const event_options = { signal: event_controller.signal };
  const create_animations = () => {
    light_animations = [color_element.animate([
      { filter: 'hue-rotate(0deg)' }, { filter: 'hue-rotate(75deg)' },
      { filter: 'hue-rotate(170deg)' }, { filter: 'hue-rotate(255deg)' },
      { filter: 'hue-rotate(360deg)' },
    ], { duration: color_duration * 8, iterations: Infinity, easing: 'linear' })];
    beam_elements.forEach((beam_element, beam_index) => {
      const drift_direction = beam_index === 0 ? 1 : -1;
      light_animations.push(beam_element.animate([
        { transform: `translate(${-drift_direction * 1.5}%, 1%) rotate(-0.7deg) scale(1.04)`, opacity: 0.3 },
        { transform: `translate(${drift_direction * 1.8}%, -1.4%) rotate(0.9deg) scale(1.08)`, opacity: 0.8 },
        { transform: `translate(${-drift_direction * 1.5}%, 1%) rotate(-0.7deg) scale(1.04)`, opacity: 0.3 },
      ], { duration: color_duration * (beam_index === 0 ? 2.8 : 3.9), iterations: Infinity, easing: 'ease-in-out' }));
    });
  };
  const dispose_light = () => {
    light_animations.forEach((light_animation) => light_animation.cancel());
    event_controller.abort();
    scene_observer?.disconnect();
  };
  const update_playback = () => {
    if (!hero_section.isConnected) { dispose_light(); return; }
    const focus_active = hero_section.matches(':focus-within') && owner_document.activeElement !== toggle_button;
    const is_active = touch_enabled || (pointer_inside && hover_preference.matches) || focus_active;
    hero_section.classList.toggle('hero-section--light-active', is_active);
    if (motion_preference.matches) {
      light_animations.forEach((light_animation) => light_animation.cancel());
      light_animations = [];
      return;
    }
    if (is_active && scene_visible && !owner_document.hidden) {
      if (!light_animations.length) create_animations();
      else light_animations.forEach((light_animation) => light_animation.play());
    } else {
      light_animations.forEach((light_animation) => light_animation.pause());
    }
  };
  hero_section.addEventListener('pointerenter', () => { pointer_inside = true; update_playback(); }, event_options);
  hero_section.addEventListener('pointerleave', () => { pointer_inside = false; update_playback(); }, event_options);
  hero_section.addEventListener('focusin', update_playback, event_options);
  hero_section.addEventListener('focusout', () => queueMicrotask(update_playback), event_options);
  toggle_button.hidden = false;
  toggle_button.addEventListener('click', () => {
    touch_enabled = !touch_enabled;
    toggle_button.setAttribute('aria-pressed', String(touch_enabled));
    update_playback();
  }, event_options);
  if (browser_window.IntersectionObserver) {
    scene_observer = new browser_window.IntersectionObserver((scene_entries) => {
      scene_visible = scene_entries.some((scene_entry) => scene_entry.isIntersecting);
      update_playback();
    });
    scene_observer.observe(hero_section.querySelector('.hero-section__photo-plane'));
  }
  motion_preference.addEventListener('change', update_playback, event_options);
  hover_preference.addEventListener('change', update_playback, event_options);
  owner_document.addEventListener('visibilitychange', update_playback, event_options);
  update_playback();
  return dispose_light;
}
