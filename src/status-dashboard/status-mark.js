import { escape_html } from '../stories/template.js';

export const REVIEW_STATUS_LABELS = {
  passed: 'Passed', failed: 'Failed', missing: 'Untested', not_checked: 'Untested',
  blocked: 'Incomplete', attention: 'Needs attention', stale: 'Stale', forbidden: 'Excluded',
};

export function status_mark_markup(status_key, accessible_label = '') {
  const normalized_status = Object.hasOwn(REVIEW_STATUS_LABELS, status_key) ? status_key : 'missing';
  const status_label = accessible_label || REVIEW_STATUS_LABELS[normalized_status];
  return `<span class="testing-status__mark testing-status__mark--${normalized_status}" role="img" aria-label="${escape_html(status_label)}" title="${escape_html(status_label)}"></span>`;
}

export function status_label_markup(status_key) {
  const normalized_status = Object.hasOwn(REVIEW_STATUS_LABELS, status_key) ? status_key : 'missing';
  return `<span class="testing-status__label">${status_mark_markup(normalized_status)}<span>${REVIEW_STATUS_LABELS[normalized_status]}</span></span>`;
}
