import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join, extname } from 'node:path';
import { chromium } from 'playwright';
import { capture_history, read_history, save_history_notes } from '../scripts/component-status/history.mjs';
const PROJECT_ROOT = resolve('.');
const project_root = await mkdtemp(join(tmpdir(), 'history-browser-'));
process.env.PLAYWRIGHT_BROWSERS_PATH = resolve(PROJECT_ROOT, '.cache/ms-playwright');
const fixture_server = createServer((http_request, http_response) => {
  const after_state = http_request.url === '/after';
  http_response.writeHead(200, { 'content-type': 'text/html' });
  http_response.end(`<!doctype html><html><head><title>History test fixture</title><style>body{margin:0;background:white;min-height:600px}.moving-shape{position:absolute;left:${after_state ? 220 : 20}px;top:${after_state ? 130 : 30}px;width:${after_state ? 200 : 100}px;height:${after_state ? 80 : 40}px;background:gray;border:0;color:black}.parent-region{position:absolute;left:0;top:0;width:500px;height:300px}.replacement-shape{position:absolute;left:20px;top:350px;width:80px;height:80px;background:gray;border-radius:${after_state ? '50%' : '0'}}.version-watermark__number{position:absolute;top:550px}</style></head><body><section class="parent-region"><button class="moving-shape">${after_state ? 'Contact me' : 'Button'}</button></section><div class="replacement-shape"></div><span class="version-watermark__number">${after_state ? '1.0.5' : '1.0.0'}</span></body></html>`);
});
await new Promise((resolve_ready) => { fixture_server.listen(0, '127.0.0.1', resolve_ready); });
const source_origin = `http://127.0.0.1:${fixture_server.address().port}`;
let browser_instance;
let ui_server;
try {
  for (const side_name of ['before', 'after']) await capture_history({ project_root, input_data: { target_id: 'test-homepage', target_scope: 'page', target_label: 'Fixture homepage', page_url: `${source_origin}/${side_name}`, environment_name: 'preview', viewport_width: 600, viewport_height: 600, layer_rows: [
    { layer_id: 'parent-region', selector_text: '.parent-region', layer_label: 'Section region', depth_level: 0 },
    { layer_id: 'contact-action', selector_text: '.moving-shape', layer_label: 'Contact action', depth_level: 2 },
    { layer_id: side_name === 'before' ? 'album-cover' : 'author-avatar', selector_text: '.replacement-shape', layer_label: side_name === 'before' ? 'Album cover' : 'Author avatar', depth_level: 1 },
    { layer_id: 'missing-layer', selector_text: '.not-on-page', layer_label: 'Unavailable element' },
  ] } });
  const history_data = await read_history(project_root);
  assert.equal(history_data.milestone_rows.length, 2);
  assert.equal(history_data.milestone_rows[0].layer_rows.find((layer_row) => layer_row.layer_id === 'parent-region').motion_enabled, false);
  assert.equal(history_data.milestone_rows[0].layer_rows.find((layer_row) => layer_row.layer_id === 'contact-action').motion_enabled, true);
  assert.match(history_data.milestone_rows[0].capture_warnings[0], /missing, hidden, or ambiguous/);
  const capture_path = join(project_root, 'visual-history', history_data.milestone_rows[1].milestone_id, 'capture.json');
  const immutable_capture = await readFile(capture_path, 'utf8');
  ui_server = createServer(async (http_request, http_response) => {
    try {
      if (http_request.url === '/api/history') { http_response.setHeader('content-type','application/json'); http_response.end(JSON.stringify({ ...await read_history(project_root), review_token: 'fixture-token' })); return; }
      if (http_request.url === '/api/history/notes') {
        let body_text = ''; for await (const data_chunk of http_request) body_text += data_chunk;
        assert.equal(http_request.headers['x-review-token'], 'fixture-token');
        http_response.setHeader('content-type','application/json'); http_response.end(JSON.stringify(await save_history_notes(project_root, JSON.parse(body_text)))); return;
      }
      const request_path = http_request.url.split('?')[0];
      const file_path = request_path.startsWith('/history-assets/') ? resolve(project_root, 'visual-history', request_path.slice(16)) : request_path.startsWith('/fonts/') ? resolve(PROJECT_ROOT, 'src/public/assets/fonts', request_path.slice(7)) : resolve(PROJECT_ROOT, 'generated/status-dashboard', request_path.slice(1));
      http_response.setHeader('content-type', { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.woff2':'font/woff2' }[extname(file_path)] || 'application/octet-stream');
      http_response.end(await readFile(file_path));
    } catch (request_error) { http_response.writeHead(400); http_response.end(JSON.stringify({error:request_error.message})); }
  });
  await new Promise((resolve_ready) => { ui_server.listen(0, '127.0.0.1', resolve_ready); });
  const ui_origin = `http://127.0.0.1:${ui_server.address().port}`;
  browser_instance = await chromium.launch({ headless:true });
  const page_instance = await browser_instance.newPage({ viewport:{width:1280,height:1000} });
  const browser_errors = [];
  page_instance.on('pageerror', (error_value) => browser_errors.push(error_value.message));
  await page_instance.goto(`${ui_origin}/history.html`);
  await page_instance.locator('#history-target').selectOption('test-homepage');
  await page_instance.locator('#version-toggle:enabled').waitFor();
  await page_instance.waitForFunction(() => document.querySelector('#history-status').textContent.includes('logical layers'));
  assert.match(await page_instance.locator('#version-toggle').innerText(), /Before[\s\S]*1.0.0/);
  await page_instance.locator('#history-progress').fill('500');
  const moving_patch = page_instance.locator('.history-player__patch[data-layer-id="contact-action"][data-side-name="before"]');
  const middle_matrix = await moving_patch.evaluate((patch_element) => { const matrix_value = new DOMMatrix(getComputedStyle(patch_element).transform); return { x:matrix_value.m41,y:matrix_value.m42,scale:matrix_value.m11 }; });
  assert.deepEqual(middle_matrix,{x:120,y:80,scale:1.5});
  await page_instance.locator('#history-progress').fill('250');
  assert.equal(await moving_patch.evaluate((patch_element) => new DOMMatrix(getComputedStyle(patch_element).transform).m41),70);
  await page_instance.locator('#history-speed').selectOption('0.25');
  await page_instance.locator('#play-toggle').click();
  await page_instance.waitForTimeout(200);
  await page_instance.locator('#play-toggle').click();
  const paused_value = await page_instance.locator('#history-progress').inputValue();
  assert.ok(Number(paused_value)>250 && Number(paused_value)<320);
  await page_instance.waitForTimeout(100);
  assert.equal(await page_instance.locator('#history-progress').inputValue(),paused_value);
  await page_instance.locator('#history-progress').fill('1000');
  const visible_image = page_instance.locator('.history-player__image:not([hidden])');
  assert.equal(await visible_image.count(),1);
  assert.equal(await visible_image.evaluate((image_element) => image_element.getBoundingClientRect().width),600);
  await page_instance.emulateMedia({reducedMotion:'reduce'});
  await page_instance.locator('#version-toggle').click();
  assert.equal(await page_instance.locator('#history-progress').inputValue(),'0');
  await page_instance.locator('#version-toggle').click();
  assert.equal(await page_instance.locator('#history-progress').inputValue(),'1000');
  await page_instance.locator('#blueprint-toggle').click();
  await page_instance.locator('#history-progress').fill('500');
  const avatar_shape = page_instance.locator('.history-player__shape[data-layer-id="author-avatar"]');
  assert.equal(await avatar_shape.evaluate((shape_element) => getComputedStyle(shape_element).borderTopLeftRadius),'50%');
  await avatar_shape.focus();
  assert.match(await page_instance.locator('#layer-annotation').innerText(),/Added in After/);
  assert.equal(await avatar_shape.evaluate((shape_element) => Number(getComputedStyle(shape_element).opacity)),0.5);
  // Inline editing is tied to this exact pair and preserves immutable captures.
  await page_instance.locator('.history-player__shape[data-layer-id="contact-action"]').click();
  await page_instance.locator('#layer-reason').fill('Move the action closer to the heading. <script>bad()</script>');
  await page_instance.locator('#save-layer-reason').click();
  await page_instance.waitForFunction(() => document.querySelector('#layer-editor-status').textContent==='Reason saved');
  const before_milestone = history_data.milestone_rows[0].milestone_id;
  assert.match((await read_history(project_root)).milestone_rows[1].notes_data.comparison_notes[before_milestone]['contact-action'], /closer to the heading/);
  await page_instance.locator('#reason-close').click();
  await page_instance.locator('#details-open').click();
  await page_instance.locator('#notes-form [name="why_changed"]').fill('Make the primary action easier to find.');
  await page_instance.locator('#save-notes').click();
  await page_instance.waitForFunction(() => document.querySelector('#notes-status').textContent==='Saved revision 3');
  await page_instance.locator('#details-dialog [data-close-dialog]').click();
  assert.equal(await readFile(capture_path,'utf8'),immutable_capture);
  assert.match((await read_history(project_root)).milestone_rows[1].notes_data.why_changed,/primary action/);
  await page_instance.locator('.history-player__shape[data-layer-id="contact-action"]').focus();
  assert.match(await page_instance.locator('#layer-annotation').innerText(),/closer to the heading/);
  // The chosen pair survives reload, and only one replacing label is rendered.
  const comparison_url = page_instance.url();
  assert.equal(new URL(comparison_url).searchParams.get('before'),before_milestone);
  await page_instance.reload();
  await page_instance.locator('#version-toggle:enabled').waitFor();
  assert.equal(page_instance.url(),comparison_url);
  assert.equal(await page_instance.locator('#version-toggle .history-player__version-word').count(),1);
  assert.equal(await page_instance.locator('#capture-dialog').isVisible(),false);
  assert.equal(await page_instance.locator('#details-dialog').isVisible(),false);
  assert.equal(await page_instance.locator('#versions-dialog').isVisible(),false);
  assert.equal(await page_instance.locator('#version-toggle').evaluate((button_element)=>button_element.classList.contains('button--primary')),true);
  for (const control_selector of ['#version-toggle','#play-toggle']) {
    await page_instance.locator(control_selector).hover();
    assert.equal(await page_instance.locator(control_selector).evaluate((button_element)=>getComputedStyle(button_element).textDecorationLine),'none');
  }
  assert.match(await page_instance.locator('#pair-summary').evaluate((number_element)=>getComputedStyle(number_element).fontFamily),/Ubuntu Sans Mono/);
  await page_instance.locator('#inspect-toggle').click();
  await page_instance.locator('.history-player__hotspot[data-layer-id="contact-action"]').click();
  assert.match(await page_instance.locator('#layer-reason').inputValue(),/closer to the heading/);
  await page_instance.locator('#layer-reason').fill('');
  await page_instance.locator('#save-layer-reason').click();
  await page_instance.waitForFunction(()=>document.querySelector('#layer-editor-status').textContent==='Reason saved');
  assert.equal((await read_history(project_root)).milestone_rows[1].notes_data.comparison_notes[before_milestone]['contact-action'],'');
  await page_instance.locator('#reason-close').click();
  await page_instance.locator('#present-toggle').click();
  assert.equal(await page_instance.locator('.history-player.is-presenting').count(),1);
  await page_instance.locator('#present-toggle').click();
  await page_instance.setViewportSize({width:390,height:844});
  assert.equal(await page_instance.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true);
  assert.equal(await page_instance.locator('#history-stage [style]').count(),0);
  await page_instance.goto(`${ui_origin}/history.html?target=test-homepage&before=milestone-missing&after=${history_data.milestone_rows[1].milestone_id}`);
  await page_instance.waitForFunction(() => document.querySelector('#history-status').textContent.includes('matched pair'));
  assert.equal(await page_instance.locator('#version-toggle').isDisabled(),true);
  assert.equal(new URL(page_instance.url()).searchParams.get('before'),'milestone-missing');
  assert.deepEqual(browser_errors,[]);
  console.log('PASS: real capture, stable layer movement, replaced-shape fades, scrub/reverse/pause/speed, reduced motion, original 1× endpoints, blueprint focus annotations, inline pair-specific reasons and clears, saved pair URLs, shared buttons, numeric fonts, persisted notes, immutable evidence, fullscreen and mobile layout.');
} finally {
  await browser_instance?.close();
  await new Promise((resolve_closed) => { fixture_server.close(resolve_closed); });
  if (ui_server) await new Promise((resolve_closed) => { ui_server.close(resolve_closed); });
  await rm(project_root,{recursive:true,force:true});
}
