export const BUTTON_DIMENSIONS = {
  button_style: ['primary', 'secondary', 'text'],
  is_disabled: ['false', 'true'],
  pointer_state: ['default', 'hover', 'focus', 'active'],
};
export const DEFAULT_AXES = { row_axis: 'button_style', column_axis: 'pointer_state', depth_axis: 'is_disabled' };

export function combination_values(combination_key) {
  const [button_style, is_disabled, pointer_state] = combination_key.split('|');
  return { button_style, is_disabled, pointer_state };
}
export function combination_key_from(dimension_values) {
  return `${dimension_values.button_style}|${dimension_values.is_disabled}|${dimension_values.pointer_state}`;
}
export function combination_label(combination_key) {
  const dimension_values = combination_values(combination_key);
  return `${dimension_values.button_style} · is_disabled: ${dimension_values.is_disabled} · ${dimension_values.pointer_state}`;
}
export function matrix_axes(saved_axes = {}) {
  const axis_values = ['row_axis', 'column_axis', 'depth_axis'].map(axis_name => saved_axes[axis_name]);
  return axis_values.every(axis_value => Object.hasOwn(BUTTON_DIMENSIONS, axis_value)) && new Set(axis_values).size === 3 ? { ...saved_axes } : { ...DEFAULT_AXES };
}
export function ordered_dimensions(saved_state = {}) {
  return Object.fromEntries(Object.entries(BUTTON_DIMENSIONS).map(([dimension_name, default_order]) => {
    const legacy_order = dimension_name === 'button_style' ? saved_state.row_order : dimension_name === 'pointer_state' ? saved_state.column_order : undefined;
    const saved_order = saved_state.dimension_orders?.[dimension_name] ?? legacy_order ?? [];
    return [dimension_name, [...new Set([...saved_order.filter(dimension_value => default_order.includes(dimension_value)), ...default_order])]];
  }));
}
export function combination_list(saved_state = {}) {
  const axis_roles = matrix_axes(saved_state.axis_roles);
  const dimension_orders = ordered_dimensions(saved_state);
  return dimension_orders[axis_roles.depth_axis].flatMap(depth_value => dimension_orders[axis_roles.row_axis].flatMap(row_value => dimension_orders[axis_roles.column_axis].map(column_value => combination_key_from({ [axis_roles.depth_axis]: depth_value, [axis_roles.row_axis]: row_value, [axis_roles.column_axis]: column_value }))));
}
export function swap_matrix_axis(axis_roles, axis_name, dimension_name) {
  const current_axes = matrix_axes(axis_roles);
  const previous_role = Object.keys(DEFAULT_AXES).find(role_name => current_axes[role_name] === dimension_name);
  return { ...current_axes, [axis_name]: dimension_name, [previous_role]: current_axes[axis_name] };
}
