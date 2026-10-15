import { browser_layout_preferences } from './layout-preferences.js';
import { comparison_evidence_markup } from './review-panel.js';
import { button_preview_url } from './storybook-preview.js';
import { initialize_tooltips } from '../slice/src/js/script.js';
import { icon_markup } from '../stories/atoms/icon/icon.markup.js';

// Public builds never connect workspace, upload or capture event handlers.
export function connect_public_review({ component_row }) {
  const review_element = document.querySelector('.visual-review');
  const public_message = 'Disabled for public use';
  const editing_controls = 'input, select, textarea, [data-source-settings], [data-upload-figma-png], [data-remove-figma-png], [data-obtain-figma-png], [data-upload-storybook-png], [data-remove-example], #website-add-example, button[type="submit"]';
  for (const control_element of review_element.querySelectorAll(editing_controls)) {
    control_element.disabled = true;
    control_element.setAttribute('aria-description', public_message);
    control_element.setAttribute('title', public_message);
    control_element.dataset.tooltipLabel = public_message;
    control_element.setAttribute('aria-describedby', 'public-dashboard-notice');
  }
  review_element.querySelector('form')?.addEventListener('submit', submit_event => submit_event.preventDefault());
  const capture_grid = review_element.querySelector('.visual-review__three-up');
  const layout_buttons = [...document.querySelectorAll('[data-comparison-layout]')];
  function apply_layout(layout_value) {
    capture_grid.dataset.comparisonLayout = layout_value;
    for (const layout_button of layout_buttons) layout_button.setAttribute('aria-pressed', String(layout_button.dataset.comparisonLayout === layout_value));
  }
  apply_layout(browser_layout_preferences.read_layout());
  for (const layout_button of layout_buttons) layout_button.addEventListener('click', () => {
    apply_layout(layout_button.dataset.comparisonLayout);
    browser_layout_preferences.save_layout(layout_button.dataset.comparisonLayout);
  });
  for (const toggle_button of review_element.querySelectorAll('[data-preview-source]')) {
    toggle_button.addEventListener('click', () => {
      const source_pane = toggle_button.closest('.visual-review__source-pane');
      const source_visible = toggle_button.getAttribute('aria-pressed') !== 'true';
      toggle_button.setAttribute('aria-pressed', String(source_visible));
      source_pane.querySelector('.visual-review__capture').hidden = !source_visible;
      toggle_button.querySelector('.visual-review__toggle-icon').outerHTML = icon_markup({ icon_name: source_visible ? 'eye' : 'eye-closed', class_name: 'visual-review__toggle-icon' });
    });
  }
  const story_frame = review_element.querySelector('.visual-review__story-frame');
  if (story_frame) {
    const story_reference = review_element.querySelector('[name="story_url"]').value;
    const preview_url = new URL(button_preview_url(story_reference, 'primary|false|default', window.location.origin));
    preview_url.searchParams.set('component_preview', 'button-combinations');
    preview_url.searchParams.delete('preview_state');
    story_frame.src = preview_url.href;
  }
  const selected_state = component_row.checks.find(check_row => check_row.check_key === 'integration')?.details?.visual_states?.[0];
  const evidence_panel = review_element.querySelector('#review-state-results');
  if (selected_state && evidence_panel) evidence_panel.innerHTML = comparison_evidence_markup(selected_state);
  initialize_tooltips(review_element);
  return () => {};
}
