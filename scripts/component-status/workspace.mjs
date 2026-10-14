import { BUTTON_DIMENSIONS, matrix_axes } from '../../src/status-dashboard/button-combinations.js';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decode_baseline } from './review.mjs';

const DRAFT_FIELDS = ['story_url', 'story_selector', 'figma_url', 'comparison_mode', 'story_hover_selector', 'story_interaction_selector', 'viewport_width', 'viewport_height', 'inputs_matched', 'remove_baseline', 'capture_states', 'website_examples'];
const COLUMN_KEYS = ['default', 'hover', 'focus', 'active'];
const STYLE_KEYS = ['primary', 'secondary', 'text'];
let pending_write = Promise.resolve();

export async function read_workspaces(report_directory) {
  try { return JSON.parse(await readFile(resolve(report_directory, 'workspace.json'), 'utf8')).components ?? {}; }
  catch (read_error) { if (read_error.code === 'ENOENT') return {}; throw read_error; }
}

export function validate_workspace_patch(workspace_patch) {
  if (!workspace_patch || typeof workspace_patch !== 'object' || Array.isArray(workspace_patch)) throw new Error('Workspace settings must be an object.');
  const clean_patch = {};
  if (workspace_patch.matrix_state) {
    const matrix_state = workspace_patch.matrix_state;
    const clean_matrix = {};
    for (const [field_key, allowed_values] of [['column_order', COLUMN_KEYS], ['hidden_columns', COLUMN_KEYS], ['row_order', STYLE_KEYS], ['hidden_rows', STYLE_KEYS]]) {
      if (matrix_state[field_key] !== undefined) {
        if (!Array.isArray(matrix_state[field_key]) || matrix_state[field_key].some(field_value => !allowed_values.includes(field_value)) || new Set(matrix_state[field_key]).size !== matrix_state[field_key].length) throw new Error(`Invalid ${field_key}.`);
        if (field_key.endsWith('_order') && matrix_state[field_key].length !== allowed_values.length && !(field_key === 'column_order' && matrix_state[field_key].length === 2 && matrix_state[field_key].includes('default') && matrix_state[field_key].includes('hover'))) throw new Error(`Incomplete ${field_key}.`);
        clean_matrix[field_key] = matrix_state[field_key];
      }
    }
    if (matrix_state.axis_roles !== undefined) {
      const axis_values = Object.values(matrix_state.axis_roles);
      if (Object.keys(matrix_state.axis_roles).length !== 3 || !['row_axis', 'column_axis', 'depth_axis'].every(axis_name => Object.hasOwn(matrix_state.axis_roles, axis_name)) || axis_values.some(axis_value => !Object.hasOwn(BUTTON_DIMENSIONS, axis_value)) || new Set(axis_values).size !== 3) throw new Error('Invalid matrix axes.');
      clean_matrix.axis_roles = matrix_axes(matrix_state.axis_roles);
    }
    for (const field_name of ['dimension_orders', 'hidden_values']) {
      if (matrix_state[field_name] === undefined) continue;
      if (!matrix_state[field_name] || typeof matrix_state[field_name] !== 'object' || Array.isArray(matrix_state[field_name])) throw new Error('Invalid dimension settings.');
      clean_matrix[field_name] = {};
      for (const [dimension_name, value_order] of Object.entries(matrix_state[field_name])) {
        const allowed_values = BUTTON_DIMENSIONS[dimension_name];
        if (!allowed_values || !Array.isArray(value_order) || value_order.some(dimension_value => !allowed_values.includes(dimension_value)) || new Set(value_order).size !== value_order.length || field_name === 'dimension_orders' && value_order.length !== allowed_values.length) throw new Error('Invalid dimension values.');
        clean_matrix[field_name][dimension_name] = value_order;
      }
    }
    if (matrix_state.depth_index !== undefined) {
      const depth_count = BUTTON_DIMENSIONS[matrix_axes(matrix_state.axis_roles).depth_axis].length;
      if (!Number.isInteger(matrix_state.depth_index) || matrix_state.depth_index < 0 || matrix_state.depth_index >= depth_count) throw new Error('Invalid depth slice.');
      clean_matrix.depth_index = matrix_state.depth_index;
    }
    if (matrix_state.active_combination !== undefined) {
      if (typeof matrix_state.active_combination !== 'string' || matrix_state.active_combination && !/^(primary|secondary|text)\|(false|true)\|(default|hover|focus|active)$/.test(matrix_state.active_combination)) throw new Error('Invalid active combination.');
      clean_matrix.active_combination = matrix_state.active_combination;
    }
    if (matrix_state.selected_combination !== undefined) {
      if (typeof matrix_state.selected_combination !== 'string' || matrix_state.selected_combination && !/^(primary|secondary|text)\|(false|true)\|(default|hover|focus|active)$/.test(matrix_state.selected_combination)) throw new Error('Invalid selected combination.');
      clean_matrix.selected_combination = matrix_state.selected_combination;
    }
    if (matrix_state.rule_overrides !== undefined) {
      if (!matrix_state.rule_overrides || typeof matrix_state.rule_overrides !== 'object' || Array.isArray(matrix_state.rule_overrides)) throw new Error('Invalid combination rules.');
      clean_matrix.rule_overrides = {};
      for (const [combination_key, is_allowed] of Object.entries(matrix_state.rule_overrides)) {
        if (!/^(primary|secondary|text)\|(false|true)\|(default|hover|focus|active)$/.test(combination_key) || typeof is_allowed !== 'boolean') throw new Error('Invalid combination rule.');
        clean_matrix.rule_overrides[combination_key] = is_allowed;
      }
    }
    clean_patch.matrix_state = clean_matrix;
  }
  if (workspace_patch.draft_case !== undefined) {
    if (!workspace_patch.draft_case || typeof workspace_patch.draft_case !== 'object' || Array.isArray(workspace_patch.draft_case)) throw new Error('Invalid capture settings.');
    clean_patch.draft_case = {};
    for (const field_key of DRAFT_FIELDS) {
      const field_value = workspace_patch.draft_case[field_key];
      if (field_value === undefined) continue;
      if (['capture_states', 'website_examples'].includes(field_key)) {
        if (!Array.isArray(field_value) || field_value.length > 8) throw new Error(`Invalid ${field_key}.`);
        if (field_key === 'capture_states' && field_value.some(state_key => !['default', 'hover', 'focus', 'active', 'checked'].includes(state_key))) throw new Error('Invalid capture state.');
        if (field_key === 'website_examples') clean_patch.draft_case[field_key] = field_value.map(example_row => Object.fromEntries(['example_id', 'example_label', 'page_url', 'component_selector', 'interaction_selector', 'reveal_selector'].filter(field_name => example_row[field_name] !== undefined).map(field_name => [field_name, String(example_row[field_name]).slice(0, 4096)])));
        else clean_patch.draft_case[field_key] = field_value;
      } else if (['inputs_matched', 'remove_baseline'].includes(field_key)) {
        if (typeof field_value !== 'boolean') throw new Error(`Invalid ${field_key}.`);
        clean_patch.draft_case[field_key] = field_value;
      } else clean_patch.draft_case[field_key] = String(field_value).slice(0, 4096);
    }
  }
  if (workspace_patch.view_state !== undefined) {
    const view_state = workspace_patch.view_state;
    const clean_view = {};
    if (view_state.enabled_sources !== undefined) {
      if (!Array.isArray(view_state.enabled_sources) || view_state.enabled_sources.some(source_name => !['figma', 'storybook', 'drupal'].includes(source_name))) throw new Error('Invalid preview sources.');
      clean_view.enabled_sources = [...new Set(view_state.enabled_sources)];
    }
    if (view_state.overlay_enabled !== undefined) {
      if (typeof view_state.overlay_enabled !== 'boolean') throw new Error('Invalid overlay mode.');
      clean_view.overlay_enabled = view_state.overlay_enabled;
    }
    for (const field_name of ['combination_key', 'unavailable_combination']) if (view_state[field_name] !== undefined) { if (typeof view_state[field_name] !== 'string' || view_state[field_name] && !/^(primary|secondary|text)\|(false|true)\|(default|hover|focus|active)$/.test(view_state[field_name])) throw new Error('Invalid view combination.'); clean_view[field_name] = view_state[field_name]; }
    if (view_state.example_id !== undefined) clean_view.example_id = String(view_state.example_id).slice(0, 256);
    if (view_state.recorded_state !== undefined) clean_view.recorded_state = String(view_state.recorded_state).slice(0, 256);
    clean_patch.view_state = clean_view;
  }
  if (workspace_patch.details_state !== undefined) {
    const detail_entries = Object.entries(workspace_patch.details_state);
    if (detail_entries.length > 64 || detail_entries.some(([detail_key, is_open]) => detail_key.length > 256 || typeof is_open !== 'boolean')) throw new Error('Invalid disclosure settings.');
    clean_patch.details_state = Object.fromEntries(detail_entries);
  }
  return clean_patch;
}

export function save_workspace(report_directory, component_id, workspace_patch, png_data) {
  const clean_patch = validate_workspace_patch(workspace_patch);
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(component_id)) throw new Error('Invalid component id.');
  const save_operation = pending_write.catch(() => {}).then(async () => {
    const workspace_rows = await read_workspaces(report_directory);
    const previous_state = workspace_rows[component_id] ?? {};
    const next_state = { ...previous_state, ...clean_patch, updated_at: new Date().toISOString() };
    if (clean_patch.draft_case) next_state.draft_case = { ...previous_state.draft_case, ...clean_patch.draft_case };
    if (clean_patch.draft_case?.remove_baseline) delete next_state.draft_case.figma_baseline;
    if (png_data) {
      const baseline_buffer = decode_baseline(png_data);
      const image_hash = createHash('sha256').update(baseline_buffer).digest('hex');
      await mkdir(resolve(report_directory, 'artifacts/baselines'), { recursive: true });
      const baseline_path = `artifacts/baselines/${image_hash}.png`;
      await writeFile(resolve(report_directory, baseline_path), baseline_buffer);
      next_state.draft_case = { ...next_state.draft_case, figma_baseline: baseline_path };
    }
    workspace_rows[component_id] = next_state;
    await mkdir(report_directory, { recursive: true });
    const workspace_path = resolve(report_directory, 'workspace.json');
    await writeFile(`${workspace_path}.tmp`, JSON.stringify({ schema_version: 1, components: workspace_rows }, null, 2));
    await rename(`${workspace_path}.tmp`, workspace_path);
    return next_state;
  });
  pending_write = save_operation;
  return save_operation;
}
