import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import { read_workspaces, save_workspace, validate_workspace_patch } from '../scripts/component-status/workspace.mjs';

 test('concurrent autosaves retain different components and preserve edits and clears', async () => {
  const temp_directory = await mkdtemp(resolve(tmpdir(), 'review-workspace-'));
  try {
    await Promise.all([
      save_workspace(temp_directory, 'atoms-button', { matrix_state: { column_order: ['hover', 'default'], hidden_rows: ['text'], depth_index: 1, rule_overrides: { 'primary|true|hover': true } } }),
      save_workspace(temp_directory, 'atoms-badge', { draft_case: { figma_url: 'https://www.figma.com/design/example', story_selector: '.badge' } }),
    ]);
    await save_workspace(temp_directory, 'atoms-badge', { draft_case: { figma_url: '' } });
    const saved_workspaces = await read_workspaces(temp_directory);
    assert.equal(saved_workspaces['atoms-badge'].draft_case.figma_url, '');
    assert.equal(saved_workspaces['atoms-badge'].draft_case.story_selector, '.badge');
    assert.deepEqual(saved_workspaces['atoms-button'].matrix_state.column_order, ['hover', 'default']);
    assert.equal(saved_workspaces['atoms-button'].matrix_state.rule_overrides['primary|true|hover'], true);
    assert.ok(saved_workspaces['atoms-button'].updated_at);
  } finally { await rm(temp_directory, { recursive: true, force: true }); }
});

test('workspace validates layout/rules and cannot accept manual passing results', () => {
  assert.deepEqual(validate_workspace_patch({ view_state: { comparison_layout: 'list' } }), { view_state: { comparison_layout: 'list' } });
  assert.throws(() => validate_workspace_patch({ view_state: { comparison_layout: 'invalid' } }));
  assert.throws(() => validate_workspace_patch({ matrix_state: { column_order: ['hover', 'hover'] } }));
  assert.throws(() => validate_workspace_patch({ matrix_state: { depth_index: 5 } }));
  assert.throws(() => validate_workspace_patch({ matrix_state: { rule_overrides: { 'primary|true|hover': 'passed' } } }));
  assert.deepEqual(validate_workspace_patch({ checks: [{ status: 'passed' }] }), {});
});

test('PNG reference is autosaved independently of a capture run', async () => {
  const temp_directory = await mkdtemp(resolve(tmpdir(), 'review-baseline-'));
  try {
    const image_buffer = PNG.sync.write(new PNG({ width: 2, height: 2 }));
    const saved_state = await save_workspace(temp_directory, 'atoms-button', { draft_case: { figma_url: '' } }, `data:image/png;base64,${image_buffer.toString('base64')}`);
    assert.match(saved_state.draft_case.figma_baseline, /^artifacts\/baselines\/[a-f0-9]+\.png$/);
    assert.deepEqual(await readFile(resolve(temp_directory, saved_state.draft_case.figma_baseline)), image_buffer);
    const removed_state = await save_workspace(temp_directory, 'atoms-button', { draft_case: { remove_baseline: true } });
    assert.equal(removed_state.draft_case.figma_baseline, undefined);
    assert.equal(removed_state.draft_case.remove_baseline, true);
    const restored_state = await save_workspace(temp_directory, 'atoms-button', { draft_case: { remove_baseline: false } }, `data:image/png;base64,${image_buffer.toString('base64')}`);
    assert.equal(restored_state.draft_case.figma_baseline, saved_state.draft_case.figma_baseline);
    assert.equal(restored_state.draft_case.remove_baseline, false);
  } finally { await rm(temp_directory, { recursive: true, force: true }); }
});

test('axis roles and reordered dimension values persist with canonical combination selection', () => {
  const workspace_patch = { matrix_state: { axis_roles: { row_axis: 'is_disabled', column_axis: 'button_style', depth_axis: 'pointer_state' }, depth_index: 3, dimension_orders: { button_style: ['text', 'primary', 'secondary'], is_disabled: ['true', 'false'], pointer_state: ['focus', 'hover', 'active', 'default'] }, active_combination: 'text|true|focus' }, view_state: { combination_key: 'text|true|focus', unavailable_combination: 'text|true|focus' } };
  assert.deepEqual(validate_workspace_patch(workspace_patch), workspace_patch);
  assert.throws(() => validate_workspace_patch({ matrix_state: { axis_roles: { row_axis: 'button_style', column_axis: 'button_style', depth_axis: 'is_disabled' } } }));
  assert.throws(() => validate_workspace_patch({ matrix_state: { dimension_orders: { pointer_state: ['default', 'default'] } } }));
});

test('manual Storybook PNG persists separately from Figma and never creates test results', async () => {
  const temp_directory = await mkdtemp(resolve(tmpdir(), 'storybook-upload-'));
  try {
    const image_buffer = PNG.sync.write(new PNG({ width: 2, height: 2 }));
    const png_data = `data:image/png;base64,${image_buffer.toString('base64')}`;
    const saved_state = await save_workspace(temp_directory, 'atoms-button', { draft_case: {} }, png_data, 'storybook');
    assert.ok(saved_state.draft_case.storybook_capture.startsWith('artifacts/baselines/'));
    assert.equal(saved_state.draft_case.figma_baseline, undefined);
    assert.equal(saved_state.checks, undefined);
    assert.deepEqual(await readFile(resolve(temp_directory, saved_state.draft_case.storybook_capture)), image_buffer);
    const restored_state = (await read_workspaces(temp_directory))['atoms-button'];
    assert.equal(restored_state.draft_case.storybook_capture, saved_state.draft_case.storybook_capture);
    const fresh_capture = await save_workspace(temp_directory, 'atoms-button', { draft_case: { remove_storybook_capture: true } });
    assert.equal(fresh_capture.draft_case.storybook_capture, undefined);
    assert.throws(() => save_workspace(temp_directory, 'atoms-button', {}, png_data, 'invalid'), /Unsupported PNG source/);
  } finally { await rm(temp_directory, { recursive: true, force: true }); }
});
