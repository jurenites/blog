// Reserve whole cards while the initial layout/font metrics settle. Media keep
// their existing aspect-ratio slots, so lazy images never hold up this handover.
const CARD_SELECTOR = '[data-card-loading]';
const CARD_STATES = new WeakMap();
const DOCUMENT_STATES = new WeakMap();
const READY_LIMIT_MS = 2000;

function card_elements(card_context) {
  return [
    ...(card_context.matches?.(CARD_SELECTOR) ? [card_context] : []),
    ...card_context.querySelectorAll(CARD_SELECTOR),
  ];
}

function remove_empty_style(card_element) {
  if (!card_element.style.length && card_element.getAttribute('style') !== null) {
    card_element.removeAttribute('style');
  }
}

function restore_card_styles(card_element, card_state) {
  card_element.style.removeProperty('min-height');
  for (const [property_name, original_value, original_priority] of card_state.saved_styles) {
    if (original_value) card_element.style.setProperty(property_name, original_value, original_priority);
    else card_element.style.removeProperty(property_name);
  }
  remove_empty_style(card_element);
}

function finish_card_loading(card_element, card_state) {
  if (CARD_STATES.get(card_element) !== card_state) return;
  CARD_STATES.delete(card_element);
  card_state.height_animation?.cancel();
  card_state.resize_observer?.disconnect();
  card_element.removeEventListener('focusin', card_state.focus_listener);
  card_state.page_window.clearTimeout(card_state.ready_timeout);
  restore_card_styles(card_element, card_state);
  card_element.removeAttribute('data-card-loading');
  card_element.removeAttribute('data-card-loading-pending');
}

function estimate_card_height(card_element, card_state) {
  const card_width = card_element.getBoundingClientRect().width;
  const theme_styles = card_state.page_window.getComputedStyle(card_element);
  const base_gap = Number.parseFloat(theme_styles.getPropertyValue('--space-scale-base-gap'));
  // Keep the server estimate until the theme and a real container width exist.
  if (!base_gap || !card_width) return Number.parseFloat(card_element.style.minHeight) || 0;
  const mobile_max = Number.parseFloat(theme_styles.getPropertyValue('--system-breakpoint-mobile-max'));
  const media_max = Number.parseFloat(theme_styles.getPropertyValue('--component-article-teaser-list-media-max-width-default'));
  const compact_layout = card_state.page_window.innerWidth <= mobile_max;
  let height_estimate;
  switch (card_element.dataset.cardLoading) {
    case 'project-card':
      height_estimate = card_width * 9 / 16 + base_gap * 8;
      break;
    case 'article-teaser':
      height_estimate = Math.min(media_max, Math.max(0, card_width - base_gap * 6)) * 9 / 16 + base_gap * 30;
      break;
    case 'news-list':
      height_estimate = base_gap * (compact_layout ? 20 : 16);
      break;
    default:
      if (card_element.closest('.video-grid')) height_estimate = card_width * 9 / 16 + base_gap * 14;
      else if (compact_layout) height_estimate = card_width * 9 / 16 + base_gap * 20;
      else height_estimate = Math.max(media_max * 9 / 16, base_gap * 20);
  }
  return Math.ceil(height_estimate / base_gap) * base_gap;
}

function reserve_card_height(card_element, card_state) {
  const height_estimate = estimate_card_height(card_element, card_state);
  if (!height_estimate) return;
  card_element.style.height = `${height_estimate}px`;
  card_element.style.minHeight = '0';
  card_element.style.overflow = card_state.loading_overflow;
  card_element.style.boxSizing = 'border-box';
}

function settle_card_heights(card_list) {
  // Batch reads and writes. Measuring with the reservation removed happens in
  // the same frame as starting the animation, so the natural height never flashes.
  const active_cards = card_list.filter((card_element) => {
    const card_state = CARD_STATES.get(card_element);
    return card_state && !card_state.is_settling;
  });
  const height_records = active_cards.map((card_element) => {
    const card_state = CARD_STATES.get(card_element);
    card_state.is_settling = true;
    card_state.page_window.clearTimeout(card_state.ready_timeout);
    return { card_element, card_state, initial_height: card_element.getBoundingClientRect().height };
  });
  height_records.forEach(({ card_element, card_state }) => {
    restore_card_styles(card_element, card_state);
    card_element.removeAttribute('data-card-loading-pending');
  });
  const measured_cards = height_records.map((height_record) => ({
    ...height_record,
    final_height: height_record.card_element.getBoundingClientRect().height,
  }));
  measured_cards.forEach(({ card_element, card_state, initial_height, final_height }) => {
    const reduced_motion = card_state.page_window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!card_element.isConnected || reduced_motion || !card_element.animate ||
        !initial_height || !final_height || Math.abs(initial_height - final_height) < 1) {
      finish_card_loading(card_element, card_state);
      return;
    }
    const theme_styles = card_state.page_window.getComputedStyle(card_element);
    const duration_value = theme_styles.getPropertyValue('--motion-duration-media-reveal-default').trim();
    const duration_ms = Number.parseFloat(duration_value) * (duration_value.endsWith('ms') ? 1 : 1000);
    card_state.height_animation = card_element.animate([
      { height: `${initial_height}px`, minHeight: '0', overflow: card_state.loading_overflow, boxSizing: 'border-box' },
      { height: `${final_height}px`, minHeight: '0', overflow: card_state.loading_overflow, boxSizing: 'border-box' },
    ], {
      duration: Number.isFinite(duration_ms) ? duration_ms : 200,
      easing: theme_styles.getPropertyValue('--motion-easing-standard-default').trim() || 'ease',
    });
    const finish_loading = () => finish_card_loading(card_element, card_state);
    card_state.height_animation.finished.then(finish_loading, finish_loading);
  });
}

export function initialize_card_loading(card_context = document) {
  const page_document = card_context.ownerDocument || card_context;
  const page_window = page_document.defaultView;
  const pending_cards = card_elements(card_context).filter((card_element) => !CARD_STATES.has(card_element));
  if (!pending_cards.length) return;
  pending_cards.forEach((card_element) => {
    const card_state = {
      page_window,
      // Preserve horizontal overflow semantics for title-arrow fitting. Adding
      // a new horizontal clipping boundary changes that component's measurements.
      loading_overflow: page_window.getComputedStyle(card_element).overflowX === 'visible' ? 'visible clip' : 'clip',
      saved_styles: ['height', 'overflow', 'box-sizing'].map((property_name) => [
        property_name, card_element.style.getPropertyValue(property_name), card_element.style.getPropertyPriority(property_name),
      ]),
    };
    CARD_STATES.set(card_element, card_state);
    // A keyboard user can enter a card before fonts finish. Reveal its complete
    // natural layout immediately so the focused control cannot be clipped.
    card_state.focus_listener = () => finish_card_loading(card_element, card_state);
    card_element.addEventListener('focusin', card_state.focus_listener);
    card_element.setAttribute('data-card-loading-pending', '');
    reserve_card_height(card_element, card_state);
    if (page_window.ResizeObserver) {
      let previous_width = card_element.getBoundingClientRect().width;
      card_state.resize_observer = new page_window.ResizeObserver(() => {
        const current_width = card_element.getBoundingClientRect().width;
        if (current_width === previous_width) return;
        previous_width = current_width;
        if (card_state.is_settling) finish_card_loading(card_element, card_state);
        else reserve_card_height(card_element, card_state);
      });
      card_state.resize_observer.observe(card_element);
    }
    // Also recover if parsing, fonts, or the rest of the page never finish.
    card_state.ready_timeout = page_window.setTimeout(() => {
      if (CARD_STATES.has(card_element)) settle_card_heights([card_element]);
    }, READY_LIMIT_MS);
  });
  const layout_ready = () => {
    // A frame ensures parsed text participates in font selection before ready.
    page_window.requestAnimationFrame(() => {
      pending_cards.forEach((card_element) => { void card_element.getBoundingClientRect().height; });
      Promise.resolve(page_document.fonts?.ready).then(() => {
        page_window.requestAnimationFrame(() => settle_card_heights(pending_cards));
      });
    });
  };
  if (page_document.readyState === 'loading') page_document.addEventListener('DOMContentLoaded', layout_ready, { once: true });
  else layout_ready();
}

export function detach_card_loading(card_context) {
  card_elements(card_context).forEach((card_element) => {
    const card_state = CARD_STATES.get(card_element);
    if (card_state) finish_card_loading(card_element, card_state);
  });
}

/** Runs from the existing head script, including streamed and AJAX card markup. */
export function install_card_loading(page_document = document) {
  if (DOCUMENT_STATES.has(page_document)) return;
  const page_window = page_document.defaultView;
  const card_observer = new page_window.MutationObserver((mutation_records) => {
    mutation_records.forEach((mutation_record) => {
      mutation_record.removedNodes.forEach((removed_node) => {
        if (removed_node.nodeType === 1 && !removed_node.isConnected) detach_card_loading(removed_node);
      });
      mutation_record.addedNodes.forEach((added_node) => {
        if (added_node.nodeType === 1) initialize_card_loading(added_node);
      });
    });
  });
  card_observer.observe(page_document.documentElement, { childList: true, subtree: true });
  DOCUMENT_STATES.set(page_document, card_observer);
  initialize_card_loading(page_document);
  page_window.addEventListener('pagehide', () => detach_card_loading(page_document));
  // Do not restore stale pixel heights when a tab returns from the back cache.
  page_window.addEventListener('pageshow', (page_event) => {
    if (page_event.persisted) detach_card_loading(page_document);
  });
}
