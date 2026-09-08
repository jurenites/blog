import assert from 'node:assert/strict';
import test from 'node:test';

import { find_active_organization_index } from '../src/slice/src/js/timeline.js';

test('organization rail keeps the first company before its transition reaches the rail', () => {
  assert.equal(find_active_organization_index([480, 2400, 2700], 64), 0);
});

test('organization rail selects the latest company transition above the rail', () => {
  assert.equal(find_active_organization_index([-1200, 40, 340], 64), 1);
  assert.equal(find_active_organization_index([-1500, -240, 40], 64), 2);
});
