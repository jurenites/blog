import assert from 'node:assert/strict';
import { test } from 'node:test';
import { obtain_figma_png, parse_figma_reference } from '../scripts/component-status/figma-reference.mjs';
test('node-specific Figma links preserve branch keys and reject unrelated URLs', () => {
  assert.deepEqual(parse_figma_reference('https://www.figma.com/design/Example123/file?node-id=123-456'), { file_identifier: 'Example123', node_identifier: '123:456' });
  assert.equal(parse_figma_reference('https://figma.com/design/Original/branch/Branch123/file?node-id=1-2').file_identifier, 'Branch123');
  assert.throws(() => parse_figma_reference('https://example.com/design/Example/file?node-id=1-2'));
  assert.throws(() => parse_figma_reference('https://figma.com/design/Example/file'));
});
test('export requests native 1x PNG and never sends credentials to the image host', async () => {
  const request_rows = [];
  const png_data = await obtain_figma_png('https://figma.com/design/Example/file?node-id=1-2', { access_token: 'test-token', fetch_request: async (request_url, request_options) => {
    request_rows.push({ request_url: String(request_url), request_options });
    return request_rows.length === 1 ? { ok: true, json: async () => ({ images: { '1:2': 'https://image.example/export.png' } }) } : { ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
  } });
  const export_url = new URL(request_rows[0].request_url);
  assert.equal(export_url.searchParams.get('scale'), '1');
  assert.equal(export_url.searchParams.get('contents_only'), 'true');
  assert.equal(export_url.searchParams.get('ids'), '1:2');
  assert.equal(request_rows[0].request_options.headers['X-Figma-Token'], 'test-token');
  assert.equal(request_rows[1].request_options.headers, undefined);
  assert.equal(png_data, 'data:image/png;base64,AQID');
});
test('unconnected and failed exports return actionable errors', async () => {
  const figma_url = 'https://figma.com/design/Example/file?node-id=1-2';
  await assert.rejects(obtain_figma_png(figma_url, { access_token: '' }), /not connected/);
  await assert.rejects(obtain_figma_png(figma_url, { access_token: 'test-token', fetch_request: async () => ({ ok: false, status: 403 }) }), /403/);
});
