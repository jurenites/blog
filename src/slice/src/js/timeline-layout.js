// Map the readable text flow onto a continuous, fixed-scale calendar.
export function interpolate_calendar_offset(scroll_anchors, text_offset) {
  if (!scroll_anchors.length) return 0;
  if (text_offset <= scroll_anchors[0].text_offset) return scroll_anchors[0].rail_offset;
  for (let anchor_index = 1; anchor_index < scroll_anchors.length; anchor_index += 1) {
    const previous_anchor = scroll_anchors[anchor_index - 1];
    const next_anchor = scroll_anchors[anchor_index];
    if (text_offset <= next_anchor.text_offset) {
      const section_fraction = (text_offset - previous_anchor.text_offset)
        / Math.max(1, next_anchor.text_offset - previous_anchor.text_offset);
      return previous_anchor.rail_offset
        + section_fraction * (next_anchor.rail_offset - previous_anchor.rail_offset);
    }
  }
  return scroll_anchors.at(-1).rail_offset;
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
  layout_container.append(rail_window, details_column);
  years_container.append(layout_container);
  timeline_element.classList.add('timeline--synchronized');

  const listener_controller = new AbortController();
  const event_options = { signal: listener_controller.signal };
  let scroll_anchors = [];
  let animation_frame = 0;
  let hovered_key = '';
  let focused_key = '';
  const project_elements = [...timeline_element.querySelectorAll('[data-project-key]')];
  const synchronize_calendar = () => {
    animation_frame = 0;
    const reading_line = rail_window.clientHeight * 0.35;
    const text_offset = rail_window.getBoundingClientRect().top + reading_line
      - details_column.getBoundingClientRect().top;
    rail_window.scrollTop = Math.max(0, interpolate_calendar_offset(scroll_anchors, text_offset) - reading_line);
    // The company rail uses the calendar's transformed positions too.
    timeline_element.dispatchEvent(new timeline_window.Event('timeline:calendar-scroll'));
  };
  const schedule_synchronization = () => {
    if (!animation_frame) animation_frame = timeline_window.requestAnimationFrame(synchronize_calendar);
  };
  const measure_calendar = () => {
    const text_top = details_column.getBoundingClientRect().top;
    const rail_top = calendar_rail.getBoundingClientRect().top;
    scroll_anchors = [];
    detail_groups.forEach(({ year_group, details_group, month_count }) => {
      const year_top = year_group.getBoundingClientRect().top - rail_top;
      const month_height = year_group.getBoundingClientRect().height / month_count;
      scroll_anchors.push({
        text_offset: details_group.getBoundingClientRect().top - text_top,
        rail_offset: year_top,
      });
      details_group.querySelectorAll('[data-start-month]').forEach((detail_card) => {
        scroll_anchors.push({
          text_offset: detail_card.getBoundingClientRect().top - text_top,
          rail_offset: year_top + (month_count - Number(detail_card.dataset.startMonth)) * month_height,
        });
      });
    });
    scroll_anchors.push({ text_offset: details_column.offsetHeight, rail_offset: calendar_rail.offsetHeight });
    scroll_anchors.sort((first_anchor, second_anchor) => first_anchor.text_offset - second_anchor.text_offset);
    // Concurrent projects can share a month; the calendar must never run backward.
    scroll_anchors.forEach((current_anchor, anchor_index) => {
      if (anchor_index) current_anchor.rail_offset = Math.max(current_anchor.rail_offset, scroll_anchors[anchor_index - 1].rail_offset);
    });
    schedule_synchronization();
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
          && candidate_element.dataset.periodKey === project_element.dataset.periodKey);
        matching_card?.focus({ preventScroll: true });
        matching_card?.scrollIntoView({ block: 'center', behavior: 'instant' });
      }, event_options);
    }
  });
  timeline_window.addEventListener('scroll', schedule_synchronization, { ...event_options, passive: true });
  timeline_window.addEventListener('resize', measure_calendar, event_options);
  const resize_observer = new timeline_window.ResizeObserver(measure_calendar);
  resize_observer.observe(details_column);
  resize_observer.observe(rail_window);
  timeline_document.fonts?.ready.then(() => {
    if (!listener_controller.signal.aborted) measure_calendar();
  });
  measure_calendar();
  timeline_element.jurenites_timeline_layout_destroy = () => {
    listener_controller.abort();
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
