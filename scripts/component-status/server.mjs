import { createServer } from 'node:http';
import { readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { component_catalogue, merge_reports, source_fingerprint, validate_report, aggregate_status } from './report.mjs';
import { configured_baseline, read_review_cases, run_visual_review, validate_review_case } from './review.mjs';
import { capture_history, read_history, save_history_notes } from './history.mjs';
import { audit_component_names } from '../audit-component-names.mjs';
import { obtain_figma_png } from './figma-reference.mjs';
import { read_workspaces, save_workspace } from './workspace.mjs';
import { run_language_picker } from './language-picker.mjs';
export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const REPORT_DIRECTORY = resolve(PROJECT_ROOT, '.cache/component-status');
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const REVIEW_TOKEN = randomUUID();
let review_running = false;

export async function status_data(report_directory = REPORT_DIRECTORY) {
  const story_index = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
  const report_names = await readdir(report_directory).catch(() => []);
  const report_list = [];
  const report_errors = [];
  for (const report_name of report_names.filter((file_name) => /^report-[\w-]+\.json$/.test(file_name))) {
    try { report_list.push(validate_report(JSON.parse(await readFile(resolve(report_directory, report_name), 'utf8')))); }
    catch { report_errors.push(`Could not read ${report_name}; its results are excluded.`); }
  }
  const current_fingerprint = await source_fingerprint(PROJECT_ROOT);
  const merged_results = merge_reports(component_catalogue(story_index), report_list, current_fingerprint);
  const case_config = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'config/component-status.json'), 'utf8'));
  const review_cases = await read_review_cases(report_directory);
  for (const component_row of merged_results.components) {
    const selected_case = review_cases[component_row.component_id] ?? case_config.components[component_row.component_id];
    const figma_check = component_row.checks.find((check_item) => check_item.check_key === 'figma');
    if (figma_check.status === 'not_checked' && !selected_case?.figma_baseline) {
      figma_check.status = 'missing';
      figma_check.message = selected_case?.figma_url ? 'Figma link exists; exported reference is missing.' : 'No Figma reference yet. Website / Storybook comparison is available independently.';
    }
  }
  const naming_report = await audit_component_names(PROJECT_ROOT).catch(audit_error => ({ error_message: audit_error.message, audit_rows: [], component_rows: [] }));
  for (const component_row of merged_results.components) {
    const public_title = story_index.entries[component_row.story_ids[0]]?.title;
    const audit_component = naming_report.component_rows.find(audit_row => audit_row.story_title === public_title);
    const naming_rows = audit_component ? naming_report.audit_rows.filter(audit_row => audit_row.component_id === audit_component.component_id) : [];
    const mismatch_count = naming_rows.filter(audit_row => audit_row.check_status === 'mismatch').length;
    const incomplete_count = naming_rows.filter(audit_row => audit_row.check_status === 'missing_evidence').length;
    component_row.checks.push({
      check_key: 'naming', check_label: 'Naming convention',
      status: mismatch_count ? 'failed' : incomplete_count || !naming_rows.length ? 'missing' : 'passed',
      message: naming_report.error_message ?? `${mismatch_count} mismatches · ${incomplete_count} missing mappings. Figma evidence is a recorded snapshot.`,
      checked_at: naming_report.evidence_captured_at,
      details: { evidence_captured_at: naming_report.evidence_captured_at, findings: naming_rows },
      artifacts: [], is_stale: false,
    });
    component_row.overall_status = aggregate_status(component_row.checks);
  }
  const history_data = await read_history(PROJECT_ROOT);
  const history_targets = [...new Map(history_data.milestone_rows.filter((milestone_row) => ['page', 'organism'].includes(milestone_row.target_scope)).map((milestone_row) => [milestone_row.target_id, { target_id: milestone_row.target_id, target_label: milestone_row.target_label, target_scope: milestone_row.target_scope }])).values()];
  return { ...merged_results, workspaces: await read_workspaces(report_directory), history_targets, manual_atoms: case_config.manual_atoms, case_config: case_config.components, review_cases, review_token: REVIEW_TOKEN, review_running, report_errors, refreshed_at: new Date().toISOString(), source_fingerprint: current_fingerprint };
}

export function create_status_server({ report_directory = REPORT_DIRECTORY } = {}) {
  return createServer(async (http_request, http_response) => {
    const status_origin = `http://127.0.0.1:${http_request.socket.localPort}`;
    const request_origin = [status_origin, `http://localhost:${http_request.socket.localPort}`, 'http://test.jurenites.local']
      .find((allowed_origin) => new URL(allowed_origin).host === http_request.headers.host);
    if (!request_origin) { http_response.writeHead(403); http_response.end(); return; }
    try {
      const request_path = decodeURIComponent(new URL(http_request.url, 'http://localhost').pathname);
      if (['/api/workspace', '/api/figma-reference'].includes(request_path) && http_request.method === 'POST') {
        if (http_request.headers['x-review-token'] !== REVIEW_TOKEN || http_request.headers.origin !== request_origin || http_request.headers['content-type'] !== 'application/json') { http_response.writeHead(403); http_response.end(); return; }
        try {
          let request_body = '';
          for await (const request_chunk of http_request) {
            request_body += request_chunk.toString();
            if (Buffer.byteLength(request_body) > 12 * 1024 * 1024) throw new Error('Settings or PNG too large.');
          }
          const input_data = JSON.parse(request_body);
          const story_index = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
          if (!component_catalogue(story_index).some(component_row => component_row.component_id === input_data.component_id)) throw new Error('Unknown component.');
          const png_data = request_path === '/api/figma-reference' ? await obtain_figma_png(input_data.figma_url) : input_data.png_data;
          const workspace_patch = request_path === '/api/figma-reference' ? { draft_case: { figma_url: input_data.figma_url, remove_baseline: false } } : input_data.workspace_patch;
          const workspace_data = await save_workspace(report_directory, input_data.component_id, workspace_patch, png_data);
          http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          http_response.end(JSON.stringify(workspace_data));
        } catch (save_error) {
          http_response.writeHead(400, { 'content-type': 'application/json' });
          http_response.end(JSON.stringify({ error: save_error.message }));
        }
        return;
      }
      if (['/api/review', '/api/language-picker', '/api/history/capture', '/api/history/notes'].includes(request_path) && http_request.method === 'POST') {
        if (http_request.headers['x-review-token'] !== REVIEW_TOKEN || http_request.headers.origin !== request_origin || http_request.headers['content-type'] !== 'application/json') { http_response.writeHead(403); http_response.end(); return; }
        if (review_running) { http_response.writeHead(409, { 'content-type': 'application/json' }); http_response.end(JSON.stringify({ error: 'A capture is already running. Wait for it to finish.' })); return; }
        review_running = true;
        try {
          if (request_path === '/api/language-picker') {
            const report_data = await run_language_picker({ project_root: PROJECT_ROOT, report_directory: report_directory, status_origin });
            http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            http_response.end(JSON.stringify(report_data));
            return;
          }
          let request_body = '';
          for await (const request_chunk of http_request) {
            request_body += request_chunk.toString();
            if (Buffer.byteLength(request_body) > 12 * 1024 * 1024) throw new Error('Request is too large. Choose a PNG under 8 MB.');
          }
          const input_data = JSON.parse(request_body);
          if (request_path.startsWith('/api/history/')) {
            const result_data = request_path.endsWith('/capture') ? await capture_history({ project_root: PROJECT_ROOT, input_data }) : await save_history_notes(PROJECT_ROOT, input_data);
            http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
            http_response.end(JSON.stringify(result_data));
            return;
          }
          const story_index = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
          const review_case = validate_review_case(input_data, component_catalogue(story_index));
          const case_config = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'config/component-status.json'), 'utf8')).components[review_case.component_id];
          const saved_cases = await read_review_cases(report_directory);
          const workspace_rows = await read_workspaces(report_directory);
          const draft_baseline = workspace_rows[review_case.component_id]?.draft_case?.figma_baseline;
          const png_data = input_data.png_data || (!input_data.remove_baseline && draft_baseline ? `data:image/png;base64,${(await readFile(resolve(report_directory, draft_baseline))).toString('base64')}` : !input_data.remove_baseline && !saved_cases[review_case.component_id] ? await configured_baseline(PROJECT_ROOT, case_config, review_case) : undefined);
          const report_data = await run_visual_review({ project_root: PROJECT_ROOT, report_directory: report_directory, status_origin, review_case, png_data, remove_baseline: input_data.remove_baseline === true });
          http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
          http_response.end(JSON.stringify(report_data));
        } catch (review_error) {
          http_response.writeHead(400, { 'content-type': 'application/json' });
          http_response.end(JSON.stringify({ error: review_error.message }));
        } finally { review_running = false; }
        return;
      }
      if (!['GET', 'HEAD'].includes(http_request.method)) { http_response.writeHead(405); http_response.end(); return; }
      if (request_path === '/api/history') {
        http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        http_response.end(JSON.stringify({ ...await read_history(PROJECT_ROOT), review_token: REVIEW_TOKEN, review_running })); return;
      }
      if (request_path === '/api/status') {
        const response_body = JSON.stringify(await status_data(report_directory));
        http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        http_response.end(response_body); return;
      }
      let base_path = resolve(PROJECT_ROOT, 'generated/status-dashboard');
      let relative_path = request_path === '/' ? 'index.html' : request_path.slice(1);
      if (request_path.startsWith('/storybook/')) { base_path = resolve(PROJECT_ROOT, 'storybook-static'); relative_path = request_path.slice(11); }
      else if (['/assets/', '/styles/', '/themes/'].some((url_prefix) => request_path.startsWith(url_prefix))) { base_path = resolve(PROJECT_ROOT, 'storybook-static'); relative_path = request_path.slice(1); }
      else if (request_path.startsWith('/artifacts/')) { base_path = report_directory; relative_path = request_path.slice(1); }
      else if (request_path.startsWith('/history-assets/')) { base_path = resolve(PROJECT_ROOT, 'visual-history'); relative_path = request_path.slice(16); }
      else if (request_path.startsWith('/fonts/')) { base_path = resolve(PROJECT_ROOT, 'src/public/assets/fonts'); relative_path = request_path.slice(7); }
      else if (request_path === '/api/fixtures/article-list-item') { base_path = report_directory; relative_path = 'article-list-item.fixture.json'; }
      const file_path = await realpath(resolve(base_path, relative_path));
      if (!file_path.startsWith(`${await realpath(base_path)}${sep}`)) { http_response.writeHead(403); http_response.end(); return; }
      const file_body = await readFile(file_path);
      http_response.writeHead(200, { 'content-type': MIME_TYPES[extname(file_path)] ?? 'application/octet-stream', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      http_response.end(http_request.method === 'HEAD' ? undefined : file_body);
    } catch (request_error) {
      http_response.writeHead(request_error.code === 'ENOENT' ? 404 : 503, { 'content-type': 'text/plain' });
      http_response.end('Status data is unavailable. Run npm run status:build and check the local report files.');
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const listen_port = Number(process.env.COMPONENT_STATUS_PORT ?? 7779);
  create_status_server().listen(listen_port, '127.0.0.1', () => console.log(`Component status: http://127.0.0.1:${listen_port}`));
}
