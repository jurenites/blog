import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';
import { figma_overview_reference } from '../src/status-dashboard/figma-overview.js';

const BUTTON_REFERENCE_URL = 'https://www.figma.com/design/UMshUcV87SZqsg1aDaDpnZ/blog-jurenites?node-id=1196-889';

test('native wrapper export agrees with the inspected reference geometry', async () => {
  const overview_reference = figma_overview_reference('atoms-button', BUTTON_REFERENCE_URL);
  const image_data = PNG.sync.read(await readFile(new URL('../src/status-dashboard/assets/button-variants-overview.png', import.meta.url)));
  assert.equal(new URL(overview_reference.wrapper_url).searchParams.get('node-id'), '1884-2415');
  assert.equal(image_data.width, overview_reference.reference_width);
  assert.equal(image_data.height, overview_reference.reference_height);
});

test('an unrelated or cleared reference cannot inherit the Button overview', () => {
  assert.equal(figma_overview_reference('atoms-chip', BUTTON_REFERENCE_URL), null);
  assert.equal(figma_overview_reference('atoms-button', BUTTON_REFERENCE_URL.replace('1196-889', '1738-2425')), null);
  assert.equal(figma_overview_reference('atoms-button', BUTTON_REFERENCE_URL.replace('UMshUcV87SZqsg1aDaDpnZ', 'different-file')), null);
  assert.equal(figma_overview_reference('atoms-button', ''), null);
});
