const SPRITE_REQUESTS = new WeakMap();

// Geometry is fetched once per document, strictly after its initial load event.
// The browser HTTP cache reuses the versioned file on subsequent navigations.
export function install_icon_sprite(page_window = window, page_document = document) {
  if (SPRITE_REQUESTS.has(page_document)) return SPRITE_REQUESTS.get(page_document);
  const sprite_promise = new Promise((resolve_sprite) => {
    const sprite_marker = page_document.querySelector('[data-icon-sprite-url]');
    if (!sprite_marker) {
      resolve_sprite(false);
      return;
    }
    const sprite_url = new URL(sprite_marker.dataset.iconSpriteUrl, page_window.location.href);
    if (sprite_url.origin !== page_window.location.origin) {
      resolve_sprite(false);
      return;
    }

    async function fetch_sprite(request_attempt = 0) {
      const abort_controller = new AbortController();
      const timeout_id = page_window.setTimeout(() => abort_controller.abort(), 8000);
      try {
        const sprite_response = await page_window.fetch(sprite_url.href, {
          credentials: 'same-origin', mode: 'same-origin', redirect: 'error',
          priority: 'low', signal: abort_controller.signal,
        });
        if (!sprite_response.ok) throw new Error('Sprite request failed');
        const sprite_source = await sprite_response.text();
        const sprite_document = new page_window.DOMParser().parseFromString(sprite_source, 'image/svg+xml');
        const sprite_element = sprite_document.documentElement;
        if (sprite_element.localName !== 'svg' || sprite_document.querySelector('parsererror')
          || !sprite_element.classList.contains('icon-sprite')) throw new Error('Invalid icon sprite');
        page_document.body.prepend(page_document.importNode(sprite_element, true));
        sprite_marker.dataset.iconSpriteState = 'ready';
        resolve_sprite(true);
      } catch {
        if (request_attempt === 0) {
          page_window.setTimeout(() => { void fetch_sprite(1); }, 1500);
        } else {
          sprite_marker.dataset.iconSpriteState = 'failed';
          resolve_sprite(false);
        }
      } finally {
        abort_controller.abort();
        page_window.clearTimeout(timeout_id);
      }
    }

    function schedule_sprite_request() {
      // Yield past all load handlers so this request cannot hold up window.load.
      page_window.setTimeout(() => { void fetch_sprite(); }, 0);
    }

    if (page_document.readyState === 'complete') schedule_sprite_request();
    else page_window.addEventListener('load', schedule_sprite_request, { once: true });
  });
  SPRITE_REQUESTS.set(page_document, sprite_promise);
  return sprite_promise;
}
