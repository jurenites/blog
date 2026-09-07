/** Slowly vary screen light while the photograph is being interacted with. */
export function initialize_hero_glow(hero_section) {
  if (!hero_section.matches('.hero-section--glow')) return;
  const ray_element = hero_section.querySelector('.hero-section__rays');
  if (!ray_element?.animate) return;

  const owner_document = hero_section.ownerDocument;
  const browser_window = owner_document.defaultView;
  const motion_preference = browser_window.matchMedia('(prefers-reduced-motion: reduce)');
  const hover_preference = browser_window.matchMedia('(hover: hover) and (pointer: fine)');
  const ray_styles = browser_window.getComputedStyle(ray_element);
  const ray_softness = ray_styles.getPropertyValue('--component-hero-section-ray-softness-default').trim();
  const color_duration = Number.parseFloat(ray_styles.getPropertyValue('--component-hero-section-ray-color-duration-default'));
  if (!ray_softness || !Number.isFinite(color_duration) || color_duration <= 0) return;

  let pointer_inside = hero_section.matches(':hover');
  let current_hue = 0;
  let color_animation;
  const event_controller = new AbortController();
  const event_options = { signal: event_controller.signal };

  const animate_color = () => {
    if (!hero_section.isConnected) {
      color_animation?.cancel();
      event_controller.abort();
      return;
    }
    // Limit each hue journey to avoid spinning through an entire rainbow.
    const next_hue = current_hue + (Math.random() < 0.5 ? -1 : 1) * (40 + Math.random() * 100);
    const next_animation = ray_element.animate([
      { filter: `blur(${ray_softness}) hue-rotate(${current_hue}deg)` },
      { filter: `blur(${ray_softness}) hue-rotate(${next_hue}deg)` },
    ], {
      duration: color_duration * (0.8 + Math.random() * 0.6),
      easing: 'ease-in-out',
      fill: 'forwards',
    });
    color_animation?.cancel();
    color_animation = next_animation;
    current_hue = next_hue;
    color_animation.onfinish = animate_color;
  };

  const update_playback = () => {
    if (motion_preference.matches) {
      color_animation?.cancel();
      color_animation = undefined;
      current_hue = 0;
      return;
    }
    const is_active = (pointer_inside && hover_preference.matches) || hero_section.matches(':focus-within');
    if (is_active && !owner_document.hidden) {
      if (!color_animation) animate_color();
      else if (color_animation.playState === 'finished') animate_color();
      else color_animation.play();
    } else {
      color_animation?.pause();
    }
  };

  hero_section.addEventListener('pointerenter', () => { pointer_inside = true; update_playback(); }, event_options);
  hero_section.addEventListener('pointerleave', () => { pointer_inside = false; update_playback(); }, event_options);
  hero_section.addEventListener('focusin', update_playback, event_options);
  hero_section.addEventListener('focusout', () => queueMicrotask(update_playback), event_options);
  motion_preference.addEventListener('change', update_playback, event_options);
  hover_preference.addEventListener('change', update_playback, event_options);
  owner_document.addEventListener('visibilitychange', update_playback, event_options);
  update_playback();
}
