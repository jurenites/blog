import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';

test('manual atom references retain exported dimensions and hashes and map to real stories', async () => {
  const config_data = JSON.parse(await readFile(new URL('../config/component-status.json', import.meta.url)));
  const story_index = JSON.parse(await readFile(new URL('../storybook-static/index.json', import.meta.url)));
  const manifest_data = JSON.parse(await readFile(new URL('./visual-baselines/manual-atoms/manifest.json', import.meta.url)));
  assert.equal(new Set(config_data.manual_atoms.components.map((atom_row) => atom_row.figma_node_id)).size, 13);
  for (const reference_row of manifest_data.references) {
    const image_buffer = await readFile(new URL(`./visual-baselines/manual-atoms/${reference_row.file_name}`, import.meta.url));
    const image_data = PNG.sync.read(image_buffer);
    assert.equal(createHash('sha256').update(image_buffer).digest('hex'), reference_row.sha256);
    assert.deepEqual([image_data.width, image_data.height], [reference_row.width, reference_row.height]);
    const atom_row = config_data.manual_atoms.components.find((atom_item) => atom_item.atom_key === reference_row.atom_key);
    assert.equal(atom_row.capture_node_id, reference_row.node_id);
    if (!atom_row.component_id) continue;
    const capture_case = config_data.components[atom_row.component_id];
    const story_id = new URL(capture_case.story_url, 'http://localhost').searchParams.get('id');
    assert.ok(story_index.entries[story_id], `Missing story ${story_id}`);
    assert.equal(story_index.entries[story_id].importPath, `./${atom_row.source_path}`);
    await access(new URL(`../${capture_case.figma_reference_path}`, import.meta.url));
    assert.equal(new URL(capture_case.figma_url).searchParams.get('node-id'), reference_row.node_id.replace(':', '-'));
  }
});


test('state references retain their own verified image and node mapping', async () => {
  const config_data = JSON.parse(await readFile(new URL('../config/component-status.json', import.meta.url)));
  const manifest_data = JSON.parse(await readFile(new URL('./visual-baselines/manual-atoms/manifest.json', import.meta.url)));
  for (const reference_row of manifest_data.state_references) {
    const image_buffer = await readFile(new URL(`./visual-baselines/manual-atoms/${reference_row.file_name}`, import.meta.url));
    const image_data = PNG.sync.read(image_buffer);
    assert.equal(createHash('sha256').update(image_buffer).digest('hex'), reference_row.sha256);
    assert.deepEqual([image_data.width, image_data.height], [reference_row.width, reference_row.height]);
    const case_config = Object.values(config_data.components).find((case_row) => case_row.manual_atom_key === reference_row.atom_key);
    assert.equal(case_config.figma_states[reference_row.state_key].node_id, reference_row.node_id);
    assert.notEqual(case_config.figma_states.default.node_id, reference_row.node_id);
  }
});
