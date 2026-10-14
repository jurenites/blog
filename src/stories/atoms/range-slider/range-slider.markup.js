import { escape_html } from '../../template.js';

export function range_slider_markup({ field_id, accessible_label, range_value = 0, range_min = 0, range_max = 100, range_step = 1, value_text = '', slider_orientation = 'horizontal', is_disabled = false }) {
  return `<input class="range-slider${slider_orientation === 'vertical' ? ' range-slider--vertical' : ''}" id="${escape_html(field_id)}" type="range" min="${range_min}" max="${range_max}" step="${range_step}" value="${range_value}" aria-label="${escape_html(accessible_label)}"${value_text ? ` aria-valuetext="${escape_html(value_text)}"` : ''}${is_disabled ? ' disabled' : ''}>`;
}
