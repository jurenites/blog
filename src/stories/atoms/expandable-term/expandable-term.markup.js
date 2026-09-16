import { escape_html } from '../../template.js';

export function expandable_term_markup({ term_label, explanation_text, explanation_markup }) {
  return `<span class="expandable-term"><span class="expandable-term__label">${escape_html(term_label)}</span><span class="expandable-term__explanation">${explanation_markup ?? escape_html(explanation_text)}</span></span>`;
}
