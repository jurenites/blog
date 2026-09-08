import { initialize_timeline_layout } from './timeline-layout.js';

export function find_active_organization_index(transition_offsets, activation_offset) {
  let active_transition_index = 0;
  transition_offsets.forEach((transition_offset, transition_index) => {
    if (transition_offset <= activation_offset) {
      active_transition_index = transition_index;
    }
  });
  return active_transition_index;
}

function create_organization_element(timeline_document, organization_name, organization_url) {
  const organization_element = timeline_document.createElement(
    organization_url ? 'a' : 'span',
  );
  organization_element.className = organization_url
    ? 'timeline__organization-link'
    : 'timeline__organization-heading';
  organization_element.textContent = organization_name;
  if (organization_url) {
    organization_element.href = organization_url;
  }
  return organization_element;
}

function replace_sticky_organization(
  sticky_container,
  organization_transition,
  movement_direction,
) {
  const timeline_document = sticky_container.ownerDocument;
  const timeline_window = timeline_document.defaultView;
  const current_element = sticky_container.lastElementChild;
  const organization_name = organization_transition.dataset.organizationName ?? '';
  const organization_url = organization_transition.dataset.organizationUrl ?? '';
  if (!current_element || (current_element.textContent === organization_name
    && (current_element.getAttribute('href') ?? '') === organization_url)) {
    return;
  }

  const incoming_element = create_organization_element(
    timeline_document,
    organization_name,
    organization_url,
  );
  const reduce_motion_query = timeline_window.matchMedia('(prefers-reduced-motion: reduce)');
  sticky_container.querySelectorAll('.timeline__organization-link--outgoing')
    .forEach((outgoing_element) => outgoing_element.remove());

  if (reduce_motion_query.matches || !current_element.animate || !incoming_element.animate) {
    sticky_container.replaceChildren(incoming_element);
    return;
  }

  const root_style = timeline_window.getComputedStyle(timeline_document.documentElement);
  const transition_duration = Number.parseFloat(
    root_style.getPropertyValue('--motion-duration-short-default'),
  );
  current_element.classList.add('timeline__organization-link--outgoing');
  sticky_container.append(incoming_element);
  const outgoing_distance = movement_direction * 100;
  const incoming_distance = movement_direction * -100;
  const animation_options = {
    duration: Number.isFinite(transition_duration) ? transition_duration : 0,
    easing: 'ease-out',
    fill: 'forwards',
  };
  const outgoing_animation = current_element.animate([
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: `translateY(${outgoing_distance}%)` },
  ], animation_options);
  incoming_element.animate([
    { opacity: 0, transform: `translateY(${incoming_distance}%)` },
    { opacity: 1, transform: 'translateY(0)' },
  ], animation_options);
  outgoing_animation.finished.then(
    () => current_element.remove(),
    () => current_element.remove(),
  );
}

export function initialize_timeline_organization_rail(timeline_element) {
  if (timeline_element.jurenites_timeline_organization_initialized) {
    return;
  }
  const sticky_container = timeline_element.querySelector(
    '[data-jurenites-timeline-organization-sticky]',
  );
  const organization_transitions = Array.from(
    timeline_element.querySelectorAll('.timeline__organization-transition'),
  );
  if (!sticky_container || organization_transitions.length === 0) {
    return;
  }

  timeline_element.jurenites_timeline_organization_initialized = true;
  const timeline_window = timeline_element.ownerDocument.defaultView;
  const listener_controller = new AbortController();
  let active_transition_index = 0;
  let update_animation_frame = 0;

  function update_sticky_organization() {
    update_animation_frame = 0;
    const activation_offset = sticky_container.getBoundingClientRect().bottom;
    const transition_offsets = organization_transitions.map(
      (organization_transition) => organization_transition.getBoundingClientRect().top,
    );
    const next_transition_index = find_active_organization_index(
      transition_offsets,
      activation_offset,
    );
    if (next_transition_index === active_transition_index) {
      return;
    }
    const movement_direction = next_transition_index > active_transition_index ? -1 : 1;
    active_transition_index = next_transition_index;
    replace_sticky_organization(
      sticky_container,
      organization_transitions[active_transition_index],
      movement_direction,
    );
  }

  function schedule_sticky_update() {
    if (!update_animation_frame) {
      update_animation_frame = timeline_window.requestAnimationFrame(update_sticky_organization);
    }
  }

  timeline_window.addEventListener('scroll', schedule_sticky_update, {
    passive: true,
    signal: listener_controller.signal,
  });
  timeline_window.addEventListener('resize', schedule_sticky_update, {
    passive: true,
    signal: listener_controller.signal,
  });
  timeline_element.addEventListener('timeline:calendar-scroll', schedule_sticky_update, {
    signal: listener_controller.signal,
  });
  timeline_element.jurenites_timeline_organization_destroy = () => {
    listener_controller.abort();
    timeline_window.cancelAnimationFrame(update_animation_frame);
    delete timeline_element.jurenites_timeline_organization_initialized;
    delete timeline_element.jurenites_timeline_organization_destroy;
  };
  update_sticky_organization();
}

export function initialize_timeline_organization_rails(timeline_context = document) {
  const timeline_elements = Array.from(timeline_context.querySelectorAll('.timeline'));
  if (timeline_context.matches?.('.timeline')) {
    timeline_elements.unshift(timeline_context);
  }
  timeline_elements.forEach((timeline_element) => {
    initialize_timeline_layout(timeline_element);
    initialize_timeline_organization_rail(timeline_element);
  });
}

export function detach_timeline_organization_rails(timeline_context = document) {
  const timeline_elements = Array.from(timeline_context.querySelectorAll('.timeline'));
  if (timeline_context.matches?.('.timeline')) {
    timeline_elements.unshift(timeline_context);
  }
  timeline_elements.forEach((timeline_element) => {
    timeline_element.jurenites_timeline_organization_destroy?.();
    timeline_element.jurenites_timeline_layout_destroy?.();
  });
}
