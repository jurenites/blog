import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validate_history_capture, validate_history_notes, save_history_notes, read_history } from '../scripts/component-status/history.mjs';
import { pair_history_layers, layer_keyframes, describe_layer_change } from '../src/status-dashboard/history-motion.js';
const CAPTURE_INPUT = { target_id: 'homepage', target_scope: 'page', page_url: 'http://localhost/', environment_name: 'development', layer_rows: [] };

test('milestone contract excludes atoms, duplicate identities, credentials and invalid geometry', () => {
  assert.equal(validate_history_capture(CAPTURE_INPUT).viewport_width, 1280);
  for (const invalid_input of [{ target_scope: 'atom' }, { target_scope: 'molecule' }, { target_id: '../escape' }, { page_url: 'file:///etc/passwd' }, { page_url: 'http://user:pass@localhost/' }, { viewport_width: 0 }, { viewport_width: 1280.5 }, { layer_rows: [{ layer_id: 'same-id', selector_text: '.one' }, { layer_id: 'same-id', selector_text: '.two' }] }]) assert.throws(() => validate_history_capture({ ...CAPTURE_INPUT, ...invalid_input }));
});
test('stable IDs match across selectors; replacements fade and movement preserves geometry', () => {
  const first_layer = { layer_id: 'contact-action', selector_text: '.old-selector', bounds_data: { x: 20, y: 30, width: 100, height: 40 }, depth_level: 1, corner_radius: '0px' };
  const second_layer = { ...first_layer, selector_text: '.new-selector', bounds_data: { x: 220, y: 130, width: 200, height: 80 } };
  const paired_layers = pair_history_layers({ layer_rows: [first_layer, { ...first_layer, layer_id: 'removed-layer' }] }, { layer_rows: [second_layer, { ...second_layer, layer_id: 'added-layer' }] });
  assert.equal(paired_layers.length, 3);
  assert.equal(paired_layers[0].after_layer.selector_text, '.new-selector');
  assert.match(describe_layer_change(paired_layers[0]), /200px horizontal, 100px vertical/);
  assert.match(describe_layer_change(paired_layers[1]), /Removed/);
  assert.match(describe_layer_change(paired_layers[2]), /Added/);
  assert.equal(layer_keyframes(first_layer, second_layer)[1].transform, 'translate3d(220px, 130px, 0px) scale(2, 2)');
  assert.equal(layer_keyframes(second_layer, second_layer, { fade_direction: 'in' })[0].opacity, 0);
});
test('notes update separately, reject stale revisions and leave capture immutable', async () => {
  const project_root = await mkdtemp(join(tmpdir(), 'history-notes-'));
  try {
    const milestone_root = join(project_root, 'visual-history', 'milestone-example');
    await mkdir(milestone_root, { recursive: true });
    const capture_text = JSON.stringify({ milestone_id: 'milestone-example', captured_at: '2026-10-13T00:00:00Z', image_sha256: 'immutable-evidence' });
    await writeFile(join(milestone_root, 'capture.json'), capture_text);
    const notes_data = { milestone_id: 'milestone-example', revision_number: 1, why_changed: 'Original reason', layer_notes: {} };
    await writeFile(join(milestone_root, 'notes.json'), JSON.stringify(notes_data));
    const saved_notes = await save_history_notes(project_root, { ...notes_data, why_changed: 'A revised, explicit design decision' });
    assert.equal(saved_notes.revision_number, 2);
    await assert.rejects(save_history_notes(project_root, notes_data), /another window/);
    assert.equal(await readFile(join(milestone_root, 'capture.json'), 'utf8'), capture_text);
    assert.equal((await read_history(project_root)).milestone_rows[0].notes_data.why_changed, 'A revised, explicit design decision');
    await assert.rejects(save_history_notes(project_root, { ...notes_data, milestone_id: '../outside' }), /Invalid milestone/);
  } finally { await rm(project_root, { recursive: true, force: true }); }
});

test('element reasons retain independent comparison baselines and explicit clears', () => {
  const notes_data = validate_history_notes({milestone_id:'milestone-after',revision_number:1,comparison_notes:{'milestone-before-one':{'contact-action':'Closer to heading'},'milestone-before-two':{'contact-action':''}}});
  assert.equal(notes_data.comparison_notes['milestone-before-one']['contact-action'],'Closer to heading');
  assert.equal(notes_data.comparison_notes['milestone-before-two']['contact-action'],'');
  assert.throws(()=>validate_history_notes({...notes_data,comparison_notes:{'../invalid':{}}}),/Invalid comparison/);
});
