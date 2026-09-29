import { crossfade_dot_markup } from '../../atoms/crossfade-dot/crossfade-dot.markup.js';
import { escape_html } from '../../template.js';

export function square_pagination_markup({ page_labels, pagination_label }) {
  return `<div class="square-pagination" data-slider-pagination role="group" aria-label="${escape_html(pagination_label)}">${page_labels.map((page_label, page_index) => crossfade_dot_markup({ dot_label: page_label, is_active: page_index === 0 }).replace('class="crossfade-dot', 'class="crossfade-dot square-pagination__dot').replace('type="button"', `type="button" data-slider-dot="${page_index}" data-dot-distance="${Math.min(4, page_index)}"${page_labels.length > 10 && page_index >= 9 ? ' hidden' : ''}`)).join('')}</div>`;
}
