import test from 'node:test';
import assert from 'node:assert/strict';
import { create_layout_preferences } from '../src/status-dashboard/layout-preferences.js';

function memory_storage() {
  const stored_values = new Map();
  return {
    getItem: storage_key => stored_values.get(storage_key) ?? null,
    setItem: (storage_key, stored_value) => stored_values.set(storage_key, stored_value),
  };
}

test('anonymous layout and visitor identity survive a new visit in the same browser', () => {
  const browser_storage = memory_storage();
  const first_visit = create_layout_preferences(browser_storage);
  const first_identity = JSON.parse(browser_storage.getItem('jurenites-comparison-preferences')).visitor_id;
  assert.equal(first_visit.read_layout(), 'columns');
  first_visit.save_layout('list');
  const second_visit = create_layout_preferences(browser_storage);
  assert.equal(second_visit.read_layout(), 'list');
  assert.equal(JSON.parse(browser_storage.getItem('jurenites-comparison-preferences')).visitor_id, first_identity);
  const separate_storage = memory_storage();
  assert.equal(create_layout_preferences(separate_storage).read_layout(), 'columns');
  assert.notEqual(JSON.parse(separate_storage.getItem('jurenites-comparison-preferences')).visitor_id, first_identity);
});

test('unavailable or corrupt storage does not break layout selection', () => {
  const blocked_preferences = create_layout_preferences({ getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } });
  blocked_preferences.save_layout('list');
  assert.equal(blocked_preferences.read_layout(), 'list');
  const browser_storage = memory_storage();
  browser_storage.setItem('jurenites-comparison-preferences', '{broken');
  const recovered_preferences = create_layout_preferences(browser_storage);
  assert.equal(recovered_preferences.read_layout(), 'columns');
  recovered_preferences.save_layout('invalid');
  assert.equal(recovered_preferences.read_layout(), 'columns');
});
