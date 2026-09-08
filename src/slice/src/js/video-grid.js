const LISTING_SELECTOR = '[data-video-listing]';
const LISTING_STATES = new WeakMap();

function listing_elements(listing_context) {
  return [
    ...(listing_context.matches?.(LISTING_SELECTOR) ? [listing_context] : []),
    ...listing_context.querySelectorAll(LISTING_SELECTOR),
  ];
}

/** Enhance native next-page links, leaving the server pager usable on failure. */
export function initialize_video_grids(listing_context, { fetch_page } = {}) {
  listing_elements(listing_context).forEach((listing_element) => {
    const page_window = listing_element.ownerDocument.defaultView;
    const grid_element = listing_element.querySelector('.video-grid');
    const pager_element = listing_element.querySelector('[data-video-pager]');
    const status_element = listing_element.querySelector('[data-video-status]');
    const next_link = pager_element?.querySelector('a[rel="next"]');

    if (LISTING_STATES.has(listing_element) || !grid_element || !status_element ||
        !next_link || !page_window.IntersectionObserver || !page_window.fetch ||
        !page_window.AbortController) return;

    const request_page = fetch_page || page_window.fetch.bind(page_window);
    const loaded_urls = new Set([page_window.location.href]);
    let next_url = new URL(next_link.getAttribute('href'), page_window.location.href).href;
    let request_controller;
    let loading_active = false;
    let detached_state = false;

    const restore_pagination = () => {
      page_observer.disconnect();
      pager_element.hidden = false;
      status_element.textContent = status_element.dataset.errorText;
    };

    const load_next_page = async () => {
      if (loading_active || !next_url || detached_state) return;
      loading_active = true;
      page_observer.unobserve(status_element);
      grid_element.setAttribute('aria-busy', 'true');
      status_element.textContent = status_element.dataset.loadingText;
      request_controller = new page_window.AbortController();
      const timeout_handle = page_window.setTimeout(() => request_controller.abort(), 15000);

      try {
        const request_url = new URL(next_url);
        if (request_url.origin !== page_window.location.origin || loaded_urls.has(next_url)) {
          throw new Error('Invalid or repeated Videos page.');
        }
        const page_response = await request_page(next_url, {
          signal: request_controller.signal,
          credentials: 'same-origin',
        });
        if (!page_response.ok || page_response.redirected) throw new Error('Videos page unavailable.');
        const page_document = new page_window.DOMParser().parseFromString(await page_response.text(), 'text/html');
        const next_listing = page_document.querySelector(LISTING_SELECTOR);
        const next_grid = next_listing?.querySelector('.video-grid');
        const next_pager = next_listing?.querySelector('[data-video-pager]');
        const next_items = Array.from(next_grid?.children || []);
        if (!next_items.length || !next_pager ||
            next_items.some((video_item) => !video_item.matches('.video-grid__item'))) {
          throw new Error('Videos page markup missing.');
        }
        if (detached_state) return;

        loaded_urls.add(next_url);
        const following_link = next_pager.querySelector('a[rel="next"]');
        next_url = following_link
          ? new URL(following_link.getAttribute('href'), request_url).href : null;
        grid_element.append(...next_items);
        pager_element.replaceChildren(...next_pager.childNodes);
        // Reattach the existing thumbnail, avatar and tooltip behaviors to new cards.
        next_items.forEach((video_item) => page_window.Drupal?.attachBehaviors(video_item));
        status_element.textContent = next_url
          ? status_element.dataset.loadedText : status_element.dataset.completeText;
        status_element.classList.toggle('video-grid__status--complete', !next_url);
        if (next_url) page_observer.observe(status_element);
        else page_observer.disconnect();
      } catch (_request_error) {
        if (!detached_state) restore_pagination();
      } finally {
        page_window.clearTimeout(timeout_handle);
        grid_element.removeAttribute('aria-busy');
        loading_active = false;
      }
    };

    const page_observer = new page_window.IntersectionObserver((visible_entries) => {
      if (visible_entries.some((visible_entry) => visible_entry.isIntersecting)) void load_next_page();
    }, { rootMargin: '400px 0px' });

    LISTING_STATES.set(listing_element, () => {
      detached_state = true;
      page_observer.disconnect();
      request_controller?.abort();
      pager_element.hidden = false;
      status_element.hidden = true;
    });
    pager_element.hidden = true;
    status_element.classList.remove('video-grid__status--complete');
    status_element.hidden = false;
    page_observer.observe(status_element);
  });
}

export function detach_video_grids(listing_context) {
  listing_elements(listing_context).forEach((listing_element) => {
    LISTING_STATES.get(listing_element)?.();
    LISTING_STATES.delete(listing_element);
  });
}
