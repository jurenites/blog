const TITLE_SELECTOR = 'h1, h2, h3, h4, h5, h6';
const EXCLUDED_CONTEXT = 'nav, footer, dialog, [role="dialog"], [contenteditable], .ck, .studio-layout, .visually-hidden, [hidden], [aria-hidden="true"], .numeric-values__number, [data-last-word-not-wrap="off"]';
const title_observers = new WeakMap();

function find_titles(page_context) {
  return [
    ...(page_context.matches?.(TITLE_SELECTOR) ? [page_context] : []),
    ...page_context.querySelectorAll(TITLE_SELECTOR),
  ];
}

function protect_final_words(text_nodes) {
  const combined_text = text_nodes.map((text_node) => text_node.data).join('');
  const final_separator = /\S([ \t\r\n]+)\S+\s*$/u.exec(combined_text);
  if (!final_separator) return;
  const separator_start = final_separator.index + 1;
  const separator_end = separator_start + final_separator[1].length;
  let text_offset = 0;
  text_nodes.forEach((text_node) => {
    const source_text = text_node.data;
    const local_start = Math.max(0, separator_start - text_offset);
    const local_end = Math.min(source_text.length, separator_end - text_offset);
    if (local_start < local_end) {
      text_node.data = source_text.slice(0, local_start)
        + (text_offset <= separator_start ? '\u00a0' : '') + source_text.slice(local_end);
    }
    text_offset += source_text.length;
  });
}

function prepare_title(heading_element) {
  const heading_document = heading_element.ownerDocument;
  const heading_window = heading_document.defaultView;
  let text_group = [];
  const text_nodes = [];
  function finish_group() {
    protect_final_words(text_group);
    text_group = [];
  }
  function visit_node(content_node) {
    if (content_node.nodeType === 3) {
      text_group.push(content_node);
      text_nodes.push(content_node);
      return;
    }
    if (content_node.nodeType !== 1 || content_node.matches(`svg, icon, script, style, ${EXCLUDED_CONTEXT}`)) return;
    if (content_node.tagName === 'BR') {
      finish_group();
      return;
    }
    const content_display = heading_window.getComputedStyle(content_node).display;
    const separate_group = content_node !== heading_element && !['inline', 'contents'].includes(content_display);
    if (separate_group) finish_group();
    [...content_node.childNodes].forEach(visit_node);
    if (separate_group) finish_group();
  }
  visit_node(heading_element);
  finish_group();
  text_nodes.forEach((text_node) => {
    if (!text_node.data.trim() || text_node.parentElement.closest('.last-word-not-wrap__text')) return;
    const text_wrapper = heading_document.createElement('span');
    text_wrapper.className = 'last-word-not-wrap__text';
    text_node.replaceWith(text_wrapper);
    text_wrapper.append(text_node);
  });
  heading_element.classList.add('last-word-not-wrap');
}

function fit_title(heading_element) {
  if (heading_element.classList.contains('heading-typing')) return;
  const heading_document = heading_element.ownerDocument;
  const heading_window = heading_document.defaultView;
  heading_element.classList.remove('last-word-not-wrap--constrained');
  let available_left = 0;
  let available_right = heading_document.documentElement.clientWidth;
  // Respect existing scroll/clipping regions without creating another one.
  for (let parent_element = heading_element.parentElement; parent_element; parent_element = parent_element.parentElement) {
    if (heading_window.getComputedStyle(parent_element).overflowX !== 'visible') {
      const parent_bounds = parent_element.getBoundingClientRect();
      available_left = Math.max(available_left, parent_bounds.left);
      available_right = Math.min(available_right, parent_bounds.right);
    }
  }
  const title_range = heading_document.createRange();
  title_range.selectNodeContents(heading_element);
  const exceeds_boundary = [...title_range.getClientRects()].some((text_bounds) => text_bounds.left < available_left - 1 || text_bounds.right > available_right + 1);
  heading_element.classList.toggle('last-word-not-wrap--constrained', exceeds_boundary);
}

export function initialize_last_word_not_wrap(page_context) {
  const page_document = page_context.ownerDocument || page_context;
  if (!page_document.body?.classList.contains('jurenites-theme')) return;
  find_titles(page_context).forEach((heading_element) => {
    if (title_observers.has(heading_element)
      || !heading_element.closest('main, #storybook-root')
      || heading_element.closest(EXCLUDED_CONTEXT)) return;
    prepare_title(heading_element);
    fit_title(heading_element);
    const heading_window = page_document.defaultView;
    const resize_handler = () => fit_title(heading_element);
    const title_observer = new heading_window.ResizeObserver(resize_handler);
    title_observer.observe(heading_element);
    heading_window.addEventListener('resize', resize_handler);
    title_observers.set(heading_element, { title_observer, resize_handler });
    page_document.fonts.ready.then(() => {
      if (heading_element.isConnected && title_observers.has(heading_element)) fit_title(heading_element);
    });
  });
}

export function detach_last_word_not_wrap(page_context) {
  find_titles(page_context).forEach((heading_element) => {
    const title_state = title_observers.get(heading_element);
    if (!title_state) return;
    title_state.title_observer.disconnect();
    heading_element.ownerDocument.defaultView.removeEventListener('resize', title_state.resize_handler);
    title_observers.delete(heading_element);
  });
}
