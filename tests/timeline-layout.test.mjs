import assert from 'node:assert/strict';
import test from 'node:test';
import { create_scroll_anchors, interpolate_calendar_offset, interpolate_project_offset } from '../src/slice/src/js/timeline-layout.js';

test('project navigation maps dense descriptions back to the fixed calendar', () => {
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

test('inverse navigation handles shared date anchors', () => {
  const scroll_anchors = [
    { text_offset: 0, rail_offset: 0 },
    { text_offset: 400, rail_offset: 0 },
    { text_offset: 800, rail_offset: 32 },
  ];
  assert.equal(interpolate_calendar_offset(scroll_anchors, 200), 0);
  assert.equal(interpolate_calendar_offset(scroll_anchors, 600), 16);
  assert.equal(interpolate_calendar_offset([], 500), 0);
});

test('calendar-driven anchors traverse concurrent projects without a jump', () => {
  const scroll_anchors = create_scroll_anchors([
    { rail_offset: 0, text_offset: 0 },
    { rail_offset: 200, text_offset: 400 },
    { rail_offset: 200, text_offset: 800 },
    { rail_offset: 300, text_offset: 1600 },
  ], 1000, 2400, 200);
  assert.equal(interpolate_project_offset(scroll_anchors, 130), 330);
  assert.equal(interpolate_project_offset(scroll_anchors, 180), 930);
  assert.ok(Math.abs(interpolate_project_offset(scroll_anchors, 130.001) - 330) < 0.02);
  assert.equal(interpolate_project_offset(scroll_anchors, -100), 0);
  assert.equal(interpolate_project_offset(scroll_anchors, 2000), 2200);
  for (const text_offset of [0, 100, 800, 1600, 2200]) {
    const rail_offset = interpolate_calendar_offset(scroll_anchors, text_offset);
    assert.ok(Math.abs(interpolate_project_offset(scroll_anchors, rail_offset) - text_offset) < 0.001);
  }
});

test('empty calendar periods and short content never reverse or divide by zero', () => {
  const scroll_anchors = create_scroll_anchors([
    { rail_offset: 0, text_offset: 0 },
    { rail_offset: 100, text_offset: 0 },
    { rail_offset: 300, text_offset: 300 },
  ], 800, 900, 200);
  let previous_offset = 0;
  for (let rail_offset = 0; rail_offset <= 600; rail_offset += 1) {
    const text_offset = interpolate_project_offset(scroll_anchors, rail_offset);
    assert.ok(Number.isFinite(text_offset) && text_offset >= previous_offset);
    previous_offset = text_offset;
  }
  assert.equal(interpolate_project_offset(create_scroll_anchors([], 100, 100, 200), 200), 0);
});
