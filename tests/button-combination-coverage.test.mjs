import test from 'node:test';
import assert from 'node:assert/strict';
import { button_combination_status, matrix_preferences } from '../src/status-dashboard/button-coverage.js';

function recorded_component({ button_style = 'primary', is_disabled = false, pointer_state = 'default', comparison_status = 'passed', is_stale = false } = {}) {
  return { checks: [
    { check_key: 'storybook', is_stale, details: [{ state_key: pointer_state, status: 'passed', page_url: `http://test.jurenites.local/storybook/iframe.html?id=atoms-button--default-story&args=button_style:${button_style};is_disabled:${is_disabled}` }] },
    { check_key: 'integration', is_stale, details: { visual_states: [{ state_key: pointer_state, comparisons: [{ pair_name: 'implementation', status: comparison_status }] }] } },
  ] };
}

test('coverage cannot spill from one style, disabled flag, or pointer state to another', () => {
  const component_row = recorded_component();
  assert.equal(button_combination_status(component_row, 'primary', false, 'default'), 'passed');
  assert.equal(button_combination_status(component_row, 'secondary', false, 'default'), 'missing');
  assert.equal(button_combination_status(component_row, 'primary', true, 'default'), 'missing');
  assert.equal(button_combination_status(component_row, 'primary', false, 'hover'), 'missing');
});

test('stale, failed, and forbidden combinations remain distinct from missing coverage', () => {
  assert.equal(button_combination_status(recorded_component({ is_stale: true }), 'primary', false, 'default'), 'stale');
  assert.equal(button_combination_status(recorded_component({ comparison_status: 'failed' }), 'primary', false, 'default'), 'failed');
  assert.equal(button_combination_status(recorded_component({ is_disabled: true, pointer_state: 'hover' }), 'primary', true, 'hover'), 'forbidden');
  assert.equal(button_combination_status({ checks: [] }, 'primary', false, 'default'), 'missing');
});

test('capture alone is not evidence that implementation comparison passed', () => {
  const component_row = recorded_component();
  component_row.checks.pop();
  assert.equal(button_combination_status(component_row, 'primary', false, 'default'), 'missing');
});

test('review rules are editable without manufacturing passing evidence', () => {
  const combination_key = 'primary|true|hover';
  assert.equal(button_combination_status({ checks: [] }, 'primary', true, 'hover', { [combination_key]: true }), 'missing');
  assert.equal(button_combination_status(recorded_component(), 'primary', false, 'default', { 'primary|false|default': false }), 'forbidden');
  const saved_preferences = { column_order: ['hover', 'default'], hidden_rows: ['text'], depth_index: 1 };
  assert.deepEqual(matrix_preferences(saved_preferences).column_order, saved_preferences.column_order);
  assert.equal(matrix_preferences(saved_preferences).depth_index, 1);
});

// A recorded state belongs to the captured URL, even if the editable case changes.
test('recorded combination follows image-linked capture args and preserves ghost compatibility', async () => {
  const { recorded_button_combination } = await import('../src/status-dashboard/button-coverage.js');
  const component_row = { checks: [{ check_key: 'storybook', details: [
    { image_path: 'story-one.png', page_url: 'http://localhost/storybook/iframe.html?args=style_variant:ghost;is_disabled:true' },
    { image_path: 'story-two.png', page_url: 'http://localhost/storybook/iframe.html?args=button_style:secondary;is_disabled:false' },
  ] }] };
  assert.equal(recorded_button_combination(component_row, { images: { storybook: 'story-one.png' }, state_key: 'default' }), 'text|true|default');
  assert.equal(recorded_button_combination(component_row, { images: { storybook: 'story-two.png' }, state_key: 'hover' }), 'secondary|false|hover');
  assert.equal(recorded_button_combination(component_row, { images: { storybook: 'unknown.png' }, state_key: 'hover' }), '');
});

test('all axis permutations retain the same 24 combinations and migrate old dimension orders', async () => {
  const { combination_list, swap_matrix_axis, DEFAULT_AXES, ordered_dimensions } = await import('../src/status-dashboard/button-combinations.js');
  const original_keys = combination_list();
  assert.equal(original_keys.length, 24);
  assert.equal(new Set(original_keys).size, 24);
  for (const row_axis of ['button_style', 'is_disabled', 'pointer_state']) {
    for (const column_axis of ['button_style', 'is_disabled', 'pointer_state'].filter(axis_name => axis_name !== row_axis)) {
      const depth_axis = ['button_style', 'is_disabled', 'pointer_state'].find(axis_name => ![row_axis, column_axis].includes(axis_name));
      assert.deepEqual(combination_list({ axis_roles: { row_axis, column_axis, depth_axis } }).sort(), [...original_keys].sort());
    }
  }
  assert.deepEqual(swap_matrix_axis(DEFAULT_AXES, 'column_axis', 'is_disabled'), { row_axis: 'button_style', column_axis: 'is_disabled', depth_axis: 'pointer_state' });
  assert.deepEqual(ordered_dimensions({ column_order: ['hover', 'default'] }).pointer_state, ['hover', 'default', 'focus', 'active']);
});

test('comparison failures stay with their own recorded style when several styles share a pointer state', () => {
  const component_row = recorded_component();
  const primary_url = component_row.checks[0].details[0].page_url;
  const secondary_url = primary_url.replace('button_style:primary', 'button_style:secondary');
  component_row.checks[0].details.push({ state_key: 'default', status: 'passed', page_url: secondary_url });
  component_row.checks[1].details.visual_states = [
    { state_key: 'default', story_url: primary_url, comparisons: [{ pair_name: 'implementation', status: 'passed' }] },
    { state_key: 'default', story_url: secondary_url, comparisons: [{ pair_name: 'implementation', status: 'failed' }] },
  ];
  assert.equal(button_combination_status(component_row, 'primary', false, 'default'), 'passed');
  assert.equal(button_combination_status(component_row, 'secondary', false, 'default'), 'failed');
});
