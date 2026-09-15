import assert from 'node:assert/strict';
import { test } from 'node:test';
import { find_disallowed_opacity } from '../scripts/style-opacity-contract.mjs';

test('visibility keyframes can fade a component and backdrop without new color tokens', () => {
  assert.deepEqual(find_disallowed_opacity('@keyframes dialog-appear { from { opacity: 0; } to { opacity: 1; } }'), []);
  assert.deepEqual(find_disallowed_opacity('@-webkit-keyframes dialog-appear { 0% { opacity: 0; } 100% { opacity: 1; } }'), []);
});

test('static opacity still fails, including inside media queries and at binary values', () => {
  for (const opacity_value of ['0', '1', '0.5', 'var(--color-alpha)']) {
    assert.deepEqual(find_disallowed_opacity(`@media (min-width: 1px) { .example { opacity: ${opacity_value}; } }`), [1]);
  }
});

test('keyframes cannot encode translucent color styling', () => {
  assert.deepEqual(find_disallowed_opacity('@keyframes dialog-appear { from { opacity: 0.5; } to { opacity: 1; } }'), [1]);
});

test('comments and transition values are not opacity declarations', () => {
  assert.deepEqual(find_disallowed_opacity('// opacity: 0.5;\n.example { transition: opacity 200ms; }'), []);
});

test('SVG paint opacity remains subject to the color-token rule', () => {
  assert.deepEqual(find_disallowed_opacity('.example { fill-opacity: 0.5; }'), [1]);
  assert.deepEqual(find_disallowed_opacity('@keyframes example-fade { from { stroke-opacity: 0; } }'), [1]);
});
