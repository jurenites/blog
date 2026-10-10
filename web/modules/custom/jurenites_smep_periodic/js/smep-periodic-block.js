/* global Drupal, once */
(function (drupal_api, once_api) {
  const block_instances = new WeakMap();
  let frame_sequence = 0;
  drupal_api.behaviors.smepPeriodicBlock = {
    attach(page_context) {
      once_api('smep-periodic-block', '[data-smep-periodic-block]', page_context).forEach((block_element) => {
        const frame_element = block_element.querySelector('.smep-periodic-block__frame');
        const expand_button = block_element.querySelector('.smep-periodic-block__expand');
        const frame_origin = new URL(frame_element.src, window.location.href).origin;
        let block_visible = false;
        let content_observer;
        let content_height = 0;
        const frame_key = `smep-frame-${++frame_sequence}`;
        frame_element.dataset.smepFrame = frame_key;
        // Measured geometry lives in a per-instance CSS rule, not inline markup.
        const sizing_stylesheet = document.createElement('style');
        document.head.append(sizing_stylesheet);
        const observe_content = () => {
          content_observer?.disconnect();
          const content_element = frame_element.contentDocument?.querySelector('.atlas');
          if (!content_element) return;
          const sync_height = () => {
            const next_height = Math.ceil(content_element.getBoundingClientRect().height);
            if (!next_height || next_height === content_height) return;
            content_height = next_height;
            sizing_stylesheet.textContent = `.smep-periodic-block__frame[data-smep-frame="${frame_key}"] { --smep-table-height: ${content_height}px; }`;
          };
          content_observer = new ResizeObserver(sync_height);
          content_observer.observe(content_element);
          sync_height();
        };
        frame_element.addEventListener('load', observe_content);
        observe_content();
        const send_visibility = () => frame_element.contentWindow?.postMessage({
          type: 'smep:host-visibility', visible: block_visible && !document.hidden,
        }, frame_origin);
        const frame_observer = new IntersectionObserver((observed_entries) => {
          block_visible = observed_entries[0].isIntersecting;
          send_visibility();
        });
        frame_observer.observe(frame_element);
        const on_message = (message_event) => {
          if (message_event.origin === frame_origin && message_event.source === frame_element.contentWindow && message_event.data?.type === 'smep:ready') send_visibility();
        };
        const on_fullscreen = () => {
          expand_button.textContent = document.fullscreenElement === block_element ? expand_button.dataset.collapseLabel : expand_button.dataset.expandLabel;
          send_visibility();
        };
        if (block_element.requestFullscreen && document.fullscreenEnabled) {
          expand_button.hidden = false;
          expand_button.addEventListener('click', async () => {
            try {
              if (document.fullscreenElement === block_element) await document.exitFullscreen();
              else await block_element.requestFullscreen();
            } catch {
              block_element.querySelector('.smep-periodic-block__open').focus();
            }
          });
        }
        window.addEventListener('message', on_message);
        document.addEventListener('visibilitychange', send_visibility);
        document.addEventListener('fullscreenchange', on_fullscreen);
        frame_element.addEventListener('load', send_visibility);
        block_instances.set(block_element, () => {
          frame_observer.disconnect();
          content_observer?.disconnect();
          frame_element.removeEventListener('load', observe_content);
          sizing_stylesheet.remove();
          delete frame_element.dataset.smepFrame;
          window.removeEventListener('message', on_message);
          document.removeEventListener('visibilitychange', send_visibility);
          document.removeEventListener('fullscreenchange', on_fullscreen);
          frame_element.removeEventListener('load', send_visibility);
        });
      });
    },
    detach(page_context, page_settings, detach_trigger) {
      if (detach_trigger !== 'unload') return;
      once_api.remove('smep-periodic-block', '[data-smep-periodic-block]', page_context).forEach((block_element) => {
        block_instances.get(block_element)?.();
        block_instances.delete(block_element);
      });
    },
  };
})(Drupal, once);
