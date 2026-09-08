const PAGE_LIMIT = 2;
const ASSET_LIMIT = 6;
const PUBLIC_LINK_SELECTOR = '.site-header__navigation a[href], .article-teaser__title-link[href], .article-teaser__image-link[href], .article-list-item__title-link[href]';

export function can_warm_assets(browser_navigator, page_document) {
  const connection_info = browser_navigator.connection;
  return browser_navigator.onLine !== false
    && !connection_info?.saveData
    && !/^(slow-2g|2g|3g)$/.test(connection_info?.effectiveType || '')
    && page_document.visibilityState === 'visible'
    && !page_document.body.classList.contains('user-logged-in');
}

export function public_page_url(link_element, current_url) {
  if (!link_element || link_element.hasAttribute('download')
    || link_element.getAttribute('target') === '_blank'
    || link_element.closest('[data-no-prefetch]')) {
    return null;
  }
  const target_url = new URL(link_element.href, current_url);
  const source_url = new URL(current_url);
  if (!/^https?:$/.test(target_url.protocol) || target_url.origin !== source_url.origin
    || target_url.search || target_url.hash || target_url.pathname === source_url.pathname
    || /\/(?:admin|user|session|cart|checkout|search)(?:\/|$)/i.test(target_url.pathname)
    || /\/(?:edit|delete|logout|add)(?:\/|$)/i.test(target_url.pathname)
    || /\.[a-z0-9]+$/i.test(target_url.pathname)) {
    return null;
  }
  return target_url.href;
}

// HTTP cache remains the authority: no service worker, private cache, or stale-copy serving.
export function install_asset_warming(page_window = window, page_document = document) {
  if (page_document.documentElement.dataset.assetWarmingInitialized) {
    return;
  }
  page_document.documentElement.dataset.assetWarmingInitialized = 'true';
  const warmed_pages = new Set();
  const warmed_assets = new Set();
  let request_active = false;
  let page_loaded = page_document.readyState === 'complete';

  function warming_allowed() {
    return page_loaded && can_warm_assets(page_window.navigator, page_document);
  }

  function warm_page_assets(page_source, page_url) {
    // Template content stays inert: scripts, iframes and images are never inserted into the page.
    const source_template = page_document.createElement('template');
    source_template.innerHTML = page_source;
    let asset_count = 0;
    let image_count = 0;
    const asset_elements = source_template.content.querySelectorAll('link[rel="stylesheet"][href], script[src], img[src]');
    for (const asset_element of asset_elements) {
      if (!warming_allowed() || asset_count >= ASSET_LIMIT) break;
      const is_image = asset_element.tagName === 'IMG';
      if (is_image && image_count >= 2) continue;
      const asset_source = asset_element.getAttribute('src') || asset_element.getAttribute('href');
      const asset_url = new URL(asset_source, page_url);
      if (asset_url.origin !== page_window.location.origin || asset_url.protocol !== page_window.location.protocol
        || warmed_assets.has(asset_url.href)
        || page_window.performance.getEntriesByName(asset_url.href).length) continue;
      const prefetch_link = page_document.createElement('link');
      if (!prefetch_link.relList.supports('prefetch')) return;
      prefetch_link.rel = 'prefetch';
      prefetch_link.href = asset_url.href;
      prefetch_link.setAttribute('fetchpriority', 'low');
      prefetch_link.dataset.assetWarming = 'true';
      page_document.head.appendChild(prefetch_link);
      warmed_assets.add(asset_url.href);
      asset_count += 1;
      if (is_image) image_count += 1;
    }
  }

  async function warm_link_target(link_element) {
    if (!warming_allowed() || request_active || warmed_pages.size >= PAGE_LIMIT) return;
    const page_url = public_page_url(link_element, page_window.location.href);
    if (!page_url || warmed_pages.has(page_url)) return;
    warmed_pages.add(page_url);
    request_active = true;
    const abort_controller = new AbortController();
    const timeout_id = page_window.setTimeout(() => abort_controller.abort(), 5000);
    try {
      const page_response = await page_window.fetch(page_url, {
        credentials: 'same-origin',
        mode: 'same-origin',
        redirect: 'error',
        priority: 'low',
        signal: abort_controller.signal,
        headers: { Accept: 'text/html' },
      });
      if (!page_response.ok || !page_response.headers.get('content-type')?.includes('text/html')
        || /no-store|private/i.test(page_response.headers.get('cache-control') || '')) return;
      // Bound HTML inspection even when Content-Length is absent/compressed.
      const response_reader = page_response.body.getReader();
      const text_decoder = new TextDecoder();
      let page_source = '';
      let byte_count = 0;
      while (true) {
        const response_chunk = await response_reader.read();
        if (response_chunk.done) break;
        byte_count += response_chunk.value.byteLength;
        if (byte_count > 262144 || !warming_allowed()) {
          await response_reader.cancel();
          return;
        }
        page_source += text_decoder.decode(response_chunk.value, { stream: true });
      }
      warm_page_assets(page_source + text_decoder.decode(), page_url);
    } catch {
      // Speculation must never affect navigation or produce a user-facing error.
    } finally {
      abort_controller.abort();
      page_window.clearTimeout(timeout_id);
      request_active = false;
    }
  }

  function warm_intended_link(pointer_event) {
    const target_link = pointer_event.target.closest?.(PUBLIC_LINK_SELECTOR);
    if (target_link) void warm_link_target(target_link);
  }

  function start_background_warming() {
    page_loaded = true;
    page_document.addEventListener('pointerover', warm_intended_link, { passive: true });
    page_document.addEventListener('focusin', warm_intended_link);
    const warm_likely_page = () => {
      if (!warming_allowed()) return;
      const candidate_links = [...page_document.querySelectorAll(PUBLIC_LINK_SELECTOR)];
      const likely_link = candidate_links.find((link_element) => link_element.matches('.article-teaser__title-link, .article-list-item__title-link')
        && public_page_url(link_element, page_window.location.href))
        || candidate_links.find((link_element) => public_page_url(link_element, page_window.location.href));
      if (likely_link) void warm_link_target(likely_link);
    };
    if (page_window.requestIdleCallback) {
      page_window.requestIdleCallback(warm_likely_page, { timeout: 3000 });
    } else {
      page_window.setTimeout(warm_likely_page, 1500);
    }
  }

  if (page_loaded) start_background_warming();
  else page_window.addEventListener('load', start_background_warming, { once: true });
}
