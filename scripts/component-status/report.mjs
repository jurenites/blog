import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export const CHECK_STATES = ['passed', 'failed', 'blocked', 'not_checked'];
export const REQUIRED_CHECKS = [
  ['storybook', 'Storybook rendering'],
  ['drupal', 'Drupal with real data'],
  ['integration', 'Storybook / Drupal pixels'],
  ['figma', 'Figma design parity'],
];
export const REPORT_MAX_AGE = 24 * 60 * 60 * 1000;

export function component_identifier(story_title) {
  return story_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function component_catalogue(story_index) {
  const component_groups = new Map();
  for (const story_entry of Object.values(story_index.entries ?? {})) {
    if (story_entry.type !== 'story') continue;
    const component_id = component_identifier(story_entry.title);
    if (!component_groups.has(component_id)) {
      const title_parts = story_entry.title.split('/');
      component_groups.set(component_id, {
        component_id,
        component_name: title_parts.at(-1),
        component_group: title_parts.slice(0, -1).join(' / '),
        story_ids: [],
      });
    }
    component_groups.get(component_id).story_ids.push(story_entry.id);
  }
  return [...component_groups.values()].sort((first_item, second_item) =>
    first_item.component_name.localeCompare(second_item.component_name));
}

export function validate_report(report_data) {
  if (report_data.schema_version !== 1 || !Array.isArray(report_data.components)
    || typeof report_data.source_name !== 'string' || !report_data.source_name.trim()
    || !Number.isFinite(Date.parse(report_data.checked_at))
    || typeof report_data.source_fingerprint !== 'string') {
    throw new Error('Invalid status report header.');
  }
  const component_ids = new Set();
  for (const component_result of report_data.components) {
    if (typeof component_result.component_id !== 'string' || !Array.isArray(component_result.checks)
      || component_ids.has(component_result.component_id)) throw new Error('Invalid or duplicate component result.');
    component_ids.add(component_result.component_id);
    validate_checks(component_result.checks);
  }
  validate_checks(report_data.pipeline_checks ?? []);
  return report_data;
}

function validate_checks(check_results) {
  const check_keys = new Set();
  for (const check_result of check_results) {
    if (!CHECK_STATES.includes(check_result.status) || typeof check_result.check_key !== 'string'
      || !check_result.check_key || typeof check_result.check_label !== 'string'
      || typeof check_result.message !== 'string' || check_keys.has(check_result.check_key)) {
      throw new Error('Invalid or duplicate check result.');
    }
    check_keys.add(check_result.check_key);
    for (const artifact_item of check_result.artifacts ?? []) {
      if (typeof artifact_item.artifact_path !== 'string'
        || !/^artifacts\/[a-zA-Z0-9_./-]+$/.test(artifact_item.artifact_path)
        || artifact_item.artifact_path.split('/').some((path_part) => path_part === '..')
        || typeof artifact_item.artifact_label !== 'string') throw new Error('Invalid artifact path.');
    }
  }
}

export function aggregate_status(check_results) {
  if (check_results.some((check_result) => check_result.status === 'failed' && !check_result.is_stale)) return 'failed';
  if (check_results.length && check_results.every((check_result) => check_result.status === 'passed' && !check_result.is_stale)) return 'passed';
  return 'attention';
}

export function merge_reports(component_rows, report_list, current_fingerprint, current_time = Date.now()) {
  const sorted_reports = [...report_list].sort((first_report, second_report) => Date.parse(first_report.checked_at) - Date.parse(second_report.checked_at));
  const pipeline_results = new Map();
  const checked_components = component_rows.map((component_row) => {
    const selected_checks = new Map(REQUIRED_CHECKS.map(([check_key, check_label]) => [check_key, {
      check_key, check_label, status: 'not_checked', message: 'No result recorded.', artifacts: [],
    }]));
    for (const report_data of sorted_reports) {
      const component_result = report_data.components.find((result_item) => result_item.component_id === component_row.component_id);
      for (const check_result of component_result?.checks ?? []) selected_checks.set(check_result.check_key, decorate_check(check_result, report_data));
    }
    const check_results = [...selected_checks.values()];
    return { ...component_row, checks: check_results, overall_status: aggregate_status(check_results) };
  });
  for (const report_data of sorted_reports) {
    for (const check_result of report_data.pipeline_checks ?? []) pipeline_results.set(`${report_data.source_name}:${check_result.check_key}`, decorate_check(check_result, report_data));
  }
  return { components: checked_components, pipeline_checks: [...pipeline_results.values()] };

  function decorate_check(check_result, report_data) {
    const checked_time = Date.parse(report_data.checked_at);
    return {
      ...check_result,
      source_name: report_data.source_name,
      checked_at: report_data.checked_at,
      run_id: report_data.run_id ?? '',
      source_commit: report_data.source_commit ?? '',
      source_dirty: report_data.source_dirty ?? false,
      is_stale: current_time - checked_time > REPORT_MAX_AGE || checked_time > current_time + 60000
        || report_data.source_fingerprint !== current_fingerprint,
    };
  }
}

export async function source_fingerprint(project_root) {
  const hash_value = createHash('sha256');
  for (const relative_root of ['src', '.storybook', 'scripts/component-status', 'web/themes/custom/jurenites_theme/templates']) {
    await hash_directory(resolve(project_root, relative_root), relative_root);
  }
  hash_value.update(await readFile(resolve(project_root, 'config/component-status.json')));
  return hash_value.digest('hex');
  async function hash_directory(directory_path, relative_path) {
    const directory_entries = await readdir(directory_path, { withFileTypes: true });
    for (const file_entry of directory_entries.sort((first_entry, second_entry) => first_entry.name.localeCompare(second_entry.name))) {
      if (file_entry.isDirectory()) await hash_directory(resolve(directory_path, file_entry.name), `${relative_path}/${file_entry.name}`);
      else if (file_entry.isFile()) {
        hash_value.update(`${relative_path}/${file_entry.name}\0`);
        hash_value.update(await readFile(resolve(directory_path, file_entry.name)));
      }
    }
  }
}
