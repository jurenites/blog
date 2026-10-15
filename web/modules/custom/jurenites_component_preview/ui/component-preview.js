const preview_parameters = new URLSearchParams(window.location.search);
const component_selector = preview_parameters.get('jurenites_component_preview');
const preview_identifier = preview_parameters.get('jurenites_preview_id');

function initialize_component_preview() {
  document.documentElement.classList.add('jurenites-component-preview');
  let component_matches;
  try { component_matches = component_selector && component_selector.length <= 1000 ? document.querySelectorAll(component_selector) : []; } catch { component_matches = []; }
  const target_element = component_matches.length === 1 ? component_matches[0] : null;
  if (!target_element || target_element === document.body || target_element === document.documentElement) {
    document.body.replaceChildren();
    const message_element = document.createElement('p');
    message_element.className = 'component-preview__message';
    message_element.textContent = 'The selector must match exactly one component.';
    document.body.append(message_element);
    window.parent.postMessage({ message_type: 'jurenites-component-preview', preview_identifier, error_message: message_element.textContent }, 'http://test.jurenites.local');
    return;
  }
  target_element.setAttribute('data-component-preview-target', '');
  function isolate_component() {
    let ancestor_element = target_element;
    while (ancestor_element.parentElement && ancestor_element.parentElement !== document.documentElement) {
      const parent_element = ancestor_element.parentElement;
      for (const sibling_element of parent_element.children) {
        if (sibling_element !== ancestor_element && !['SCRIPT', 'STYLE', 'LINK'].includes(sibling_element.tagName)) sibling_element.setAttribute('data-component-preview-hidden', '');
      }
      if (parent_element !== document.body) parent_element.setAttribute('data-component-preview-ancestor', '');
      ancestor_element = parent_element;
    }
  }
  isolate_component();
  // Keep later page additions (cookie notices, tooltips, loaders) from exposing
  // unrelated page content. The actual component subtree retains its behavior.
  const preview_observer = new MutationObserver(isolate_component);
  preview_observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', click_event => {
    const source_link = click_event.target instanceof Element ? click_event.target.closest('a[href]') : null;
    if (!source_link || !target_element.contains(source_link) || !['http:', 'https:'].includes(new URL(source_link.href).protocol)) return;
    click_event.preventDefault();
    window.open(source_link.href, '_blank', 'noopener');
  });
  function report_component_size() {
    const component_bounds = target_element.getBoundingClientRect();
    window.parent.postMessage({ message_type: 'jurenites-component-preview', preview_identifier, component_width: Math.ceil(component_bounds.width), component_height: Math.ceil(component_bounds.height) }, 'http://test.jurenites.local');
  }
  new ResizeObserver(report_component_size).observe(target_element);
  void document.fonts.ready.then(report_component_size);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize_component_preview, { once: true });
else initialize_component_preview();
