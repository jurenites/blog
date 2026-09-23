// The page owns calendar travel; the description viewport follows its date anchors.
function interpolate_scroll_offset(scroll_anchors, source_offset, source_key, target_key) {
  if (!scroll_anchors.length) return 0;
  if (source_offset <= scroll_anchors[0][source_key]) return scroll_anchors[0][target_key];
  for (let anchor_index = 1; anchor_index < scroll_anchors.length; anchor_index += 1) {
    const previous_anchor = scroll_anchors[anchor_index - 1];
    const next_anchor = scroll_anchors[anchor_index];
    if (source_offset <= next_anchor[source_key]) {
      const section_fraction = (source_offset - previous_anchor[source_key])
        / (next_anchor[source_key] - previous_anchor[source_key]);
      return previous_anchor[target_key]
        + section_fraction * (next_anchor[target_key] - previous_anchor[target_key]);
    }
  }
  return scroll_anchors.at(-1)[target_key];
}

export function interpolate_calendar_offset(scroll_anchors, text_offset) {
  return interpolate_scroll_offset(scroll_anchors, text_offset, 'text_offset', 'rail_offset');
}

export function interpolate_project_offset(scroll_anchors, rail_offset) {
  return interpolate_scroll_offset(scroll_anchors, rail_offset, 'rail_offset', 'text_offset');
}

export function create_scroll_anchors(date_anchors, rail_height, text_height, window_height) {
  const maximum_rail = Math.max(0, rail_height - window_height);
  const maximum_text = Math.max(0, text_height - window_height);
  const reading_line = window_height * 0.35;
  const scroll_anchors = [{ rail_offset: 0, text_offset: 0 }];
  date_anchors.forEach((date_anchor) => {
    const rail_offset = date_anchor.rail_offset - reading_line;
    const text_offset = date_anchor.text_offset - reading_line;
    const previous_anchor = scroll_anchors.at(-1);
    // Concurrent projects share one date anchor and travel through the interval
    // before the next date. Never introduce a jump or reverse the project column.
    if (rail_offset > previous_anchor.rail_offset && rail_offset < maximum_rail
      && text_offset > previous_anchor.text_offset && text_offset < maximum_text) {
      scroll_anchors.push({ rail_offset, text_offset });
    }
  });
  if (maximum_rail > 0) {
    scroll_anchors.push({ rail_offset: maximum_rail, text_offset: maximum_text });
  }
  return scroll_anchors;
}

export function initialize_timeline_layout(timeline_element) {
  if (timeline_element.jurenites_timeline_layout_destroy) return;
  const timeline_document = timeline_element.ownerDocument;
  const timeline_window = timeline_document.defaultView;
  const years_container = timeline_element.querySelector('.timeline__years');
  const year_groups = [...timeline_element.querySelectorAll('.timeline__year-group')];
  if (!years_container || !year_groups.length) return;
  const create_container = (class_name) => {
    const container_element = timeline_document.createElement('div');
    container_element.className = class_name;
    return container_element;
  };
  const layout_container = create_container('timeline__synchronized-layout');
  const rail_window = create_container('timeline__rail-window');
  const calendar_rail = create_container('timeline__calendar-rail');
  const details_window = create_container('timeline__details-window');
  const details_column = create_container('timeline__details-column');
  const detail_groups = year_groups.map((year_group) => {
    const details_list = year_group.querySelector('.timeline__year-details');
    const original_parent = details_list?.parentElement;
    const month_count = year_group.querySelectorAll('.timeline__month').length;
    const details_group = create_container('timeline__detail-group timeline__detail-group--months-' + month_count);
    const first_card = details_list?.querySelector('[data-start-month]');
    if (first_card) {
      details_group.classList.add('timeline__detail-group--leading-months-'
        + Math.max(0, month_count - Number(first_card.dataset.startMonth)));
    }
    if (details_list) details_group.append(details_list);
    details_column.append(details_group);
    calendar_rail.append(year_group);
    return { year_group, details_group, details_list, original_parent, month_count };
  });
  rail_window.append(calendar_rail);
  details_window.append(details_column);
  layout_container.append(rail_window, details_window);
  years_container.append(layout_container);
  timeline_element.classList.add('timeline--synchronized');

  const listener_controller = new AbortController();
  const event_options = { signal: listener_controller.signal };
  let scroll_anchors = [];
  let animation_frame = 0;
  let navigation_frame = 0;
  let hovered_key = '';
  let focused_key = '';
  const reduced_motion = timeline_window.matchMedia('(prefers-reduced-motion: reduce)');
  const cancel_navigation = () => {
    timeline_window.cancelAnimationFrame(navigation_frame);
    navigation_frame = 0;
  };
  const reveal_project_card = (project_card, immediate_scroll = false, focus_target = project_card) => {
    cancel_navigation();
    focus_target.focus({ preventScroll: true });
    const starting_offset = timeline_window.scrollY;
    const scroll_margin = Number.parseFloat(timeline_window.getComputedStyle(project_card).scrollMarginTop) || 0;
    const maximum_offset = Math.max(0, timeline_document.documentElement.scrollHeight - timeline_window.innerHeight);
    const sticky_offset = Number.parseFloat(timeline_window.getComputedStyle(details_window).top) || 0;
    const text_offset = project_card.getBoundingClientRect().top - details_column.getBoundingClientRect().top
      - Math.max(0, scroll_margin - sticky_offset);
    const target_offset = Math.max(0, Math.min(maximum_offset,
      starting_offset + layout_container.getBoundingClientRect().top - sticky_offset
      + interpolate_calendar_offset(scroll_anchors, text_offset)));
    const scroll_distance = target_offset - starting_offset;
    if (immediate_scroll || reduced_motion.matches || Math.abs(scroll_distance) < 1) {
      timeline_window.scrollTo({ top: target_offset, behavior: 'instant' });
      synchronize_calendar();
      return;
    }
    // Longer journeys get more time; smoothstep eases both departure and arrival.
    const scroll_duration = Math.min(1600, 900 + Math.abs(scroll_distance) * 0.25);
    const starting_time = timeline_window.performance.now();
    const advance_navigation = (current_time) => {
      const elapsed_fraction = Math.min(1, (current_time - starting_time) / scroll_duration);
      const eased_fraction = elapsed_fraction * elapsed_fraction * (3 - 2 * elapsed_fraction);
      timeline_window.scrollTo({ top: starting_offset + scroll_distance * eased_fraction, behavior: 'instant' });
      navigation_frame = elapsed_fraction < 1
        ? timeline_window.requestAnimationFrame(advance_navigation) : 0;
    };
    navigation_frame = timeline_window.requestAnimationFrame(advance_navigation);
  };
  ['wheel', 'touchstart', 'pointerdown'].forEach((event_name) => {
    timeline_window.addEventListener(event_name, cancel_navigation, { ...event_options, passive: true });
  });
  timeline_window.addEventListener('keydown', (keyboard_event) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(keyboard_event.key)) {
      cancel_navigation();
    }
  }, event_options);
  reduced_motion.addEventListener('change', cancel_navigation, event_options);
  const project_elements = [...timeline_element.querySelectorAll('[data-project-key]')];
  const synchronize_calendar = () => {
    animation_frame = 0;
    const sticky_offset = Number.parseFloat(timeline_window.getComputedStyle(details_window).top) || 0;
    const rail_offset = sticky_offset - layout_container.getBoundingClientRect().top;
    details_window.scrollTop = interpolate_project_offset(scroll_anchors, rail_offset);
    timeline_element.dispatchEvent(new timeline_window.Event('timeline:calendar-scroll'));
  };
  const schedule_synchronization = () => {
    if (!animation_frame) animation_frame = timeline_window.requestAnimationFrame(synchronize_calendar);
  };
  const measure_calendar = () => {
    const text_top = details_column.getBoundingClientRect().top;
    const rail_top = calendar_rail.getBoundingClientRect().top;
    const date_anchors = [];
    detail_groups.forEach(({ year_group, details_group, month_count }) => {
      const year_top = year_group.getBoundingClientRect().top - rail_top;
      const month_height = year_group.getBoundingClientRect().height / month_count;
      date_anchors.push({
        text_offset: details_group.getBoundingClientRect().top - text_top,
        rail_offset: year_top,
      });
      details_group.querySelectorAll('[data-start-month]').forEach((detail_card) => {
        date_anchors.push({
          text_offset: detail_card.getBoundingClientRect().top - text_top,
          rail_offset: year_top + (month_count - Number(detail_card.dataset.startMonth)) * month_height,
        });
      });
    });
    scroll_anchors = create_scroll_anchors(date_anchors, calendar_rail.offsetHeight,
      details_column.offsetHeight, details_window.clientHeight);
    synchronize_calendar();
  };
  const highlight_projects = () => {
    project_elements.forEach((project_element) => {
      project_element.classList.toggle('is-project-highlighted',
        project_element.dataset.projectKey === (hovered_key || focused_key));
    });
  };
  project_elements.forEach((project_element) => {
    project_element.addEventListener('pointerenter', () => {
      hovered_key = project_element.dataset.projectKey;
      highlight_projects();
    }, event_options);
    project_element.addEventListener('pointerleave', () => {
      hovered_key = '';
      highlight_projects();
    }, event_options);
    project_element.addEventListener('focusin', () => {
      focused_key = project_element.dataset.projectKey;
      highlight_projects();
    }, event_options);
    project_element.addEventListener('focusout', (focus_event) => {
      if (!project_element.contains(focus_event.relatedTarget)) focused_key = '';
      highlight_projects();
    }, event_options);
    if (project_element.matches('.timeline__marker')) {
      project_element.addEventListener('click', () => {
        const matching_card = project_elements.find((candidate_element) =>
          candidate_element.matches('.timeline__year-detail')
          && candidate_element.dataset.projectKey === project_element.dataset.projectKey);
        if (matching_card) reveal_project_card(matching_card);
      }, event_options);
    }
  });
  // The enhanced layout moves detail cards. Resolve deep links after that move
  // and again once fonts settle so the requested project remains in view.
  const reveal_linked_project = () => {
    const fragment_value = timeline_window.location.hash.slice(1);
    if (!fragment_value) return;
    let fragment_id;
    try { fragment_id = decodeURIComponent(fragment_value); } catch { return; }
    const target_card = timeline_document.getElementById(fragment_id);
    if (!target_card || !timeline_element.contains(target_card) || !target_card.matches('.timeline__year-detail')) return;
    reveal_project_card(target_card, true);
  };
  // Tabbing to a clipped link must also move the calendar to its project.
  details_window.addEventListener('focusin', (focus_event) => {
    const focus_target = focus_event.target;
    const project_card = focus_target.closest('.timeline__year-detail');
    if (!project_card || focus_target === project_card) return;
    const target_bounds = focus_target.getBoundingClientRect();
    const window_bounds = details_window.getBoundingClientRect();
    const sticky_offset = Number.parseFloat(timeline_window.getComputedStyle(details_window).top) || 0;
    const expected_offset = interpolate_project_offset(scroll_anchors,
      sticky_offset - layout_container.getBoundingClientRect().top);
    // Native focus may scroll the hidden viewport before focusin fires. Move the
    // page to match it, otherwise the next scroll would hide the focused link.
    if (Math.abs(details_window.scrollTop - expected_offset) > 1
      || target_bounds.top < window_bounds.top || target_bounds.bottom > window_bounds.bottom) {
      reveal_project_card(focus_target, true, focus_target);
    }
  }, event_options);
  timeline_window.addEventListener('hashchange', reveal_linked_project, event_options);
  timeline_window.addEventListener('scroll', schedule_synchronization, { ...event_options, passive: true });
  timeline_window.addEventListener('resize', measure_calendar, event_options);
  const resize_observer = new timeline_window.ResizeObserver(measure_calendar);
  resize_observer.observe(details_column);
  resize_observer.observe(details_window);
  resize_observer.observe(calendar_rail);
  timeline_document.fonts?.ready.then(() => {
    if (!listener_controller.signal.aborted) {
      measure_calendar();
      reveal_linked_project();
    }
  });
  measure_calendar();
  reveal_linked_project();
  timeline_element.jurenites_timeline_layout_destroy = () => {
    listener_controller.abort();
    cancel_navigation();
    resize_observer.disconnect();
    timeline_window.cancelAnimationFrame(animation_frame);
    detail_groups.forEach(({ year_group, details_list, original_parent }) => {
      if (details_list) original_parent.append(details_list);
      years_container.append(year_group);
    });
    layout_container.remove();
    project_elements.forEach((project_element) => project_element.classList.remove('is-project-highlighted'));
    timeline_element.classList.remove('timeline--synchronized');
    delete timeline_element.jurenites_timeline_layout_destroy;
  };
}
