const preview_parameters = new URLSearchParams(window.location.search);
export const BUTTON_PREVIEW_STATE = preview_parameters.get('component_preview') === 'button-combinations' ? null : preview_parameters.get('preview_state');
export const BUTTON_COMBINATION_PREVIEW = preview_parameters.get('component_preview') === 'button-combinations';
export const BUTTON_COMPONENT_PREVIEW = preview_parameters.get('component_preview') === 'button' || BUTTON_COMBINATION_PREVIEW;

export function initialize_button_preview() {
  if (!BUTTON_COMPONENT_PREVIEW) return;
  const target_element = document.querySelector('#storybook-root > .button, #storybook-root > .button-combination-preview');
  if (!target_element) return;
  document.body.classList.add('button-component-preview');
  const parent_origin = preview_parameters.get('preview_parent');
  let parent_url;
  try { parent_url = new URL(parent_origin); } catch { return; }
  if (!['test.jurenites.local', 'localhost', '127.0.0.1'].includes(parent_url.hostname) || parent_url.protocol !== 'http:') return;
  const report_size = () => {
    const component_bounds = target_element.getBoundingClientRect();
    const preview_padding = parseFloat(getComputedStyle(document.querySelector('#storybook-root')).paddingLeft) || 0;
    window.parent.postMessage({ message_type: 'jurenites-storybook-preview', component_width: component_bounds.width + preview_padding * 2, component_height: component_bounds.height + preview_padding * 2 }, parent_url.origin);
  };
  new ResizeObserver(report_size).observe(target_element);
  void document.fonts.ready.then(report_size);
}
