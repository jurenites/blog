const HEADING_SELECTOR = 'h1';
const EXCLUDED_CONTEXT = 'nav, footer, dialog, [role="dialog"], [contenteditable], .ck, .studio-layout, .visually-hidden, [hidden], [aria-hidden="true"], .numeric-values__number, [data-heading-typing="off"]';
const completed_headings = new WeakSet();
const active_headings = new WeakMap();
const heading_observers = new WeakMap();

function disconnect_heading_observer(heading_element) {
  heading_observers.get(heading_element)?.disconnect();
  heading_observers.delete(heading_element);
}

function find_headings(page_context) {
  return [
    ...(page_context.matches?.(HEADING_SELECTOR) ? [page_context] : []),
    ...page_context.querySelectorAll(HEADING_SELECTOR),
  ];
}

function animate_heading(heading_element) {
  const heading_document = heading_element.ownerDocument;
  const heading_window = heading_document.defaultView;
  const motion_query = heading_window.matchMedia('(prefers-reduced-motion: reduce)');
  const heading_bounds = heading_element.getBoundingClientRect();
  if (motion_query.matches || !heading_element.checkVisibility()
    || heading_bounds.bottom <= 0 || heading_bounds.top >= heading_window.innerHeight) {
    disconnect_heading_observer(heading_element);
    return;
  }

  const text_walker = heading_document.createTreeWalker(heading_element, NodeFilter.SHOW_TEXT);
  const text_nodes = [];
  while (text_walker.nextNode()) {
    // Wrapping whitespace-only nodes would create extra items and gaps in flex headings.
    if (text_walker.currentNode.textContent.trim()
      && !text_walker.currentNode.parentElement.closest('svg, icon, script, style, [aria-hidden="true"], .visually-hidden')) {
      text_nodes.push(text_walker.currentNode);
    }
  }
  const character_segmenter = new Intl.Segmenter(heading_document.documentElement.lang || undefined, { granularity: 'grapheme' });
  const source_wrappers = [];
  const character_records = [];
  const running_animations = [];
  let finish_timer;

  function finish_heading() {
    disconnect_heading_observer(heading_element);
    heading_window.clearTimeout(finish_timer);
    running_animations.forEach((character_animation) => character_animation.cancel());
    character_records.forEach(({ character_element }) => character_element.remove());
    source_wrappers.forEach((source_wrapper) => source_wrapper.replaceWith(...source_wrapper.childNodes));
    heading_element.classList.remove('heading-typing');
    heading_window.removeEventListener('resize', finish_heading);
    motion_query.removeEventListener('change', finish_heading);
    heading_element.removeEventListener('focusin', finish_heading);
    active_headings.delete(heading_element);
  }

  active_headings.set(heading_element, finish_heading);
  heading_element.classList.add('heading-typing');
  try {
    // Keep complete source text in normal flow and the accessibility tree.
    // Range positions preserve wrapping, kerning, line breaks and heading height.
    text_nodes.forEach((text_node) => {
      const source_wrapper = heading_document.createElement('span');
      source_wrapper.className = 'heading-typing__source';
      text_node.replaceWith(source_wrapper);
      source_wrapper.append(text_node);
      source_wrappers.push(source_wrapper);
      const source_range = heading_document.createRange();
      let insertion_anchor = source_wrapper;
      for (const text_segment of character_segmenter.segment(text_node.textContent)) {
        if (!text_segment.segment.trim()) continue;
        source_range.setStart(text_node, text_segment.index);
        source_range.setEnd(text_node, text_segment.index + text_segment.segment.length);
        const source_bounds = source_range.getBoundingClientRect();
        const character_element = heading_document.createElement('span');
        character_element.className = 'heading-typing__character';
        character_element.setAttribute('aria-hidden', 'true');
        character_element.textContent = text_segment.segment;
        insertion_anchor.after(character_element);
        insertion_anchor = character_element;
        character_records.push({ character_element, source_bounds });
      }
    });

    const line_records = new Map();
    character_records.forEach((character_record) => {
      const line_position = Math.round(character_record.source_bounds.top);
      if (!line_records.has(line_position)) line_records.set(line_position, []);
      line_records.get(line_position).push(character_record);
    });
    line_records.forEach((line_characters) => {
      line_characters.sort((first_character, second_character) => first_character.source_bounds.left - second_character.source_bounds.left);
      const line_right = Math.max(...line_characters.map(({ source_bounds }) => source_bounds.right));
      const available_tracking = Math.max(0, heading_bounds.right - line_right) / Math.max(1, line_characters.length - 1);
      line_characters.forEach((character_record, character_index) => {
        const font_size = parseFloat(heading_window.getComputedStyle(character_record.character_element).fontSize);
        character_record.tracking_offset = character_index * Math.min(font_size * 0.02, available_tracking);
      });
    });

    const typing_duration = Math.min(1600, Math.max(300, character_records.length * 35));
    const root_styles = heading_window.getComputedStyle(heading_element);
    const settle_value = root_styles.getPropertyValue('--motion-duration-long-default').trim();
    const settle_duration = parseFloat(settle_value) * (settle_value.endsWith('ms') ? 1 : 1000) || 375;
    const settle_easing = root_styles.getPropertyValue('--motion-easing-standard-default').trim() || 'ease';
    character_records.forEach(({ character_element, source_bounds, tracking_offset }, character_index) => {
      const character_range = heading_document.createRange();
      character_range.selectNodeContents(character_element);
      const character_bounds = character_range.getBoundingClientRect();
      const normal_x = source_bounds.left - character_bounds.left;
      const normal_y = source_bounds.top - character_bounds.top;
      const normal_position = `translate(${normal_x}px, ${normal_y}px)`;
      const expanded_position = `translate(${normal_x + tracking_offset}px, ${normal_y}px)`;
      running_animations.push(character_element.animate([
        { transform: expanded_position },
        { transform: normal_position },
      ], { duration: settle_duration, delay: typing_duration, easing: settle_easing, fill: 'both' }));
      running_animations.push(character_element.animate([
        { visibility: 'hidden' },
        { visibility: 'visible' },
      ], { duration: 1, delay: character_index * typing_duration / Math.max(1, character_records.length - 1), fill: 'both' }));
    });
    finish_timer = heading_window.setTimeout(finish_heading, typing_duration + settle_duration + 50);
    heading_window.addEventListener('resize', finish_heading, { once: true });
    motion_query.addEventListener('change', finish_heading, { once: true });
    heading_element.addEventListener('focusin', finish_heading, { once: true });
  } catch (_animation_error) {
    finish_heading();
  }
}

export function initialize_heading_typing(page_context) {
  const page_document = page_context.ownerDocument || page_context;
  if (!page_document.body?.classList.contains('jurenites-theme')) return;
  find_headings(page_context).forEach((heading_element) => {
    if (completed_headings.has(heading_element)
      || !heading_element.closest('main, #storybook-root, [data-heading-typing]')
      || heading_element.closest(EXCLUDED_CONTEXT)) return;
    completed_headings.add(heading_element);
    const heading_document = heading_element.ownerDocument;
    const heading_window = heading_document.defaultView;
    if (!heading_window.Intl?.Segmenter || !heading_element.animate
      || !heading_window.IntersectionObserver
      || heading_window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const visibility_observer = new heading_window.IntersectionObserver((observer_entries) => {
      if (heading_observers.get(heading_element) !== visibility_observer) return;
      observer_entries.forEach((observer_entry) => {
        if (heading_observers.get(heading_element) !== visibility_observer) return;
        if (observer_entry.isIntersecting && observer_entry.intersectionRatio >= 0.1) {
          if (!active_headings.has(heading_element)) animate_heading(heading_element);
        } else {
          // Once started, finish immediately if scrolling takes the heading away.
          active_headings.get(heading_element)?.();
        }
      });
    }, { threshold: 0.1 });
    heading_observers.set(heading_element, visibility_observer);
    heading_document.fonts.ready.then(() => {
      if (heading_observers.get(heading_element) !== visibility_observer) return;
      if (heading_element.isConnected) visibility_observer.observe(heading_element);
      else disconnect_heading_observer(heading_element);
    });
  });
}

export function detach_heading_typing(page_context) {
  find_headings(page_context).forEach((heading_element) => {
    disconnect_heading_observer(heading_element);
    active_headings.get(heading_element)?.();
    completed_headings.delete(heading_element);
  });
}
