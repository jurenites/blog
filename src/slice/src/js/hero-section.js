import { initialize_hero_glow } from './hero-glow.js';

let hero_instance_count = 0;

/** Enhance authored slides without hiding content when JavaScript is unavailable. */
export function initialize_hero_sections(hero_context = document) {
  const hero_sections = [...hero_context.querySelectorAll('[data-hero-section]')];
  if (hero_context.matches?.('[data-hero-section]')) hero_sections.unshift(hero_context);

  hero_sections.forEach((hero_section) => {
    if (hero_section.dataset.heroInitialized) return;
    const slide_panels = [...hero_section.querySelectorAll('[data-hero-panel]')];
    const slide_buttons = [...hero_section.querySelectorAll('[data-hero-select]')];
    const slide_navigation = hero_section.querySelector('[data-hero-navigation]');
    if (!slide_navigation || !slide_panels.length || slide_panels.length !== slide_buttons.length) return;

    hero_section.dataset.heroInitialized = 'true';
    initialize_hero_glow(hero_section);
    hero_instance_count += 1;
    const instance_prefix = `hero-section-${hero_instance_count}`;
    let active_index = 0;

    const select_slide = (slide_index, move_focus = false) => {
      active_index = (slide_index + slide_panels.length) % slide_panels.length;
      slide_panels.forEach((slide_panel, panel_index) => {
        slide_panel.hidden = panel_index !== active_index;
      });
      slide_buttons.forEach((slide_button, button_index) => {
        const is_selected = button_index === active_index;
        slide_button.setAttribute('aria-selected', String(is_selected));
        slide_button.tabIndex = is_selected ? 0 : -1;
      });
      if (move_focus) slide_buttons[active_index].focus();
    };

    slide_navigation.setAttribute('role', 'tablist');
    slide_panels.forEach((slide_panel, panel_index) => {
      const slide_button = slide_buttons[panel_index];
      slide_panel.id = `${instance_prefix}-panel-${panel_index}`;
      slide_button.id = `${instance_prefix}-tab-${panel_index}`;
      slide_panel.setAttribute('role', 'tabpanel');
      slide_panel.setAttribute('aria-labelledby', slide_button.id);
      slide_panel.tabIndex = 0;
      slide_button.setAttribute('role', 'tab');
      slide_button.setAttribute('aria-controls', slide_panel.id);
      slide_button.addEventListener('click', () => select_slide(panel_index));
      slide_button.addEventListener('keydown', (keyboard_event) => {
        const direction_step = getComputedStyle(slide_navigation).direction === 'rtl' ? -1 : 1;
        const key_destinations = {
          ArrowRight: active_index + direction_step,
          ArrowLeft: active_index - direction_step,
          Home: 0,
          End: slide_panels.length - 1,
        };
        if (!(keyboard_event.key in key_destinations)) return;
        keyboard_event.preventDefault();
        select_slide(key_destinations[keyboard_event.key], true);
      });
    });
    select_slide(0);
    slide_navigation.hidden = slide_panels.length < 2;
  });
}
