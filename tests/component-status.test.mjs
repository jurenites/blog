import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { component_catalogue, merge_reports, validate_report } from '../scripts/component-status/report.mjs';
import { compare_images } from '../scripts/component-status/images.mjs';
import { component_variant_count, component_source_states } from '../src/stories/organisms/component-status/component-status.data.js';
const CHECKED_AT = '2026-09-11T12:00:00Z';
const CURRENT_TIME = Date.parse(CHECKED_AT);
const COMPONENT_ROWS = [{ component_id: 'molecules-test-item', component_name: 'Test Item', story_ids: ['test-item--default'] }];

test('sidebar counts Button combinations independently of its single story and deduplicates registered examples', () => {
  assert.equal(component_variant_count({ component_id: 'atoms-button', story_ids: ['atoms-button--default-story'] }), 6);
  assert.equal(component_variant_count({ story_ids: ['example--one', 'example--two', 'example--one'] }), 2);
  assert.equal(component_variant_count({}), 0);
});

test('sidebar source statuses stay independent of unrelated failures and preserve missing evidence', () => {
  const source_states = component_source_states({ overall_status: 'failed', checks: [
    { check_key: 'drupal', status: 'passed' },
    { check_key: 'storybook', status: 'failed', is_stale: true },
    { check_key: 'figma', status: 'missing', is_stale: true },
    { check_key: 'naming', status: 'failed' },
  ] });
  assert.deepEqual(source_states.map(source_state => [source_state.source_label, source_state.status_key]), [['Web', 'passed'], ['Storybook', 'stale'], ['Figma', 'missing']]);
  assert.deepEqual(component_source_states({}).map(source_state => source_state.status_key), ['not_checked', 'not_checked', 'not_checked']);
});
function report_fixture(check_status = 'passed') {
  return { schema_version: 1, source_name: 'unit-test', checked_at: CHECKED_AT, source_fingerprint: 'current-source', components: [{ component_id: 'molecules-test-item', checks: ['storybook', 'drupal', 'integration', 'figma'].map((check_key) => ({ check_key, check_label: check_key, status: check_status, message: 'Evidence' })) }] };
}

test('catalogue groups story variants and excludes documentation and Foundations', () => {
  const component_rows = component_catalogue({ entries: { first_story: { type: 'story', id: 'a--one', title: 'Molecules/Test Item' }, second_story: { type: 'story', id: 'a--two', title: 'Molecules/Test Item' }, docs_entry: { type: 'docs', id: 'a--docs', title: 'Molecules/Test Item' }, foundation_story: { type: 'story', id: 'spacing--default', title: 'Foundations/Spacing and Elevation' }, nested_foundation: { type: 'story', id: 'palette--default', title: 'Foundations/Colors/Palette' } } });
  assert.equal(component_rows.length, 1);
  assert.deepEqual(component_rows[0].story_ids, ['a--one', 'a--two']);
});

test('missing results and partial coverage never become green', () => {
  assert.equal(merge_reports(COMPONENT_ROWS, [], 'current-source', CURRENT_TIME).components[0].overall_status, 'attention');
  const report_data = report_fixture();
  report_data.components[0].checks.pop();
  assert.equal(merge_reports(COMPONENT_ROWS, [report_data], 'current-source', CURRENT_TIME).components[0].overall_status, 'attention');
});

test('current complete checks pass; failed checks take priority over blocked ones', () => {
  const report_data = report_fixture();
  assert.equal(merge_reports(COMPONENT_ROWS, [report_data], 'current-source', CURRENT_TIME).components[0].overall_status, 'passed');
  report_data.components[0].checks[0].status = 'failed';
  report_data.components[0].checks[3].status = 'blocked';
  assert.equal(merge_reports(COMPONENT_ROWS, [report_data], 'current-source', CURRENT_TIME).components[0].overall_status, 'failed');
});

test('old, changed-source, and future-dated reports cannot look current', () => {
  const report_data = report_fixture();
  for (const [source_hash, current_time] of [['new-source', CURRENT_TIME], ['current-source', CURRENT_TIME + 86400001], ['current-source', CURRENT_TIME - 120000]]) {
    assert.equal(merge_reports(COMPONENT_ROWS, [report_data], source_hash, current_time).components[0].overall_status, 'attention');
  }
});

test('a newer report replaces a failure for the same check', () => {
  const old_report = report_fixture('failed');
  old_report.checked_at = '2026-09-11T11:00:00Z';
  assert.equal(merge_reports(COMPONENT_ROWS, [report_fixture(), old_report], 'current-source', CURRENT_TIME).components[0].overall_status, 'passed');
});

test('untrusted report input rejects unsupported states, duplicate checks, and traversal artifacts', () => {
  const invalid_state = report_fixture('green');
  assert.throws(() => validate_report(invalid_state));
  const duplicate_report = report_fixture();
  duplicate_report.components[0].checks.push(duplicate_report.components[0].checks[0]);
  assert.throws(() => validate_report(duplicate_report));
  const traversal_report = report_fixture();
  traversal_report.components[0].checks[0].artifacts = [{ artifact_label: 'Secret', artifact_path: 'artifacts/../../.env' }];
  assert.throws(() => validate_report(traversal_report));
});

test('pixel comparison detects a real changed pixel and refuses image resizing', () => {
  const reference_image = new PNG({ width: 2, height: 2 });
  reference_image.data.fill(255);
  const reference_buffer = PNG.sync.write(reference_image);
  assert.equal(compare_images(reference_buffer, reference_buffer).status, 'passed');
  reference_image.data[0] = 0;
  const pixel_difference = compare_images(reference_buffer, PNG.sync.write(reference_image));
  assert.equal(pixel_difference.status, 'failed');
  assert.equal(pixel_difference.different_pixels, 1);
  assert.ok(pixel_difference.difference_buffer);
  const dimension_difference = compare_images(reference_buffer, PNG.sync.write(new PNG({ width: 3, height: 2 })));
  assert.equal(dimension_difference.status, 'failed');
  assert.equal(dimension_difference.difference_buffer, undefined);
});

test('missing Figma does not erase independent implementation results or imply full parity', () => {
  const report_data = report_fixture();
  report_data.components[0].checks[3].status = 'missing';
  validate_report(report_data);
  const component_row = merge_reports(COMPONENT_ROWS, [report_data], 'current-source', CURRENT_TIME).components[0];
  assert.equal(component_row.overall_status, 'attention');
  assert.equal(component_row.checks.find((check_item) => check_item.check_key === 'integration').status, 'passed');
  assert.equal(component_row.checks.find((check_item) => check_item.check_key === 'figma').status, 'missing');
});
