import { createServer } from 'node:http';
import { readFile, readdir, realpath } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { component_catalogue, merge_reports, source_fingerprint, validate_report } from './report.mjs';
export const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
export const REPORT_DIRECTORY = resolve(PROJECT_ROOT, '.cache/component-status');
const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

export async function status_data() {
  const story_index = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
  const report_names = await readdir(REPORT_DIRECTORY).catch(() => []);
  const report_list = [];
  const report_errors = [];
  for (const report_name of report_names.filter((file_name) => /^report-[\w-]+\.json$/.test(file_name))) {
    try { report_list.push(validate_report(JSON.parse(await readFile(resolve(REPORT_DIRECTORY, report_name), 'utf8')))); }
    catch { report_errors.push(`Could not read ${report_name}; its results are excluded.`); }
  }
  const current_fingerprint = await source_fingerprint(PROJECT_ROOT);
  const merged_results = merge_reports(component_catalogue(story_index), report_list, current_fingerprint);
  const case_config = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'config/component-status.json'), 'utf8'));
  return { ...merged_results, case_config: case_config.components, report_errors, refreshed_at: new Date().toISOString(), source_fingerprint: current_fingerprint };
}

export function create_status_server() {
  return createServer(async (http_request, http_response) => {
    if (!['GET', 'HEAD'].includes(http_request.method)) { http_response.writeHead(405); http_response.end(); return; }
    try {
      const request_path = decodeURIComponent(new URL(http_request.url, 'http://localhost').pathname);
      if (request_path === '/api/status') {
        const response_body = JSON.stringify(await status_data());
        http_response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
        http_response.end(response_body); return;
      }
      let base_path = resolve(PROJECT_ROOT, 'generated/status-dashboard');
      let relative_path = request_path === '/' ? 'index.html' : request_path.slice(1);
      if (request_path.startsWith('/storybook/')) { base_path = resolve(PROJECT_ROOT, 'storybook-static'); relative_path = request_path.slice(11); }
      else if (request_path.startsWith('/artifacts/')) { base_path = REPORT_DIRECTORY; relative_path = request_path.slice(1); }
      else if (request_path.startsWith('/fonts/')) { base_path = resolve(PROJECT_ROOT, 'src/public/assets/fonts'); relative_path = request_path.slice(7); }
      else if (request_path === '/api/fixtures/article-list-item') { base_path = REPORT_DIRECTORY; relative_path = 'article-list-item.fixture.json'; }
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
