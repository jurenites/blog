const QUIET_INTERVAL = 800;

/** Register application-owned requests through body consumption and decoding. */
export async function track_foreground_loading(request_task, page_document = document) {
  const page_state = page_document.documentElement.dataset;
  page_state.foregroundRequests = String(Number(page_state.foregroundRequests || 0) + 1);
  page_document.dispatchEvent(new CustomEvent('jurenites:media-activity'));
  try { return await request_task(); }
  finally {
    page_state.foregroundRequests = String(Math.max(0, Number(page_state.foregroundRequests) - 1));
    page_document.dispatchEvent(new CustomEvent('jurenites:media-activity'));
  }
}

/** Observe page work without replacing browser fetch/XHR APIs or consuming responses. */
export function observe_loading_activity(page_window, page_document, on_activity, background_urls = new Set()) {
  let last_activity = page_window.performance.now();
  let page_suspended = false;
  function mark_activity() {
    last_activity = page_window.performance.now();
    on_activity();
  }
  function pending_media() {
    if (page_document.fonts?.status === 'loading' || page_window.jQuery?.active > 0
      || Number(page_document.documentElement.dataset.foregroundRequests || 0) > 0) return true;
    return [...page_document.images].some((image_element) => {
      if (image_element.dataset.photoLoading === 'true') return true;
      if (image_element.complete || !image_element.getAttribute('src')) return false;
      if (image_element.loading !== 'lazy') return true;
      const image_bounds = image_element.getBoundingClientRect();
      return image_bounds.bottom >= -200 && image_bounds.top <= page_window.innerHeight + 200;
    });
  }
  const resource_observer = page_window.PerformanceObserver
    ? new page_window.PerformanceObserver((entry_list) => {
      if (entry_list.getEntries().some((resource_entry) => !background_urls.has(resource_entry.name))) mark_activity();
    }) : null;
  resource_observer?.observe({ type: 'resource', buffered: false });
  const mutation_observer = new page_window.MutationObserver((mutation_list) => {
    const media_changed = mutation_list.some((mutation_entry) => mutation_entry.type === 'attributes'
      || [...mutation_entry.addedNodes].some((added_node) => added_node.nodeType === 1
        && (added_node.matches('img, source, script[src], link[rel=stylesheet]')
          || added_node.querySelector('img, source, script[src], link[rel=stylesheet]'))));
    if (media_changed) mark_activity();
  });
  mutation_observer.observe(page_document.documentElement, {
    subtree: true, childList: true, attributes: true,
    attributeFilter: ['src', 'srcset', 'data-photo-loading', 'data-foreground-requests'],
  });
  for (const event_name of ['load', 'error', 'scroll', 'pointerdown', 'keydown', 'visibilitychange', 'jurenites:media-activity']) {
    page_document.addEventListener(event_name, mark_activity, { capture: true, passive: true });
  }
  for (const event_name of ['online', 'offline']) page_window.addEventListener(event_name, mark_activity);
  page_window.navigator.connection?.addEventListener('change', mark_activity);
  page_document.fonts?.addEventListener('loading', mark_activity);
  page_document.fonts?.addEventListener('loadingdone', mark_activity);
  page_document.fonts?.addEventListener('loadingerror', mark_activity);
  page_window.jQuery?.(page_document).on('ajaxSend.assetWarming ajaxComplete.assetWarming', mark_activity);
  page_window.addEventListener('pagehide', () => { page_suspended = true; mark_activity(); });
  page_window.addEventListener('pageshow', () => { page_suspended = false; mark_activity(); });
  const is_available = () => !page_suspended && page_document.visibilityState === 'visible'
    && page_window.navigator.onLine !== false;
  return {
    is_available,
    is_quiet: () => is_available() && page_document.readyState === 'complete' && !pending_media() && page_window.performance.now() - last_activity >= QUIET_INTERVAL,
    mark_activity,
  };
}
