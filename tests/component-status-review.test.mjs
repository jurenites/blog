import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { validate_review_case, decode_baseline } from '../scripts/component-status/review.mjs';
import { create_status_server } from '../scripts/component-status/server.mjs';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run_visual_review } from '../scripts/component-status/review.mjs';
import { run_state_review } from '../scripts/component-status/state-review.mjs';
const COMPONENT_ROWS = [{ component_id: 'font-preview', story_ids: ['font-preview--default'] }];
const REVIEW_CASE = { component_id: 'font-preview', drupal_url: '/portfolio/my-first-font', drupal_selector: '.font-preview', story_url: '/storybook/iframe.html?id=font-preview--default&args=sample_text:Example', story_selector: '.font-preview', viewport_width: 1280, viewport_height: 900, figma_url: '', inputs_matched: false };

test('missing, unreadable and stale builds preserve saved reports and mappings before capture', async () => {
  const project_root = await mkdtemp(join(tmpdir(), 'review-build-preflight-'));
  try {
    for (const folder_name of ['src', '.storybook', 'scripts/component-status', 'web/themes/custom/jurenites_theme/templates', 'tests/visual-baselines', 'config', 'storybook-static', 'reports']) await mkdir(join(project_root, folder_name), { recursive: true });
    await writeFile(join(project_root, 'config/component-status.json'), '{}');
    const report_directory = join(project_root, 'reports');
    const report_path = join(report_directory, 'report-review-font-preview.json');
    const mapping_path = join(report_directory, 'review-cases.json');
    const previous_report = JSON.stringify({ evidence: 'previous captured images' });
    const previous_mapping = JSON.stringify({ 'font-preview': REVIEW_CASE });
    await writeFile(report_path, previous_report);
    await writeFile(mapping_path, previous_mapping);
    for (const build_contents of [null, '{invalid', JSON.stringify({ source_fingerprint: 'old-source' })]) {
      if (build_contents !== null) await writeFile(join(project_root, 'storybook-static/component-status-build.json'), build_contents);
      for (const capture_runner of [run_visual_review, run_state_review]) {
        await assert.rejects(capture_runner({ project_root, report_directory, status_origin: 'http://localhost', review_case: { ...REVIEW_CASE } }), /Run npm run status:build.*Previous captures have been kept/);
        assert.equal(await readFile(report_path, 'utf8'), previous_report);
        assert.equal(await readFile(mapping_path, 'utf8'), previous_mapping);
      }
    }
  } finally { await rm(project_root, { recursive: true, force: true }); }
});

test('review accepts a real website path, story args, and missing Figma', () => {
  const review_case = validate_review_case(REVIEW_CASE, COMPONENT_ROWS);
  assert.equal(review_case.drupal_url, 'http://jurenites.local/portfolio/my-first-font');
  assert.ok(review_case.story_url.includes('sample_text:Example'));
  assert.equal(review_case.figma_url, '');
  assert.equal(review_case.inputs_matched, false);
});

test('Figma / Storybook review allows no website but rejects a partial website mapping', () => {
  const review_case = validate_review_case({ ...REVIEW_CASE, drupal_url: '', drupal_selector: '', story_hover_selector: '[data-tooltip-trigger]' }, COMPONENT_ROWS);
  assert.equal(review_case.drupal_url, '');
  assert.equal(review_case.drupal_selector, '');
  assert.equal(review_case.story_hover_selector, '[data-tooltip-trigger]');
  assert.throws(() => validate_review_case({ ...REVIEW_CASE, drupal_url: '' }, COMPONENT_ROWS), /both empty/);
});

test('review rejects non-web URLs, credentials, unrelated stories, and invalid viewports', () => {
  for (const case_change of [{ drupal_url: 'file:///etc/passwd' }, { drupal_url: 'http://user:password@localhost/' }, { story_url: 'https://example.com/storybook/iframe.html?id=font-preview--default' }, { story_url: '/storybook/iframe.html?id=other--story' }, { component_id: 'absent' }, { viewport_width: 0 }, { viewport_width: -1 }, { viewport_width: 360.5 }, { viewport_width: Infinity }, { viewport_height: 100000 }, { drupal_selector: '' }, { figma_url: 'https://example.com/frame' }]) {
    assert.throws(() => validate_review_case({ ...REVIEW_CASE, ...case_change }, COMPONENT_ROWS));
  }
});

test('PNG import rejects malformed data and oversized dimensions before decoding pixels', () => {
  const image_buffer = PNG.sync.write(new PNG({ width: 2, height: 2 }));
  assert.deepEqual(decode_baseline(`data:image/png;base64,${image_buffer.toString('base64')}`), image_buffer);
  assert.throws(() => decode_baseline('data:image/svg+xml;base64,AAAA'));
  assert.throws(() => decode_baseline('data:image/png;base64,AAAA'));
  image_buffer.writeUInt32BE(100000, 16);
  image_buffer.writeUInt32BE(100000, 20);
  assert.throws(() => decode_baseline(`data:image/png;base64,${image_buffer.toString('base64')}`), /16 million/);
});

test('review endpoint rejects requests without same-origin authorization', async () => {
  const status_server = create_status_server();
  await new Promise((resolve_listen) => { status_server.listen(0, '127.0.0.1', resolve_listen); });
  try {
    const status_origin = `http://127.0.0.1:${status_server.address().port}`;
    for (const endpoint_path of ['/api/review', '/api/language-picker', '/api/history/capture', '/api/history/notes', '/api/storybook-reference']) {
      const response_data = await fetch(`${status_origin}${endpoint_path}`, { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: '{}' });
      assert.equal(response_data.status, 403);
    }
  } finally { await new Promise((resolve_close) => { status_server.close(resolve_close); }); }
});

test('dashboard accepts only the explicit local proxy and loopback hosts', async () => {
  const status_server = create_status_server();
  const host_cases = [
    ['test.jurenites.local', 405],
    ['127.0.0.1:7779', 405],
    ['localhost:7779', 405],
    ['test.jurenites.com', 403],
    ['test.jurenites.local.example.com', 403],
    ['example.com', 403],
  ];
  for (const [host_header, expected_status] of host_cases) {
    const response_status = await new Promise((resolve_response) => {
      let status_code;
      status_server.emit('request', {
        url: '/', method: 'OPTIONS', socket: { localPort: 7779 },
        headers: { host: host_header, 'x-forwarded-host': 'test.jurenites.local' },
      }, {
        writeHead(response_code) { status_code = response_code; },
        end() { resolve_response(status_code); },
      });
    });
    assert.equal(response_status, expected_status, host_header);
  }
});

test('manual viewport widths are independent of slider presets', () => {
  for (const pixel_width of [240, 375, 2048, 3840]) {
    assert.equal(validate_review_case({ ...REVIEW_CASE, viewport_width: pixel_width }, COMPONENT_ROWS).viewport_width, pixel_width);
  }
});

test('deployment opts into one exact public origin without trusting forwarded hosts', async () => {
  for (const public_origin of ['http://test.jurenites.com/path', 'http://user:secret@test.jurenites.com', 'file:///tmp']) {
    assert.throws(() => create_status_server({ public_origin }));
  }
  const status_server = create_status_server({ public_origin: 'http://test.jurenites.com' });
  for (const [host_header, expected_status] of [['test.jurenites.com', 405], ['test.jurenites.com.evil.example', 403], ['example.com', 403]]) {
    let actual_status;
    await new Promise(resolve_response => {
      status_server.emit('request', { url: '/', method: 'OPTIONS', socket: { localPort: 7779 }, headers: { host: host_header, 'x-forwarded-host': 'test.jurenites.com' } }, {
        writeHead(response_code) { actual_status = response_code; }, end: resolve_response,
      });
    });
    assert.equal(actual_status, expected_status);
  }
  for (const request_origin of ['http://test.jurenites.com', 'http://example.com']) {
    let actual_status;
    await new Promise(resolve_response => {
      status_server.emit('request', { url: '/api/workspace', method: 'POST', socket: { localPort: 7779 }, headers: { host: 'test.jurenites.com', origin: request_origin, 'content-type': 'application/json' } }, {
        writeHead(response_code) { actual_status = response_code; }, end: resolve_response,
      });
    });
    assert.equal(actual_status, 403, 'A public host must still require a review token.');
  }
});

test('deployment resolves relative website captures against its configured website origin', () => {
  const review_case = validate_review_case({ ...REVIEW_CASE, website_examples: [{ example_id: 'home-example', page_url: '/blog', component_selector: '.avatar' }] }, COMPONENT_ROWS, 'http://jurenites.com');
  assert.equal(review_case.drupal_url, 'http://jurenites.com/portfolio/my-first-font');
  assert.equal(review_case.website_examples[0].page_url, 'http://jurenites.com/blog');
});

test('Storybook PNG upload endpoint saves an unverified image and rejects non-PNG data', async () => {
  const report_directory = await mkdtemp(join(tmpdir(), 'storybook-upload-api-'));
  const status_server = create_status_server({ report_directory });
  await new Promise(resolve_listen => { status_server.listen(0, '127.0.0.1', resolve_listen); });
  try {
    const status_origin = `http://127.0.0.1:${status_server.address().port}`;
    const status_result = await fetch(`${status_origin}/api/status`).then(response_data => response_data.json());
    const image_buffer = PNG.sync.write(new PNG({ width: 2, height: 2 }));
    const upload_response = await fetch(`${status_origin}/api/storybook-reference`, { method: 'POST', headers: { origin: status_origin, 'content-type': 'application/json', 'x-review-token': status_result.review_token }, body: JSON.stringify({ component_id: 'atoms-avatar', png_data: `data:image/png;base64,${image_buffer.toString('base64')}` }) });
    assert.equal(upload_response.status, 200);
    const uploaded_state = await upload_response.json();
    assert.ok(uploaded_state.draft_case.storybook_capture);
    assert.equal(uploaded_state.draft_case.figma_baseline, undefined);
    assert.equal(uploaded_state.checks, undefined);
    const invalid_response = await fetch(`${status_origin}/api/storybook-reference`, { method: 'POST', headers: { origin: status_origin, 'content-type': 'application/json', 'x-review-token': status_result.review_token }, body: JSON.stringify({ component_id: 'atoms-avatar', png_data: 'data:text/plain;base64,bm90IGEgcG5n' }) });
    assert.equal(invalid_response.status, 400);
  } finally {
    await new Promise(resolve_close => { status_server.close(resolve_close); });
    await rm(report_directory, { recursive: true, force: true });
  }
});
