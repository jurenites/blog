import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { create_status_server, PROJECT_ROOT } from '../scripts/component-status/server.mjs';
import { run_visual_review } from '../scripts/component-status/review.mjs';
const REPORT_DIRECTORY = await mkdtemp(resolve(tmpdir(), 'visual-review-test-'));
const STATUS_SERVER = create_status_server();
await new Promise((resolve_listen) => { STATUS_SERVER.listen(0, '127.0.0.1', resolve_listen); });
const STATUS_ORIGIN = `http://127.0.0.1:${STATUS_SERVER.address().port}`;
const STORY_INDEX = JSON.parse(await readFile(resolve(PROJECT_ROOT, 'storybook-static/index.json'), 'utf8'));
const STORY_ENTRY = Object.values(STORY_INDEX.entries).find((story_entry) => story_entry.title === 'Atoms/Button' && story_entry.type === 'story');
assert.ok(STORY_ENTRY, 'Button story must exist.');
const STORY_URL = `/storybook/iframe.html?id=${STORY_ENTRY.id}&viewMode=story`;
const REVIEW_CASE = { component_id: 'integration-fixture', drupal_url: `${STATUS_ORIGIN}${STORY_URL}`, drupal_selector: '.button', story_url: STORY_URL, story_selector: '.button', viewport_width: 1280, viewport_height: 900, figma_url: '', inputs_matched: true };
const run_case = (extra_options = {}) => run_visual_review({ project_root: PROJECT_ROOT, report_directory: REPORT_DIRECTORY, status_origin: STATUS_ORIGIN, review_case: { ...REVIEW_CASE }, ...extra_options });
try {
  const initial_report = await run_case();
  assert.equal(initial_report.components[0].checks.find((check_item) => check_item.check_key === 'integration').status, 'passed', JSON.stringify(initial_report));
  assert.equal(initial_report.components[0].checks.find((check_item) => check_item.check_key === 'figma').status, 'missing');
  const image_path = initial_report.components[0].checks.find((check_item) => check_item.check_key === 'storybook').artifacts[0].artifact_path;
  const png_buffer = await readFile(resolve(REPORT_DIRECTORY, image_path));
  const png_data = `data:image/png;base64,${png_buffer.toString('base64')}`;
  const baseline_report = await run_case({ png_data });
  assert.equal(baseline_report.components[0].checks.find((check_item) => check_item.check_key === 'figma').status, 'passed', JSON.stringify(baseline_report));
  const removed_report = await run_case({ remove_baseline: true });
  assert.equal(removed_report.components[0].checks.find((check_item) => check_item.check_key === 'figma').status, 'missing');
  console.log('PASS: identical rendered regions, PNG upload and both reference comparisons, persisted reference removal. Temporary test reference is not a Figma claim.');
} finally {
  await new Promise((resolve_close) => { STATUS_SERVER.close(resolve_close); });
  await rm(REPORT_DIRECTORY, { recursive: true, force: true });
}
