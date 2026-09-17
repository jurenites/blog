import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { validate_review_case, decode_baseline } from '../scripts/component-status/review.mjs';
import { create_status_server } from '../scripts/component-status/server.mjs';
const COMPONENT_ROWS = [{ component_id: 'font-preview', story_ids: ['font-preview--default'] }];
const REVIEW_CASE = { component_id: 'font-preview', drupal_url: '/portfolio/my-first-font', drupal_selector: '.font-preview', story_url: '/storybook/iframe.html?id=font-preview--default&args=sample_text:Example', story_selector: '.font-preview', viewport_width: 1280, viewport_height: 900, figma_url: '', inputs_matched: false };

test('review accepts a real website path, story args, and missing Figma', () => {
  const review_case = validate_review_case(REVIEW_CASE, COMPONENT_ROWS);
  assert.equal(review_case.drupal_url, 'http://jurenites.local/portfolio/my-first-font');
  assert.ok(review_case.story_url.includes('sample_text:Example'));
  assert.equal(review_case.figma_url, '');
  assert.equal(review_case.inputs_matched, false);
});

test('review rejects non-web URLs, credentials, unrelated stories, and invalid viewports', () => {
  for (const case_change of [{ drupal_url: 'file:///etc/passwd' }, { drupal_url: 'http://user:password@localhost/' }, { story_url: 'https://example.com/storybook/iframe.html?id=font-preview--default' }, { story_url: '/storybook/iframe.html?id=other--story' }, { component_id: 'absent' }, { viewport_width: 100000 }, { drupal_selector: '' }, { figma_url: 'https://example.com/frame' }]) {
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
    const response_data = await fetch(`${status_origin}/api/review`, { method: 'POST', headers: { origin: 'https://example.com', 'content-type': 'application/json' }, body: '{}' });
    assert.equal(response_data.status, 403);
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
