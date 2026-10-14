import component_status_template from './component-status.template.html?raw';
import { escape_html, render_template } from '../../template.js';
import { icon_markup } from '../../atoms/icon/icon.markup.js';
import { button_markup } from '../../atoms/button/button.markup.js';
import { component_variant_count, component_source_states } from './component-status.data.js';

export function source_link_markup({ link_label, link_url, link_id = '', icon_class_names = '' }) {
  return `<a class="component-status__source-link"${link_id ? ` id="${escape_html(link_id)}"` : ''}${link_url ? ` href="${escape_html(link_url)}"` : ' hidden'} target="_blank" rel="noopener"><span>${escape_html(link_label)}</span>${icon_markup({ icon_name: 'external-link', class_name: `component-status__source-icon ${icon_class_names}` })}</a>`;
}

export const STATUS_LABELS = { passed: 'Passed', failed: 'Failed', attention: 'Needs attention' };
const ROOT_GROUP_ORDER = ['Foundations', 'Atoms', 'Molecules', 'Organisms', 'Components', 'Pages'];
const MOLECULE_GROUP_ORDER = ['Blog', 'Video'];

function component_item_markup(component_row) {
  const variant_count = component_variant_count(component_row);
  const source_states = component_source_states(component_row);
  const source_markup = source_states.map(({ source_key, source_label, icon_name, status_key, status_label }) => `<span class="component-status__source-status component-status__source-status--${status_key}" data-source="${source_key}" role="img" aria-label="${source_label}: ${status_label}" title="${source_label}: ${status_label}">${icon_markup({ icon_name, class_name: 'component-status__status-icon' })}</span>`).join('');
  const count_markup = component_row.history_target ? '' : `&nbsp;<span class="component-status__variant-count">(${variant_count})</span>`;
  const row_description = component_row.history_target ? 'Saved milestones' : `${variant_count} ${variant_count === 1 ? 'variant' : 'variants'}. ${source_states.map(({ source_label, status_label }) => `${source_label}: ${status_label}`).join('. ')}`;
  return `<li class="component-status__item"><a class="component-status__link" href="#${escape_html(component_row.component_id)}" data-component-id="${escape_html(component_row.component_id)}" aria-label="${escape_html(component_row.component_name)}. ${row_description}" title="${row_description}"><span class="component-status__name">${escape_html(component_row.component_name)}${count_markup}</span>${component_row.history_target ? '<span class="component-status__label">Saved milestones</span>' : `<span class="component-status__sources">${source_markup}</span>`}</a></li>`;
}

function group_list_markup(group_node, group_path = '', collapsible_groups = true, collapsed_groups = new Set()) {
  const group_order = group_path === '' ? ROOT_GROUP_ORDER : group_path === 'Molecules' ? MOLECULE_GROUP_ORDER : [];
  const group_rank = (group_name) => group_order.includes(group_name) ? group_order.indexOf(group_name) : group_order.length;
  const group_markup = [...group_node.child_groups.entries()]
    .sort(([first_name], [second_name]) => group_rank(first_name) - group_rank(second_name) || first_name.localeCompare(second_name))
    .map(([group_name, child_group]) => {
      const child_path = group_path ? `${group_path}/${group_name}` : group_name;
      const group_list_id = `component-group-${encodeURIComponent(child_path)}`;
      const group_collapsed = collapsible_groups && collapsed_groups.has(child_path);
      const group_heading = collapsible_groups ? button_markup({
        button_label: group_name,
        button_type: 'button',
        style_variant: 'ghost',
        additional_class_names: 'component-status__group-toggle',
        button_icon_markup: icon_markup({ icon_name: 'chevron-down', class_name: 'component-status__group-chevron' }),
      }).replace('<button', `<button data-group-path="${escape_html(child_path)}" aria-expanded="${!group_collapsed}" aria-controls="${group_list_id}"`) : escape_html(group_name);
      return `<li class="component-status__group"><h3 class="component-status__group-heading">${group_heading}</h3><ul id="${group_list_id}" class="component-status__grid component-status__grid--nested" aria-label="${escape_html(child_path)}"${group_collapsed ? ' hidden' : ''}>${group_list_markup(child_group, child_path, collapsible_groups, collapsed_groups)}</ul></li>`;
    }).join('');
  return group_markup + group_node.component_rows.map(component_item_markup).join('');
}

export function component_status_markup({ component_rows = [], collapsible_groups = true, collapsed_groups = new Set() } = {}) {
  const root_group = { child_groups: new Map(), component_rows: [] };
  for (const component_row of component_rows) {
    let current_group = root_group;
    for (const group_name of (component_row.component_group ?? '').split('/').map((group_name) => group_name.trim()).filter(Boolean)) {
      if (!current_group.child_groups.has(group_name)) current_group.child_groups.set(group_name, { child_groups: new Map(), component_rows: [] });
      current_group = current_group.child_groups.get(group_name);
    }
    current_group.component_rows.push(component_row);
  }
  return render_template(component_status_template, { component_rows: group_list_markup(root_group, '', collapsible_groups, collapsed_groups) });
}

export function connect_component_groups(root_element, collapsed_groups = new Set()) {
  for (const toggle_button of root_element.querySelectorAll('.component-status__group-toggle')) {
    toggle_button.addEventListener('click', () => {
      const group_list = toggle_button.closest('.component-status__group').querySelector(':scope > ul');
      const group_collapsed = toggle_button.getAttribute('aria-expanded') === 'true';
      toggle_button.setAttribute('aria-expanded', String(!group_collapsed));
      group_list.hidden = group_collapsed;
      if (group_collapsed) collapsed_groups.add(toggle_button.dataset.groupPath);
      else collapsed_groups.delete(toggle_button.dataset.groupPath);
    });
  }
}
