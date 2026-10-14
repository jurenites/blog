import { button_markup } from '../stories/atoms/button/button.markup.js';
import { icon_button_markup } from '../stories/atoms/icon-button/icon-button.markup.js';
import { icon_markup } from '../stories/atoms/icon/icon.markup.js';
import { status_mark_markup, REVIEW_STATUS_LABELS } from './status-mark.js';
import { checkbox_markup } from '../stories/atoms/checkbox/checkbox.markup.js';
import { button_combination_status, matrix_preferences } from './button-coverage.js';
import { BUTTON_DIMENSIONS, combination_values, combination_key_from, combination_label, combination_list, swap_matrix_axis } from './button-combinations.js';
export { button_combination_status, matrix_preferences } from './button-coverage.js';

function matrix_depth_values(matrix_state) {
  return matrix_state.dimension_orders[matrix_state.axis_roles.depth_axis];
}
function header_markup(axis_name, dimension_name, dimension_value, is_ghost) {
  const header_role = axis_name === 'row_axis' ? 'row' : 'column';
  const drag_handle = is_ghost ? '' : icon_button_markup({ button_accessible_label: `Reorder ${dimension_value} ${header_role}; drag or use Alt and arrow keys`, style_variant: 'ghost', additional_class_names: 'button-matrix__drag-handle', button_icon_markup: icon_markup({ icon_name: 'equal-sign', class_name: 'button-matrix__drag-icon' }) }).replace('<button', '<button draggable="true"');
  return `<th class="button-matrix__dimension-heading" scope="${header_role === 'row' ? 'row' : 'col'}"${is_ghost ? '' : ` draggable="true" data-table-dimension="${dimension_name}" data-table-value="${dimension_value}" tabindex="0" aria-label="${dimension_value}; drag to reorder, or use Alt and arrow keys"`}>${drag_handle}<code>${dimension_value}</code></th>`;
}
function matrix_plane_markup(component_row, matrix_state, depth_value, is_ghost = false, plane_tools = '') {
  const { row_axis, column_axis, depth_axis } = matrix_state.axis_roles;
  const visible_values = dimension_name => matrix_state.dimension_orders[dimension_name].filter(dimension_value => !(matrix_state.hidden_values[dimension_name] ?? []).includes(dimension_value));
  const column_values = visible_values(column_axis);
  const row_values = visible_values(row_axis);
  const table_rows = row_values.map(row_value => `<tr>${header_markup('row_axis', row_axis, row_value, is_ghost)}${column_values.map(column_value => {
    const dimension_values = { [row_axis]: row_value, [column_axis]: column_value, [depth_axis]: depth_value };
    const combination_key = combination_key_from(dimension_values);
    const coverage_status = button_combination_status(component_row, dimension_values.button_style, dimension_values.is_disabled === 'true', dimension_values.pointer_state, matrix_state.rule_overrides);
    const cell_label = `${combination_label(combination_key)}: ${REVIEW_STATUS_LABELS[coverage_status]}`;
    const cell_marker = status_mark_markup(coverage_status, cell_label);
    return `<td>${is_ghost ? cell_marker : icon_button_markup({ button_accessible_label: cell_label, style_variant: 'ghost', additional_class_names: 'button-matrix__cell', button_icon_markup: `<span class="icon button-matrix__status-icon" aria-hidden="true">${cell_marker}</span>` }).replace('<button', `<button data-combination-key="${combination_key}" aria-pressed="${matrix_state.active_combination === combination_key}"`)}</td>`;
  }).join('')}</tr>`).join('');
  return `<div class="button-matrix__plane button-matrix__plane--${is_ghost ? 'ghost' : 'active'}" data-depth-value="${depth_value}"${is_ghost ? ' aria-hidden="true" inert' : ''}>${is_ghost ? '<div></div>' : '<div class="button-matrix__data-controls"><h3 id="button-matrix-heading">Combination coverage</h3><div data-review-controls></div></div>'}<div class="button-matrix__table-viewport"><table><caption><code>${depth_axis}: ${depth_value}</code></caption><thead><tr><th scope="col"><code>${row_axis} / ${column_axis}</code></th>${column_values.map(column_value => header_markup('column_axis', column_axis, column_value, is_ghost)).join('')}</tr></thead><tbody>${table_rows}</tbody></table>${!row_values.length || !column_values.length ? '<p>Enable rows and columns in Table layout.</p>' : ''}</div>${is_ghost ? '<div></div>' : `<div class="button-matrix__plane-tools">${plane_tools}</div>`}</div>`;
}
export function button_matrix_markup(component_row, saved_state = {}) {
  const matrix_state = matrix_preferences(saved_state);
  const depth_values = matrix_depth_values(matrix_state);
  const depth_index = Math.min(matrix_state.depth_index, depth_values.length - 1);
  const layout_controls = (dimension_name, role_name) => matrix_state.dimension_orders[dimension_name].map((dimension_value, value_index) => `<li draggable="true" data-table-dimension="${dimension_name}" data-table-value="${dimension_value}">${checkbox_markup({ field_id: `matrix-${dimension_name}-${dimension_value}`, field_name: `matrix_${dimension_name}`, field_value: dimension_value, accessible_label: `Show ${dimension_value} ${role_name}`, checkbox_state: (matrix_state.hidden_values[dimension_name] ?? []).includes(dimension_value) ? 'empty' : 'filled' })}<code>${dimension_value}</code><div class="button-matrix__move-controls">${icon_button_markup({ button_accessible_label: `Move ${dimension_value} earlier`, style_variant: 'ghost', is_disabled: value_index === 0, button_icon_markup: icon_markup({ icon_name: 'arrow-left' }) }).replace('<button', '<button data-move-value="-1"')}${icon_button_markup({ button_accessible_label: `Move ${dimension_value} later`, style_variant: 'ghost', is_disabled: value_index === matrix_state.dimension_orders[dimension_name].length - 1, button_icon_markup: icon_markup({ icon_name: 'arrow-right' }) }).replace('<button', '<button data-move-value="1"')}</div></li>`).join('');
  const plane_tools = `<div class="button-matrix__legend">${['passed', 'missing', 'stale', 'failed', 'forbidden'].map(status_key => `<span>${status_mark_markup(status_key)}${REVIEW_STATUS_LABELS[status_key]}</span>`).join('')}</div><aside class="button-matrix__rule" data-matrix-rule hidden aria-live="polite"></aside><details class="button-matrix__layout" data-workspace-details="matrix-layout"><summary>Table layout</summary><div class="button-matrix__axes">${Object.entries(matrix_state.axis_roles).map(([axis_name, dimension_name]) => `<label>${axis_name === 'row_axis' ? 'Y · Rows' : axis_name === 'column_axis' ? 'X · Columns' : 'Z · Tables'}<select data-matrix-axis="${axis_name}" aria-label="${axis_name}">${Object.keys(BUTTON_DIMENSIONS).map(option_name => `<option value="${option_name}"${option_name === dimension_name ? ' selected' : ''}>${option_name}</option>`).join('')}</select></label>`).join('')}</div><p class="status-dashboard__meta">Drag table headers to reorder. Alt + arrow keys also move a focused header.</p><div class="button-matrix__layout-grid">${['row_axis', 'column_axis'].map(axis_name => `<fieldset><legend><code>${matrix_state.axis_roles[axis_name]}</code> ${axis_name === 'row_axis' ? 'rows' : 'columns'}</legend><ul>${layout_controls(matrix_state.axis_roles[axis_name], axis_name === 'row_axis' ? 'row' : 'column')}</ul></fieldset>`).join('')}</div></details>`;
  return `<section class="button-matrix" aria-labelledby="button-matrix-heading"><div class="button-matrix__stack" role="region" aria-label="Stacked combination slices" tabindex="0">${matrix_plane_markup(component_row, matrix_state, depth_values[(depth_index + 1) % depth_values.length], true)}${matrix_plane_markup(component_row, matrix_state, depth_values[depth_index], false, plane_tools)}</div></section>`;
}
export function connect_button_matrix({ component_row, saved_state = {}, save_settings }) {
  let matrix_state = matrix_preferences(saved_state);
  let matrix_element = document.querySelector('.button-matrix');
  const review_element = matrix_element.closest('.visual-review');
  let dragged_value = '';
  let dragged_dimension = '';
  function save_matrix() { save_settings({ matrix_state }); }
  function notify_combination(combination_key) {
    matrix_state.active_combination = combination_key;
    review_element.dispatchEvent(new CustomEvent('button-combination-selected', { detail: { combination_key } }));
  }
  function notify_list() { review_element.dispatchEvent(new CustomEvent('button-combination-list', { detail: { combination_keys: combination_list(matrix_state), active_combination: matrix_state.active_combination } })); }
  function render_matrix() {
    const layout_open = matrix_element.querySelector('.button-matrix__layout').open;
    const data_controls = matrix_element.querySelector('.button-matrix__data-controls');
    matrix_element.outerHTML = button_matrix_markup(component_row, matrix_state);
    matrix_element = review_element.querySelector('.button-matrix');
    matrix_element.querySelector('.button-matrix__data-controls').replaceWith(data_controls);
    matrix_element.querySelector('.button-matrix__layout').open = layout_open;
    connect_events();
    notify_list();
    save_matrix();
  }
  function show_rule(combination_key) {
    matrix_state.selected_combination = combination_key;
    const dimension_values = combination_values(combination_key);
    const default_allowed = !(dimension_values.is_disabled === 'true' && dimension_values.pointer_state === 'hover');
    const is_allowed = matrix_state.rule_overrides[combination_key] ?? default_allowed;
    const rule_panel = matrix_element.querySelector('[data-matrix-rule]');
    rule_panel.hidden = false;
    rule_panel.innerHTML = `<div class="button-matrix__rule-heading"><code>${combination_label(combination_key)}</code>${icon_button_markup({ button_accessible_label: 'Close combination rule', style_variant: 'ghost', button_icon_markup: icon_markup({ icon_name: 'cross-big' }) }).replace('<button', '<button data-close-rule')}</div>${checkbox_markup({ field_id: 'matrix-rule-allowed', field_name: 'matrix_rule_allowed', field_label: 'Include this combination in the test table', checkbox_state: is_allowed ? 'filled' : 'empty' })}<p>${Object.hasOwn(matrix_state.rule_overrides, combination_key) ? 'Your table rule overrides the default.' : default_allowed ? 'Default rule: this combination can be tested.' : 'Default rule: native disabled buttons do not react to hover.'} Table rules do not change component behavior or test evidence.</p>${button_markup({ button_label: 'Use default rule', button_type: 'button', style_variant: 'secondary' }).replace('<button', '<button data-reset-rule')}`;
    rule_panel.querySelector('[data-close-rule]').addEventListener('click', () => { matrix_state.selected_combination = ''; rule_panel.hidden = true; save_matrix(); });
    rule_panel.querySelector('input').addEventListener('change', change_event => { matrix_state.rule_overrides[combination_key] = change_event.target.checked; render_matrix(); show_rule(combination_key); });
    rule_panel.querySelector('[data-reset-rule]').addEventListener('click', () => { delete matrix_state.rule_overrides[combination_key]; render_matrix(); show_rule(combination_key); });
    save_matrix();
  }
  function reorder_dimension(dimension_name, source_value, destination_value) {
    const dimension_order = [...matrix_state.dimension_orders[dimension_name]];
    const source_index = dimension_order.indexOf(source_value);
    const destination_index = dimension_order.indexOf(destination_value);
    if (source_index < 0 || destination_index < 0 || source_index === destination_index) return;
    dimension_order.splice(source_index, 1); dimension_order.splice(destination_index, 0, source_value);
    matrix_state.dimension_orders[dimension_name] = dimension_order;
    render_matrix();
  }
  function update_depth(depth_index) {
    const previous_index = matrix_state.depth_index;
    matrix_state.depth_index = depth_index;
    const depth_values = matrix_depth_values(matrix_state);
    const stack_element = matrix_element.querySelector('.button-matrix__stack');
    const previous_plane = stack_element.querySelector('.button-matrix__plane--active');
    const previous_value = previous_plane?.dataset.depthValue;
    if (previous_value !== depth_values[depth_index]) {
      stack_element.querySelector('.button-matrix__plane--ghost').outerHTML = matrix_plane_markup(component_row, matrix_state, previous_value ?? depth_values[(depth_index + 1) % depth_values.length], true);
      const incoming_template = document.createElement('template');
      incoming_template.innerHTML = matrix_plane_markup(component_row, matrix_state, depth_values[depth_index]);
      previous_plane.dataset.depthValue = depth_values[depth_index];
      previous_plane.querySelector('.button-matrix__table-viewport').innerHTML = incoming_template.content.querySelector('.button-matrix__table-viewport').innerHTML;
      stack_element.classList.remove('is-switching');
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        stack_element.dataset.sliceDirection = depth_index > previous_index ? 'forward' : 'backward';
        stack_element.classList.remove('is-switching'); void stack_element.offsetWidth; stack_element.classList.add('is-switching');
      }
      stack_element.querySelector('.button-matrix__plane--active .button-matrix__table-viewport').addEventListener('animationend', () => { stack_element.classList.remove('is-switching'); stack_element.querySelector('.button-matrix__plane--ghost').outerHTML = matrix_plane_markup(component_row, matrix_state, depth_values[(depth_index + 1) % depth_values.length], true); }, { once: true });
      connect_table();
    }
    for (const cell_button of matrix_element.querySelectorAll('[data-combination-key]')) cell_button.setAttribute('aria-pressed', String(cell_button.dataset.combinationKey === matrix_state.active_combination));
    save_matrix();
  }
  function connect_drag(dimension_element) {
    const dimension_name = dimension_element.dataset.tableDimension;
    const dimension_value = dimension_element.dataset.tableValue;
    dimension_element.addEventListener('dragstart', drag_event => { dragged_dimension = dimension_name; dragged_value = dimension_value; drag_event.dataTransfer.setData('text/plain', dimension_value); });
    dimension_element.addEventListener('dragover', drag_event => { if (dragged_dimension === dimension_name) { drag_event.preventDefault(); dimension_element.classList.add('is-drop-target'); } });
    dimension_element.addEventListener('dragleave', () => dimension_element.classList.remove('is-drop-target'));
    dimension_element.addEventListener('drop', drop_event => { drop_event.preventDefault(); if (dragged_dimension === dimension_name) reorder_dimension(dimension_name, dragged_value, dimension_value); });
    dimension_element.addEventListener('keydown', key_event => {
      if (!key_event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(key_event.key)) return;
      key_event.preventDefault();
      const value_order = matrix_state.dimension_orders[dimension_name];
      const target_value = value_order[value_order.indexOf(dimension_value) + (['ArrowLeft', 'ArrowUp'].includes(key_event.key) ? -1 : 1)];
      if (target_value) { reorder_dimension(dimension_name, dimension_value, target_value); matrix_element.querySelector(`th[data-table-dimension="${dimension_name}"][data-table-value="${dimension_value}"]`)?.focus(); }
    });
  }
  function connect_table() {
    for (const cell_button of matrix_element.querySelectorAll('[data-combination-key]')) cell_button.addEventListener('click', () => { notify_combination(cell_button.dataset.combinationKey); show_rule(cell_button.dataset.combinationKey); });
    for (const header_element of matrix_element.querySelectorAll('th[data-table-dimension]')) connect_drag(header_element);
  }
  function connect_events() {
    for (const axis_control of matrix_element.querySelectorAll('[data-matrix-axis]')) axis_control.addEventListener('change', change_event => {
      matrix_state.axis_roles = swap_matrix_axis(matrix_state.axis_roles, change_event.target.dataset.matrixAxis, change_event.target.value);
      const depth_value = combination_values(matrix_state.active_combination || combination_list(matrix_state)[0])[matrix_state.axis_roles.depth_axis];
      matrix_state.depth_index = matrix_depth_values(matrix_state).indexOf(depth_value);
      render_matrix();
    });
    for (const dimension_row of matrix_element.querySelectorAll('li[data-table-dimension]')) {
      const dimension_name = dimension_row.dataset.tableDimension;
      const dimension_value = dimension_row.dataset.tableValue;
      connect_drag(dimension_row);
      dimension_row.querySelector('input').addEventListener('change', change_event => { const hidden_values = matrix_state.hidden_values[dimension_name] ?? []; matrix_state.hidden_values[dimension_name] = change_event.target.checked ? hidden_values.filter(value_name => value_name !== dimension_value) : [...hidden_values, dimension_value]; render_matrix(); });
      for (const move_button of dimension_row.querySelectorAll('[data-move-value]')) move_button.addEventListener('click', () => { const value_order = matrix_state.dimension_orders[dimension_name]; reorder_dimension(dimension_name, dimension_value, value_order[value_order.indexOf(dimension_value) + Number(move_button.dataset.moveValue)]); });
    }
    connect_table();
  }
  review_element.addEventListener('recorded-state-selected', selection_event => {
    matrix_state.active_combination = selection_event.detail.combination_key;
    const selected_values = combination_values(matrix_state.active_combination);
    let reveal_values = false;
    for (const dimension_name of Object.values(matrix_state.axis_roles)) { const hidden_values = matrix_state.hidden_values[dimension_name] ?? []; if (hidden_values.includes(selected_values[dimension_name])) { matrix_state.hidden_values[dimension_name] = hidden_values.filter(value_name => value_name !== selected_values[dimension_name]); reveal_values = true; } }
    if (reveal_values) render_matrix();
    matrix_state.selected_combination = ''; matrix_element.querySelector('[data-matrix-rule]').hidden = true;
    if (matrix_state.active_combination) update_depth(matrix_depth_values(matrix_state).indexOf(combination_values(matrix_state.active_combination)[matrix_state.axis_roles.depth_axis]));
    notify_list();
  });
  connect_events();
  return { combination_keys: () => combination_list(matrix_state) };
}
