import { numeric_value_tile_markup } from '../numeric-values/numeric-values.markup.js';
import { escape_html } from '../../template.js';

let slider_sequence = 0;
export function role_slider_markup({ role_items }) {
  const slider_id = `role-preview-${++slider_sequence}`;
  const story_items = role_items.map((role_item, item_index) => ({
    ...role_item, button_id: `${slider_id}-tab-${item_index}`, panel_id: `${slider_id}-panel-${item_index}`,
  }));
  return `<section class="role-slider" data-role-slider aria-label="Professional roles">
    <ul class="numeric-values__grid role-slider__tiles" aria-label="Choose a role">${story_items.map((role_item) => numeric_value_tile_markup({
      ...role_item, role_selector: role_item,
    })).join('')}</ul>
    <div class="role-slider__panels">${story_items.map((role_item) => `<section class="role-slider__panel" id="${role_item.panel_id}" aria-labelledby="${role_item.button_id}"><h2 class="role-slider__heading">${escape_html(role_item.role_heading)}</h2><div class="role-slider__story">${role_item.story_markup ?? `<p>${escape_html(role_item.story_text)}</p>`}</div></section>`).join('')}</div>
  </section>`;
}
