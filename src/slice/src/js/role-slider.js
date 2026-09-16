export function initialize_role_sliders(page_context = document) {
  const slider_elements = [...page_context.querySelectorAll('[data-role-slider]')];
  if (page_context.matches?.('[data-role-slider]')) slider_elements.unshift(page_context);
  slider_elements.forEach((slider_element) => {
    if (slider_element.dataset.roleReady) return;
    const tab_buttons = [...slider_element.querySelectorAll('.role-slider__tab')];
    const story_panels = [...slider_element.querySelectorAll('.role-slider__panel')];
    if (!tab_buttons.length || tab_buttons.length !== story_panels.length) return;
    const tile_track = slider_element.querySelector('.role-slider__tiles');
    const reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let selected_index = 0;
    tile_track.setAttribute('role', 'tablist');
    tab_buttons.forEach((tab_button, tab_index) => {
      tab_button.setAttribute('role', 'tab');
      const tile_element = tab_button.closest('.role-slider__tile');
      tile_element.setAttribute('role', 'presentation');
      story_panels[tab_index].setAttribute('role', 'tabpanel');
      story_panels[tab_index].tabIndex = 0;
      tile_element.addEventListener('click', (click_event) => {
        if (click_event.target.closest('a')) return;
        select_role(tab_index, true);
      });
      tab_button.addEventListener('keydown', (key_event) => {
        const key_steps = { ArrowLeft: -1, ArrowRight: 1, Home: -selected_index, End: tab_buttons.length - selected_index - 1 };
        if (!(key_event.key in key_steps)) return;
        key_event.preventDefault();
        select_role((selected_index + key_steps[key_event.key] + tab_buttons.length) % tab_buttons.length, true);
      });
    });
    function select_role(next_index, focus_tab = false, animate_panel = true) {
      const slide_direction = next_index >= selected_index ? 1 : -1;
      selected_index = next_index;
      tab_buttons.forEach((tab_button, tab_index) => {
        const is_active = tab_index === selected_index;
        tab_button.setAttribute('aria-selected', String(is_active));
        tab_button.tabIndex = is_active ? 0 : -1;
        tab_button.closest('.role-slider__tile').classList.toggle('is-active', is_active);
        story_panels[tab_index].classList.toggle('is-active', is_active);
        story_panels[tab_index].setAttribute('aria-hidden', String(!is_active));
        story_panels[tab_index].inert = !is_active;
      });
      if (focus_tab) tab_buttons[selected_index].focus({ preventScroll: true });
      const selected_tile = tab_buttons[selected_index].closest('.role-slider__tile');
      const tile_bounds = selected_tile.getBoundingClientRect();
      const track_bounds = tile_track.getBoundingClientRect();
      if (tile_bounds.left < track_bounds.left || tile_bounds.right > track_bounds.right) {
        tile_track.scrollBy({ left: tile_bounds.left - track_bounds.left, behavior: reduced_motion.matches ? 'instant' : 'smooth' });
      }
      if (animate_panel && !reduced_motion.matches) {
        const grid_gap = parseFloat(getComputedStyle(slider_element).getPropertyValue('--space-scale-base-gap')) || 8;
        story_panels[selected_index].getAnimations().forEach((panel_animation) => panel_animation.cancel());
        story_panels[selected_index].animate([
          { transform: `translateX(${slide_direction * grid_gap * 3}px)` }, { transform: 'translateX(0)' },
        ], { duration: 240, easing: 'ease-out' });
      }
    }
    slider_element.dataset.roleReady = 'true';
    select_role(0, false, false);
  });
}
