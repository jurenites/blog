// Keep the original media node and its listeners so source changes can recover.
export function install_media_fallback(page_document = document) {
  const media_states = new WeakMap();
  function update_media(media_element, failed_state) {
    if (!media_element.matches?.('img, video')) return;
    let media_state = media_states.get(media_element);
    if (failed_state && !media_state) {
      const fallback_surface = page_document.createElement('span');
      fallback_surface.className = `${media_element.className} storybook-media-fallback`;
      fallback_surface.setAttribute('role', 'img');
      fallback_surface.setAttribute('aria-label', media_element.getAttribute('alt') || media_element.getAttribute('aria-label') || 'Media unavailable');
      media_element.before(fallback_surface);
      media_state = { fallback_surface };
      media_states.set(media_element, media_state);
      media_element.classList.add('storybook-media-unavailable');
    } else if (!failed_state && media_state) {
      media_state.fallback_surface.remove();
      media_element.classList.remove('storybook-media-unavailable');
      media_states.delete(media_element);
    }
  }
  page_document.addEventListener('error', (media_event) => {
    const media_element = media_event.target;
    update_media(media_element.matches?.('source') ? media_element.parentElement : media_element, true);
  }, true);
  page_document.addEventListener('load', (media_event) => update_media(media_event.target, false), true);
  page_document.addEventListener('loadeddata', (media_event) => update_media(media_event.target, false), true);
  const media_observer = new MutationObserver(() => {
    page_document.querySelectorAll('img, video').forEach((media_element) => {
      if (media_element.matches('img') && media_element.complete && media_element.currentSrc) {
        update_media(media_element, !media_element.naturalWidth);
      } else if (media_element.error) update_media(media_element, true);
    });
  });
  media_observer.observe(page_document.documentElement, { childList: true, subtree: true });
}
