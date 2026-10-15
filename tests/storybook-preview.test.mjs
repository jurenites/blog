import assert from 'node:assert/strict';
import { test } from 'node:test';
import { button_preview_url } from '../src/status-dashboard/storybook-preview.js';
test('Docs URL becomes an isolated story with URL-selected combination', () => {
  const preview_url = new URL(button_preview_url('http://storybook.jurenites.local/?path=/docs/atoms-button--docs', 'text|true|hover', 'http://test.jurenites.local'));
  assert.equal(preview_url.pathname, '/iframe.html');
  assert.equal(preview_url.searchParams.get('id'), 'atoms-button--default-story');
  assert.equal(preview_url.searchParams.get('args'), 'button_style:text;is_disabled:true');
  assert.equal(preview_url.searchParams.get('preview_state'), 'hover');
  assert.equal(preview_url.searchParams.get('path'), null);
});
test('Existing args survive while legacy style and selected state update', () => {
  const preview_url = new URL(button_preview_url('/storybook/iframe.html?id=atoms-button--default-story&args=button_label:Contact%20me;style_variant:primary', 'secondary|false|focus', 'http://test.jurenites.local'));
  assert.equal(preview_url.origin, 'http://test.jurenites.local');
  assert.equal(preview_url.pathname, '/storybook/iframe.html');
  assert.equal(preview_url.searchParams.get('args'), 'button_label:Contact me;button_style:secondary;is_disabled:false');
  assert.equal(preview_url.searchParams.get('preview_state'), 'focus');
});
