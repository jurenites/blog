import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { open_database, read_dashboard, PROJECT_ROOT, QUERY_TEXT } from './database.mjs';

const database_handle = open_database();
const server_port = Number(process.env.CONTACT_ANALYTICS_PORT || 4318);
const allowed_hosts = new Set([`127.0.0.1:${server_port}`, `localhost:${server_port}`]);
const static_files = {
  '/': ['index.html', 'text/html'],
  '/app.js': ['app.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css'],
};
const server_handle = createServer(async (request_message, response_message) => {
  response_message.setHeader('Cache-Control', 'no-store');
  response_message.setHeader('X-Content-Type-Options', 'nosniff');
  response_message.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'");
  if (!allowed_hosts.has(request_message.headers.host)) {
    response_message.writeHead(403).end('Local access only');
    return;
  }
  if (request_message.method !== 'GET') {
    response_message.writeHead(405).end('Read only');
    return;
  }
  const request_url = new URL(request_message.url, `http://127.0.0.1:${server_port}`);
  try {
    if (request_url.pathname === '/api/dashboard') {
      const dashboard_data = read_dashboard(database_handle, request_url.searchParams.get('report_id'));
      response_message.setHeader('Content-Type', 'application/json');
      response_message.end(JSON.stringify(dashboard_data));
    } else if (request_url.pathname === '/queries.sql') {
      response_message.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response_message.end(QUERY_TEXT);
    } else if (static_files[request_url.pathname]) {
      const [file_name, content_type] = static_files[request_url.pathname];
      response_message.setHeader('Content-Type', `${content_type}; charset=utf-8`);
      response_message.end(await readFile(resolve(PROJECT_ROOT, 'generated/contact-analytics', file_name)));
    } else {
      response_message.writeHead(404).end('Not found');
    }
  } catch (request_error) {
    response_message.writeHead(request_error.message === 'Unknown report' ? 400 : 500,
      { 'Content-Type': 'application/json' });
    response_message.end(JSON.stringify({ error_message: request_error.message === 'Unknown report'
      ? 'Unknown report period' : 'Could not load the report. Check the local server.' }));
  }
});
server_handle.listen(server_port, '127.0.0.1', () => console.log(`Local: http://127.0.0.1:${server_port}`));
