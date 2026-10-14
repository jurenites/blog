import { matrix_axes, ordered_dimensions } from './button-combinations.js';
export function button_combination_status(component_row, button_style, is_disabled, pointer_state, rule_overrides = {}) {
  const combination_key = `${button_style}|${is_disabled}|${pointer_state}`;
  const is_allowed = rule_overrides[combination_key] ?? !(is_disabled && pointer_state === 'hover');
  if (!is_allowed) return 'forbidden';
  const capture_check = component_row.checks?.find(check_item => check_item.check_key === 'storybook');
  const comparison_check = component_row.checks?.find(check_item => check_item.check_key === 'integration');
  const capture_rows = Array.isArray(capture_check?.details) ? capture_check.details : [];
  const matching_capture = capture_rows.find(capture_row => {
    if (capture_row.state_key !== pointer_state || capture_row.status !== 'passed' || !capture_row.page_url) return false;
    const story_parameters = new URL(capture_row.page_url, 'http://localhost').searchParams;
    if (story_parameters.get('id') !== 'atoms-button--default-story') return false;
    const story_args = Object.fromEntries((story_parameters.get('args') ?? '').split(';').filter(Boolean).map(argument_pair => {
      const split_index = argument_pair.indexOf(':');
      return [argument_pair.slice(0, split_index), argument_pair.slice(split_index + 1)];
    }));
    const recorded_style = story_args.button_style ?? story_args.style_variant ?? 'primary';
    return (recorded_style === 'ghost' ? 'text' : recorded_style) === button_style && (story_args.is_disabled === 'true') === is_disabled;
  });
  if (!matching_capture) return 'missing';
  if (capture_check.is_stale || comparison_check?.is_stale) return 'stale';
  const expected_key = `${button_style}|${is_disabled}|${pointer_state}`;
  const comparison_rows = comparison_check?.details?.visual_states?.filter(state_row => {
    if (state_row.state_key !== pointer_state) return false;
    const recorded_key = recorded_button_combination(component_row, state_row);
    return recorded_key ? recorded_key === expected_key : !state_row.images && capture_rows.filter(capture_row => capture_row.state_key === pointer_state && capture_row.status === 'passed').length === 1;
  }) ?? [];
  const implementation_results = comparison_rows.flatMap(state_row => state_row.comparisons.filter(pair_row => pair_row.pair_name === 'implementation'));
  if (implementation_results.some(pair_row => pair_row.status === 'failed')) return 'failed';
  return implementation_results.length && implementation_results.every(pair_row => pair_row.status === 'passed') ? 'passed' : 'missing';
}

export function matrix_preferences(saved_state = {}) {
  return {
    axis_roles: matrix_axes(saved_state.axis_roles),
    dimension_orders: ordered_dimensions(saved_state),
    hidden_values: saved_state.hidden_values ?? { button_style: saved_state.hidden_rows ?? [], pointer_state: saved_state.hidden_columns ?? [], is_disabled: [] },
    column_order: saved_state.column_order ?? ['default', 'hover'],
    row_order: saved_state.row_order ?? ['primary', 'secondary', 'text'],
    hidden_columns: saved_state.hidden_columns ?? [],
    hidden_rows: saved_state.hidden_rows ?? [],
    depth_index: saved_state.depth_index ?? 0,
    selected_combination: saved_state.selected_combination ?? '',
    active_combination: saved_state.active_combination ?? '',
    rule_overrides: saved_state.rule_overrides ?? {},
  };
}


// Match the actual captured story URL by image path, never today's editable args.
export function recorded_story_url(component_row, state_row) {
  const capture_rows = component_row.checks?.find(check_row => check_row.check_key === 'storybook')?.details;
  const capture_row = Array.isArray(capture_rows) ? capture_rows.find(capture_item => capture_item.image_path && capture_item.image_path === state_row.images?.storybook) : undefined;
  return state_row.story_url ?? capture_row?.page_url ?? '';
}

export function recorded_button_combination(component_row, state_row) {
  const captured_url = recorded_story_url(component_row, state_row);
  if (!captured_url) return '';
  try {
    const story_parameters = new URL(captured_url, 'http://localhost').searchParams;
    const story_args = Object.fromEntries((story_parameters.get('args') ?? '').split(';').filter(Boolean).map(argument_pair => {
      const split_index = argument_pair.indexOf(':');
      return [argument_pair.slice(0, split_index), argument_pair.slice(split_index + 1)];
    }));
    const style_value = story_args.button_style ?? story_args.style_variant ?? 'primary';
    const button_style = style_value === 'ghost' ? 'text' : style_value;
    return ['primary', 'secondary', 'text'].includes(button_style) ? `${button_style}|${story_args.is_disabled === 'true'}|${state_row.state_key}` : '';
  } catch { return ''; }
}
