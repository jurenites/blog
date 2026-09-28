// Shared by the entry-page intro and its isolated Storybook preview.
export function reveal_loading_name(branding_element, reveal_options = {}) {
  const owner_window = branding_element.ownerDocument.defaultView;
  const reduced_motion = owner_window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced_motion.matches) return () => {};
  const computed_styles = owner_window.getComputedStyle(branding_element);
  const read_duration = (token_name) => {
    const token_value = computed_styles.getPropertyValue(token_name).trim();
    return parseFloat(token_value) * (token_value.endsWith('ms') ? 1 : 1000);
  };
  const letter_elements = [...branding_element.querySelectorAll('.site-header__brand-name-initial, .site-header__brand-name-letter')];
  const total_duration = reveal_options.total_duration ?? read_duration('--component-site-header-brand-name-hold-duration-default');
  const character_duration = reveal_options.character_duration ?? read_duration('--component-site-header-brand-name-reveal-duration-default');
  const character_stagger = reveal_options.character_stagger ?? read_duration('--component-site-header-brand-name-reveal-stagger-default');
  const blur_radius = reveal_options.blur_radius ?? parseFloat(computed_styles.getPropertyValue('--component-site-header-backdrop-blur-default'));
  // Finish typing before the existing movement and collapse, even for long names.
  const reveal_scale = Math.min(1, total_duration * 0.4 / Math.max(1, character_duration + Math.max(0, letter_elements.length - 1) * character_stagger));
  const letter_animations = letter_elements.map((letter_element, letter_index) => letter_element.animate([
    { filter: `blur(${blur_radius}px)`, opacity: 0 },
    { filter: 'blur(0px)', opacity: 1 },
  ], {
    duration: character_duration * reveal_scale,
    delay: letter_index * character_stagger * reveal_scale,
    easing: 'ease-out',
    fill: 'backwards',
  }));
  const cancel_reveal = () => {
    letter_animations.forEach((letter_animation) => letter_animation.cancel());
    reduced_motion.removeEventListener('change', cancel_reveal);
  };
  reduced_motion.addEventListener('change', cancel_reveal);
  Promise.all(letter_animations.map((letter_animation) => letter_animation.finished)).then(cancel_reveal, cancel_reveal);
  return cancel_reveal;
}
