const STACK_INSTANCES = new WeakMap();

function stack_elements(stack_context) {
  return [
    ...(stack_context.matches?.('[data-technology-stack]') ? [stack_context] : []),
    ...stack_context.querySelectorAll('[data-technology-stack]'),
  ];
}

function enable_technology_stack(stack_element) {
  const stack_document = stack_element.ownerDocument;
  const stack_window = stack_document.defaultView;
  const event_controller = new stack_window.AbortController();
  const event_options = { signal: event_controller.signal };
  const reduced_motion = stack_window.matchMedia('(prefers-reduced-motion: reduce)');
  const root_styles = stack_window.getComputedStyle(stack_document.documentElement);
  const motion_duration = Number.parseFloat(root_styles.getPropertyValue('--motion-duration-medium-default')) || 250;
  const viewport_gap = Number.parseFloat(root_styles.getPropertyValue('--space-scale-base-gap')) || 8;
  const highlight_element = stack_document.createElement('span');
  highlight_element.className = 'technology-stack__highlight';
  highlight_element.setAttribute('aria-hidden', 'true');
  let active_tile = null;
  let hovered_panel = null;
  let hide_timer = null;
  let highlight_animation = null;

  function position_panel(technology_tile = active_tile) {
    if (!technology_tile) return;
    const tile_bounds = technology_tile.getBoundingClientRect();
    const panel_element = technology_tile.querySelector('.technology-stack__tooltip');
    const panel_bounds = panel_element.getBoundingClientRect();
    const available_below = stack_window.innerHeight - tile_bounds.bottom;
    technology_tile.dataset.panelPosition = available_below < panel_bounds.height + viewport_gap
      && tile_bounds.top >= panel_bounds.height + viewport_gap ? 'top' : 'bottom';
    const centered_left = tile_bounds.left + (tile_bounds.width - panel_bounds.width) / 2;
    technology_tile.dataset.panelAlign = centered_left < viewport_gap ? 'start'
      : centered_left + panel_bounds.width > stack_window.innerWidth - viewport_gap ? 'end' : 'center';
  }

  function clear_active_tile() {
    stack_window.clearTimeout(hide_timer);
    hovered_panel = null;
    if (active_tile) {
      active_tile.classList.remove('is-active');
      delete active_tile.dataset.touchOpen;
      delete active_tile.dataset.panelDismissed;
    }
    active_tile = null;
    highlight_animation?.cancel();
    highlight_element.remove();
  }

  function activate_tile(technology_tile) {
    stack_window.clearTimeout(hide_timer);
    if (technology_tile === active_tile) return;
    const previous_bounds = highlight_element.isConnected ? highlight_element.getBoundingClientRect() : null;
    clear_active_tile();
    active_tile = technology_tile;
    active_tile.classList.add('is-active');
    active_tile.prepend(highlight_element);
    position_panel();
    if (previous_bounds && !reduced_motion.matches) {
      const target_bounds = active_tile.getBoundingClientRect();
      highlight_animation = highlight_element.animate([
        { transform: `translate(${previous_bounds.left - target_bounds.left}px, ${previous_bounds.top - target_bounds.top}px)` },
        { transform: 'translate(0, 0)' },
      ], { duration: motion_duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' });
    }
  }

  function schedule_deactivation() {
    stack_window.clearTimeout(hide_timer);
    hide_timer = stack_window.setTimeout(() => {
      if (hovered_panel?.matches(':hover')) return;
      if (active_tile?.matches(':hover, :focus-within') || active_tile?.hasAttribute('data-touch-open')) return;
      clear_active_tile();
    }, 150);
  }

  stack_element.dataset.technologyReady = '';
  stack_element.querySelectorAll('.technology-stack__tile').forEach((technology_tile) => {
    const tooltip_panel = technology_tile.querySelector('.technology-stack__tooltip');
    position_panel(technology_tile);
    technology_tile.addEventListener('pointerenter', (pointer_event) => {
      if (hovered_panel?.matches(':hover') && !technology_tile.contains(hovered_panel)) return;
      if (pointer_event.pointerType !== 'touch') activate_tile(technology_tile);
    }, event_options);
    tooltip_panel.addEventListener('pointerenter', (pointer_event) => {
      if (pointer_event.pointerType === 'touch') return;
      activate_tile(technology_tile);
      hovered_panel = tooltip_panel;
      stack_window.clearTimeout(hide_timer);
    }, event_options);
    tooltip_panel.addEventListener('pointerleave', () => {
      if (hovered_panel === tooltip_panel) hovered_panel = null;
      schedule_deactivation();
    }, event_options);
    technology_tile.addEventListener('pointerleave', schedule_deactivation, event_options);
    technology_tile.addEventListener('focusin', () => activate_tile(technology_tile), event_options);
    technology_tile.addEventListener('focusout', schedule_deactivation, event_options);
    technology_tile.addEventListener('pointerdown', (pointer_event) => {
      if (pointer_event.pointerType === 'touch' && !pointer_event.target.closest('.technology-stack__link')) {
        activate_tile(technology_tile);
        delete technology_tile.dataset.panelDismissed;
        technology_tile.dataset.touchOpen = '';
      }
    }, event_options);
  });

  stack_document.addEventListener('keydown', (keyboard_event) => {
    if (keyboard_event.key === 'Escape' && active_tile) {
      hovered_panel = null;
      if (active_tile.contains(stack_document.activeElement)) active_tile.focus({ preventScroll: true });
      active_tile.dataset.panelDismissed = '';
      delete active_tile.dataset.touchOpen;
    }
  }, event_options);
  stack_document.addEventListener('pointerdown', (pointer_event) => {
    if (active_tile && !active_tile.contains(pointer_event.target)) clear_active_tile();
  }, event_options);
  stack_window.addEventListener('resize', () => {
    highlight_animation?.cancel();
    stack_element.querySelectorAll('.technology-stack__tile').forEach(position_panel);
  }, event_options);
  stack_window.addEventListener('scroll', () => position_panel(), { ...event_options, capture: true, passive: true });
  reduced_motion.addEventListener('change', () => highlight_animation?.cancel(), event_options);
  stack_document.fonts?.ready.then(() => {
    if (stack_element.isConnected && !event_controller.signal.aborted) {
      stack_element.querySelectorAll('.technology-stack__tile').forEach(position_panel);
    }
  });

  return () => {
    clear_active_tile();
    event_controller.abort();
    delete stack_element.dataset.technologyReady;
  };
}

export function initialize_technology_stacks(stack_context) {
  stack_elements(stack_context).forEach((stack_element) => {
    if (!STACK_INSTANCES.has(stack_element)) {
      STACK_INSTANCES.set(stack_element, enable_technology_stack(stack_element));
    }
  });
}

export function detach_technology_stacks(stack_context) {
  stack_elements(stack_context).forEach((stack_element) => {
    STACK_INSTANCES.get(stack_element)?.();
    STACK_INSTANCES.delete(stack_element);
  });
}
