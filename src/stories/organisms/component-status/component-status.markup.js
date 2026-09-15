import component_status_template from './component-status.template.html?raw';
import { escape_html, render_template } from '../../template.js';

export const STATUS_LABELS = { passed: 'Passed', failed: 'Failed', attention: 'Needs attention' };
export function component_status_markup({ component_rows = [] } = {}) {
  return render_template(component_status_template, {
    component_rows: component_rows.map((component_row) => {
      const overall_status = Object.hasOwn(STATUS_LABELS, component_row.overall_status) ? component_row.overall_status : 'attention';
      const has_results = component_row.checks?.some((check_result) => check_result.status !== 'not_checked');
      const status_label = has_results ? STATUS_LABELS[overall_status] : 'Not checked';
      return `<li class="component-status__item"><a class="component-status__link" href="#${escape_html(component_row.component_id)}" data-component-id="${escape_html(component_row.component_id)}"><span class="component-status__light component-status__light--${overall_status}" aria-hidden="true"></span><span class="component-status__name">${escape_html(component_row.component_name)}</span><span class="component-status__label">${status_label}</span></a></li>`;
    }).join(''),
  });
}
