import { initialize_cursor_cards, detach_cursor_cards } from '../../../slice/src/js/cursor-card.js';
import { initialize_dynamic_thumbnails, detach_dynamic_thumbnails } from '../../../slice/src/js/dynamic-thumbnail.js';

export function initialize_accountia_preview(root_element) {
  window.requestAnimationFrame(() => {
    if (!root_element.isConnected) return;
    initialize_cursor_cards(root_element);
    initialize_dynamic_thumbnails(root_element);
    const removal_observer = new MutationObserver(() => {
      if (root_element.isConnected) return;
      detach_cursor_cards(root_element);
      detach_dynamic_thumbnails(root_element);
      removal_observer.disconnect();
    });
    removal_observer.observe(root_element.parentNode, { childList: true });
  });
}
