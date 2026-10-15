import { cp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_ROOT, REPORT_DIRECTORY, status_data } from './server.mjs';

const STORYBOOK_ORIGIN = 'http://storybook.jurenites.com';
const WEBSITE_ORIGIN = 'https://jurenites.com';
export const PUBLIC_DIRECTORY = resolve(PROJECT_ROOT, 'generated/status-public');

export function public_source_url(source_value, source_type = 'website') {
  if (!source_value) return '';
  const source_url = new URL(source_value, source_type === 'storybook' ? 'http://test.jurenites.local' : WEBSITE_ORIGIN);
  if (!['http:', 'https:'].includes(source_url.protocol) || source_url.username || source_url.password) throw new Error('Only public HTTP(S) source URLs can be exported.');
  if (source_url.hostname === 'storybook.jurenites.local' || (['test.jurenites.local', '127.0.0.1', 'localhost'].includes(source_url.hostname) && source_url.pathname.startsWith('/storybook/'))) {
    source_url.host = new URL(STORYBOOK_ORIGIN).host;
    source_url.protocol = new URL(STORYBOOK_ORIGIN).protocol;
    source_url.pathname = source_url.pathname.replace(/^\/storybook\//, '/');
  } else if (source_url.hostname === 'jurenites.local') {
    source_url.host = new URL(WEBSITE_ORIGIN).host;
    source_url.protocol = 'https:';
  }
  if (source_url.hostname.endsWith('.local') || ['127.0.0.1', 'localhost'].includes(source_url.hostname)) throw new Error(`Unmapped local source: ${source_url.hostname}`);
  for (const parameter_name of ['preview_parent', 'jurenites_preview_id', 'jurenites_component_preview', 'token', 'access_token', 'api_key', 't']) source_url.searchParams.delete(parameter_name);
  return source_url.href;
}

function pick_fields(source_data, field_names) {
  return Object.fromEntries(field_names.filter(field_name => source_data?.[field_name] !== undefined).map(field_name => [field_name, source_data[field_name]]));
}

export function public_snapshot(source_data) {
  const artifact_paths = new Set();
  function public_artifact(artifact_path) {
    if (!artifact_path) return '';
    if (!/^artifacts\/[\w./-]+\.png$/.test(artifact_path) || artifact_path.split('/').some(path_part => !path_part || path_part === '..' || path_part === '.')) throw new Error('Unsafe public artifact path.');
    artifact_paths.add(artifact_path);
    return artifact_path;
  }
  function public_case(case_data = {}, default_story) {
    const clean_case = pick_fields(case_data, ['story_selector', 'drupal_selector', 'viewport_width', 'viewport_height', 'comparison_mode', 'remove_baseline', 'remove_storybook_capture']);
    clean_case.story_url = public_source_url(case_data.story_url || `/storybook/iframe.html?id=${encodeURIComponent(default_story)}&viewMode=story`, 'storybook');
    clean_case.figma_url = public_source_url(case_data.figma_url);
    if (!case_data.remove_baseline && case_data.figma_baseline) clean_case.figma_baseline = public_artifact(case_data.figma_baseline);
    if (!case_data.remove_storybook_capture && case_data.storybook_capture) clean_case.storybook_capture = public_artifact(case_data.storybook_capture);
    clean_case.website_examples = (case_data.website_examples ?? (case_data.drupal_url ? [{ page_url: case_data.drupal_url, component_selector: case_data.drupal_selector }] : [])).map(example_row => ({ ...pick_fields(example_row, ['example_id', 'example_label', 'component_selector']), page_url: public_source_url(example_row.page_url) }));
    return clean_case;
  }
  function public_state(state_row) {
    return {
      ...pick_fields(state_row, ['state_key', 'state_label', 'example_id', 'example_label']),
      figma_url: public_source_url(state_row.figma_url),
      website_url: public_source_url(state_row.website_url),
      ...(state_row.story_url ? { story_url: public_source_url(state_row.story_url, 'storybook') } : {}),
      images: Object.fromEntries(Object.entries(state_row.images ?? {}).filter(([source_key]) => ['figma', 'storybook', 'drupal'].includes(source_key)).map(([source_key, image_path]) => [source_key, public_artifact(image_path)])),
      comparisons: (state_row.comparisons ?? []).map(pair_row => ({ ...pick_fields(pair_row, ['pair_name', 'status', 'message']), differences_list: (pair_row.differences_list ?? []).map(difference_row => pick_fields(difference_row, ['role_name', 'property_key', 'actual_value', 'expected_value'])) })),
      interactions: (state_row.interactions ?? []).map(interaction_row => pick_fields(interaction_row, ['source_id', 'status', 'message'])),
    };
  }
  const case_config = {};
  const component_rows = source_data.components.map(component_row => {
    case_config[component_row.component_id] = public_case({ ...source_data.case_config?.[component_row.component_id], ...source_data.review_cases?.[component_row.component_id], ...source_data.workspaces?.[component_row.component_id]?.draft_case }, component_row.story_ids[0]);
    return { ...pick_fields(component_row, ['component_id', 'component_name', 'component_group', 'story_ids', 'overall_status']), checks: component_row.checks.map(check_row => {
      const public_check = { ...pick_fields(check_row, ['check_key', 'check_label', 'status', 'checked_at', 'is_stale']), message: /\/Users\/|\/var\/|\/tmp\//.test(check_row.message) ? 'Capture unavailable in this published snapshot.' : check_row.message, artifacts: (check_row.artifacts ?? []).filter(artifact_row => artifact_row.artifact_path.endsWith('.png')).map(artifact_row => ({ artifact_label: artifact_row.artifact_label, artifact_path: public_artifact(artifact_row.artifact_path) })) };
      if (check_row.details?.visual_states) public_check.details = { visual_states: check_row.details.visual_states.map(public_state) };
      else if (check_row.check_key === 'storybook' && Array.isArray(check_row.details)) public_check.details = check_row.details.filter(capture_row => capture_row.image_path).map(capture_row => ({ ...pick_fields(capture_row, ['state_key', 'status']), image_path: public_artifact(capture_row.image_path), page_url: public_source_url(capture_row.page_url, 'storybook') }));
      return public_check;
    }) };
  });
  return { snapshot_data: { components: component_rows, case_config, review_cases: {}, workspaces: {}, history_targets: [], pipeline_checks: [], report_errors: [], refreshed_at: new Date().toISOString(), public_mode: true }, artifact_paths: [...artifact_paths].sort() };
}

export async function export_public_dashboard({ output_directory = PUBLIC_DIRECTORY, report_directory = REPORT_DIRECTORY } = {}) {
  const { snapshot_data, artifact_paths } = public_snapshot(await status_data(report_directory));
  // Resolve every source before touching an existing export; symlinks cannot escape the report directory.
  const report_root = await realpath(report_directory);
  const artifact_sources = await Promise.all(artifact_paths.map(async artifact_path => {
    const source_path = await realpath(resolve(report_root, artifact_path));
    if (!source_path.startsWith(`${report_root}${sep}`)) throw new Error('Artifact escaped the report directory.');
    return [artifact_path, source_path];
  }));
  await rm(output_directory, { recursive: true, force: true });
  await mkdir(output_directory, { recursive: true });
  for (const file_name of ['app.js', 'style.css', 'favicon.svg', 'button-variants-overview.png', 'build-info.json']) await cp(resolve(PROJECT_ROOT, 'generated/status-dashboard', file_name), resolve(output_directory, file_name));
  const html_source = await readFile(resolve(PROJECT_ROOT, 'src/status-dashboard/index.html'), 'utf8');
  const public_html = html_source.replace('<html lang="en"', '<html data-dashboard-mode="public" lang="en"').replace('<h1 class="visually-hidden">Visual testing</h1>', '<h1 class="visually-hidden">Visual testing</h1><p class="status-dashboard__public-notice" id="public-dashboard-notice">Public preview · Editing, uploads and captures are disabled for public use.</p>').replace('Local review · settings save automatically', 'Published comparisons · read-only');
  await writeFile(resolve(output_directory, 'index.html'), public_html);
  await writeFile(resolve(output_directory, 'status.json'), JSON.stringify(snapshot_data));
  await cp(resolve(PROJECT_ROOT, 'src/public/assets/fonts'), resolve(output_directory, 'fonts'), { recursive: true });
  for (const asset_folder of ['assets/images/checkbox', 'themes/custom/jurenites_theme/assets/images/companies']) await cp(resolve(PROJECT_ROOT, 'storybook-static', asset_folder), resolve(output_directory, asset_folder), { recursive: true });
  for (const [artifact_path, source_path] of artifact_sources) { await mkdir(dirname(resolve(output_directory, artifact_path)), { recursive: true }); await cp(source_path, resolve(output_directory, artifact_path)); }
  await cp(resolve(PROJECT_ROOT, 'deploy/component-status/public.htaccess'), resolve(output_directory, '.htaccess'));
  console.log(`Exported ${snapshot_data.components.length} components and ${artifact_paths.length} PNGs to ${output_directory}.`);
  return { snapshot_data, artifact_paths };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await export_public_dashboard();
