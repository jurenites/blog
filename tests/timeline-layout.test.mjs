import assert from 'node:assert/strict';
import test from 'node:test';
import { interpolate_calendar_offset } from '../src/slice/src/js/timeline-layout.js';

test('calendar follows dense descriptions without stretching the month scale', () => {
  const scroll_anchors = [
    { text_offset: 0, rail_offset: 0 },
    { text_offset: 600, rail_offset: 32 },
    { text_offset: 1000, rail_offset: 64 },
  ];
  assert.equal(interpolate_calendar_offset(scroll_anchors, 300), 16);
  assert.equal(interpolate_calendar_offset(scroll_anchors, 800), 48);
  assert.equal(interpolate_calendar_offset(scroll_anchors, -100), 0);
  assert.equal(interpolate_calendar_offset(scroll_anchors, 1200), 64);
});

test('projects starting in the same month hold the same calendar position', () => {
  const scroll_anchors = [
    { text_offset: 0, rail_offset: 0 },
    { text_offset: 400, rail_offset: 0 },
    { text_offset: 800, rail_offset: 32 },
  ];
  assert.equal(interpolate_calendar_offset(scroll_anchors, 200), 0);
  assert.equal(interpolate_calendar_offset(scroll_anchors, 600), 16);
  assert.equal(interpolate_calendar_offset([], 500), 0);
});
