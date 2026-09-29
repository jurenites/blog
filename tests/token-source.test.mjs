import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { collectTokens, expand_token_paths, loadTokenTree } from '../scripts/build-tokens.mjs';

test('dot-path tokens reconstruct nested namespaces and preserve array values', () => {
  assert.deepEqual(expand_token_paths({
    'space.scale.base-gap': '8px',
    'component.timeline.marker-size-default': 'space.scale.base-gap',
    'typography.font-family.sans': ['Open Sans', 'sans-serif'],
  }), {
    space: { scale: { 'base-gap': '8px' } },
    component: { timeline: { 'marker-size-default': 'space.scale.base-gap' } },
    typography: { 'font-family': { sans: ['Open Sans', 'sans-serif'] } },
  });
});

test('ambiguous nested and dot-path definitions fail instead of overwriting values', () => {
  assert.throws(() => expand_token_paths({
    'space.scale': '8px', 'space.scale.base-gap': '16px',
  }), /Conflicting token path/);
  assert.throws(() => expand_token_paths({
    'space.scale.base-gap': '8px', space: { scale: { 'base-gap': '16px' } },
  }), /Duplicate or conflicting token path/);
});

test('every source key becomes exactly one token with resolvable references', async () => {
  const source_text = await readFile(new URL('../src/token/tokens.yaml', import.meta.url), 'utf8');
  const source_paths = [...source_text.matchAll(/^([a-z0-9.-]+): /gm)].map((key_match) => key_match[1]);
  const token_records = collectTokens(await loadTokenTree());
  assert.deepEqual(token_records.map((token_record) => token_record.path.join('.')).sort(), source_paths.sort());
  assert.equal(new Set(source_paths).size, source_paths.length);
  const marker_record = token_records.find((token_record) => token_record.name === 'component-timeline-marker-size-default');
  assert.equal(marker_record.referencePath, 'space.scale.base-gap');
  assert.equal(marker_record.value, '8px');
});
