import test from 'node:test';
import assert from 'node:assert/strict';
import { public_snapshot, public_source_url } from '../scripts/component-status/public-export.mjs';

function sample_snapshot() {
  return {
    review_token: 'private-token', pipeline_checks: [{ message: 'private-log' }],
    components: [{ component_id: 'atoms-button', component_name: 'Button', component_group: 'Atoms', story_ids: ['atoms-button--default-story'], overall_status: 'attention', checks: [{ check_key: 'storybook', check_label: 'Storybook', status: 'passed', message: 'Captured', artifacts: [{ artifact_path: 'artifacts/capture.png', artifact_label: 'Storybook' }], details: [{ image_path: 'artifacts/capture.png', page_url: 'http://127.0.0.1:7779/storybook/iframe.html?id=atoms-button--default-story&args=button_label:Hello', status: 'passed', error_stack: 'private-stack' }] }] }],
    case_config: { 'atoms-button': { story_selector: '.button' } },
    workspaces: { 'atoms-button': { pending_save: true, draft_case: { figma_url: 'https://www.figma.com/design/example/Design?node-id=1-2', figma_baseline: 'artifacts/baselines/upload.png', storybook_capture: 'artifacts/manual/story.png', website_examples: [{ page_url: 'http://jurenites.local/contact', component_selector: '.button' }] } } },
  };
}

test('public export preserves uploaded PNGs and source links without private runtime data', () => {
  const { snapshot_data, artifact_paths } = public_snapshot(sample_snapshot());
  const published_case = snapshot_data.case_config['atoms-button'];
  assert.equal(published_case.figma_baseline, 'artifacts/baselines/upload.png');
  assert.equal(published_case.storybook_capture, 'artifacts/manual/story.png');
  assert.equal(published_case.website_examples[0].page_url, 'https://jurenites.com/contact');
  assert.equal(published_case.figma_url, 'https://www.figma.com/design/example/Design?node-id=1-2');
  assert.match(published_case.story_url, /^http:\/\/storybook.jurenites.com\/iframe.html\?id=atoms-button/);
  assert.equal(artifact_paths.length, 3);
  const serialized_data = JSON.stringify(snapshot_data);
  for (const excluded_value of ['private-token', 'private-log', 'private-stack', 'pending_save', '127.0.0.1', '.local']) assert.equal(serialized_data.includes(excluded_value), false);
});

test('public export rejects path traversal and private or credential-bearing URLs', () => {
  for (const artifact_path of ['artifacts/../secret.png', 'artifacts/../../settings.php', '/tmp/private.png']) {
    const source_data = sample_snapshot();
    source_data.workspaces['atoms-button'].draft_case.figma_baseline = artifact_path;
    assert.throws(() => public_snapshot(source_data), /Unsafe public artifact/);
  }
  for (const source_url of ['http://localhost:7779/api/status', 'http://private.local/', 'https://user:password@example.com/', 'javascript:alert(1)']) assert.throws(() => public_source_url(source_url));
});

test('public source conversion preserves Storybook args and removes local preview origin', () => {
  const public_url = new URL(public_source_url('http://test.jurenites.local/storybook/iframe.html?id=atoms-button--default-story&args=button_label:Hello&preview_parent=http://test.jurenites.local', 'storybook'));
  assert.equal(public_url.origin, 'http://storybook.jurenites.com');
  assert.equal(public_url.pathname, '/iframe.html');
  assert.equal(public_url.searchParams.get('args'), 'button_label:Hello');
  assert.equal(public_url.searchParams.has('preview_parent'), false);
});
