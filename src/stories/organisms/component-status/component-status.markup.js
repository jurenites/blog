import component_status_template from './component-status.template.html?raw';
import { escape_html, render_template } from '../../template.js';

export const STATUS_LABELS = { passed: 'Passed', failed: 'Failed', attention: 'Needs attention' };
const ROOT_GROUP_ORDER = ['Foundations', 'Atoms', 'Molecules', 'Organisms', 'Components'];
const MOLECULE_GROUP_ORDER = ['Blog', 'Video'];

function component_item_markup(component_row) {
  const overall_status = Object.hasOwn(STATUS_LABELS, component_row.overall_status) ? component_row.overall_status : 'attention';
  const has_results = component_row.checks?.some((check_result) => !['not_checked', 'missing'].includes(check_result.status));
  const figma_missing = component_row.checks?.some((check_result) => check_result.check_key === 'figma' && check_result.status === 'missing');
  const status_label = `${has_results ? STATUS_LABELS[overall_status] : 'Not checked'}${figma_missing ? ' · Figma missing' : ''}`;
  return `<li class="component-status__item"><a class="component-status__link" href="#${escape_html(component_row.component_id)}" data-component-id="${escape_html(component_row.component_id)}"><span class="component-status__name">${escape_html(component_row.component_name)}</span><span class="component-status__label">${status_label}</span><span class="component-status__light component-status__light--${overall_status}" aria-hidden="true"></span></a></li>`;
}

function group_list_markup(group_node, group_path = '') {
  const group_order = group_path === '' ? ROOT_GROUP_ORDER : group_path === 'Molecules' ? MOLECULE_GROUP_ORDER : [];
  const group_rank = (group_name) => group_order.includes(group_name) ? group_order.indexOf(group_name) : group_order.length;
  const group_markup = [...group_node.child_groups.entries()]
    .sort(([first_name], [second_name]) => group_rank(first_name) - group_rank(second_name) || first_name.localeCompare(second_name))
    .map(([group_name, child_group]) => {
      const child_path = group_path ? `${group_path}/${group_name}` : group_name;
      return `<li class="component-status__group"><details class="component-status__folder" open><summary class="component-status__group-heading">${escape_html(group_name)}</summary><ul class="component-status__grid component-status__grid--nested" aria-label="${escape_html(child_path)}">${group_list_markup(child_group, child_path)}</ul></details></li>`;
    }).join('');
  return group_markup + group_node.component_rows.map(component_item_markup).join('');
}

export function component_status_markup({ component_rows = [] } = {}) {
  const root_group = { child_groups: new Map(), component_rows: [] };
  for (const component_row of component_rows) {
    let current_group = root_group;
    for (const group_name of (component_row.component_group ?? '').split('/').map((group_name) => group_name.trim()).filter(Boolean)) {
      if (!current_group.child_groups.has(group_name)) current_group.child_groups.set(group_name, { child_groups: new Map(), component_rows: [] });
      current_group = current_group.child_groups.get(group_name);
    }
    current_group.component_rows.push(component_row);
  }
  return render_template(component_status_template, { component_rows: group_list_markup(root_group) });
}
