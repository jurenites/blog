const ARTICLE_SELECTOR = '[data-article-table-of-content]';
const ARTICLE_STATES = new WeakMap();

function article_elements(article_context) {
  return [
    ...(article_context.matches?.(ARTICLE_SELECTOR) ? [article_context] : []),
    ...article_context.querySelectorAll(ARTICLE_SELECTOR),
  ];
}

/** Enhance only rendered Article Body headings; authored content stays untouched. */
export function initialize_article_table_of_content(article_context) {
  article_elements(article_context).forEach((article_element) => {
    if (ARTICLE_STATES.has(article_element)) return;
    const page_document = article_element.ownerDocument;
    const page_window = page_document.defaultView;
    const contents_element = article_element.querySelector('.article_table-of-content');
    const list_element = contents_element?.querySelector('.article_table-of-content__list');
    const heading_elements = Array.from(article_element.querySelectorAll(
      '.article-detail__body h2, .article-detail__body h3',
    )).filter((heading_element) => heading_element.textContent.trim() &&
      !heading_element.closest('[hidden], [aria-hidden="true"]'));
    if (!list_element || heading_elements.length < 2) return;

    const reserved_ids = new Set(Array.from(page_document.querySelectorAll('[id]'),
      (document_element) => document_element.id));
    const heading_links = [];
    const focus_headings = [];
    let parent_item = null;
    let nested_list = null;

    heading_elements.forEach((heading_element) => {
      const heading_text = heading_element.textContent.trim().replace(/\s+/g, ' ');
      if (!heading_element.id) {
        const heading_slug = heading_text.toLowerCase().normalize('NFKC')
          .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
        const anchor_base = `article-heading-${heading_slug}`;
        let anchor_value = anchor_base;
        let anchor_suffix = 2;
        while (reserved_ids.has(anchor_value)) anchor_value = `${anchor_base}-${anchor_suffix++}`;
        heading_element.id = anchor_value;
        reserved_ids.add(anchor_value);
      }
      if (!heading_element.hasAttribute('tabindex')) {
        heading_element.tabIndex = -1;
        focus_headings.push(heading_element);
      }

      const heading_item = page_document.createElement('li');
      const heading_link = page_document.createElement('a');
      heading_item.className = 'article_table-of-content__item';
      heading_link.className = 'article_table-of-content__link';
      heading_link.textContent = heading_text;
      heading_link.setAttribute('href', `#${encodeURIComponent(heading_element.id)}`);
      heading_item.append(heading_link);
      heading_links.push(heading_link);

      if (heading_element.tagName === 'H3' && parent_item) {
        if (!nested_list) {
          nested_list = page_document.createElement('ul');
          nested_list.className = 'article_table-of-content__list article_table-of-content__list--nested';
          parent_item.append(nested_list);
        }
        nested_list.append(heading_item);
      } else {
        list_element.append(heading_item);
        parent_item = heading_element.tagName === 'H2' ? heading_item : null;
        nested_list = null;
      }
    });

    let frame_handle = 0;
    let active_index = -1;
    const update_current_heading = () => {
      frame_handle = 0;
      if (!article_element.isConnected) return;
      const heading_offset = Number.parseFloat(page_window.getComputedStyle(
        heading_elements[0],
      ).scrollMarginTop) || 0;
      let current_index = 0;
      heading_elements.forEach((heading_element, heading_index) => {
        if (heading_element.getBoundingClientRect().top <= heading_offset + 1) {
          current_index = heading_index;
        }
      });
      if (current_index === active_index) return;
      heading_links[active_index]?.removeAttribute('aria-current');
      heading_links[current_index].setAttribute('aria-current', 'location');
      active_index = current_index;
    };
    const schedule_update = () => {
      if (!frame_handle) frame_handle = page_window.requestAnimationFrame(update_current_heading);
    };
    // Native links provide browser history, keyboard focus and shareable fragments.
    const restore_initial_fragment = () => {
      let fragment_value;
      try { fragment_value = decodeURIComponent(page_window.location.hash.slice(1)); }
      catch (_fragment_error) { return; }
      const target_heading = heading_elements.find((heading_element) => heading_element.id === fragment_value);
      target_heading?.scrollIntoView({ behavior: 'instant', block: 'start' });
      schedule_update();
    };

    contents_element.hidden = false;
    article_element.classList.add('article-detail--with-table-of-content');
    page_window.addEventListener('scroll', schedule_update, { passive: true });
    page_window.addEventListener('resize', schedule_update);
    const layout_observer = page_window.ResizeObserver ? new page_window.ResizeObserver(schedule_update) : null;
    layout_observer?.observe(article_element);
    if (page_document.readyState === 'complete') restore_initial_fragment();
    else page_window.addEventListener('load', restore_initial_fragment, { once: true });
    schedule_update();

    ARTICLE_STATES.set(article_element, () => {
      page_window.removeEventListener('scroll', schedule_update);
      page_window.removeEventListener('resize', schedule_update);
      page_window.removeEventListener('load', restore_initial_fragment);
      page_window.cancelAnimationFrame(frame_handle);
      layout_observer?.disconnect();
      focus_headings.forEach((heading_element) => heading_element.removeAttribute('tabindex'));
      list_element.replaceChildren();
      contents_element.hidden = true;
      article_element.classList.remove('article-detail--with-table-of-content');
    });
  });
}

export function detach_article_table_of_content(article_context) {
  article_elements(article_context).forEach((article_element) => {
    ARTICLE_STATES.get(article_element)?.();
    ARTICLE_STATES.delete(article_element);
  });
}
