import assert from 'node:assert/strict';
import test from 'node:test';
import { create_elevation_animations } from '../src/slice/src/js/thumbnail-elevation.js';

test('guide geometry controls staged lifts; each guide appears after its lift', () => {
  const recorded_animations = [];
  const make_target = (target_name) => ({
    animate(motion_frames, motion_options) {
      const animation_record = { target_name, motion_frames, motion_options, pause() {} };
      recorded_animations.push(animation_record);
      return animation_record;
    },
  });
  const scene_targets = Object.fromEntries(['table', 'dialog', 'guide-table', 'guide-dialog'].map((part_name) => [`.dynamic-thumbnail__elevation-${part_name}`, make_target(part_name)]));
  scene_targets['.dynamic-thumbnail__elevation-height-table'] = { getBBox: () => ({ height: 31 }) };
  scene_targets['.dynamic-thumbnail__elevation-height-dialog'] = { getBBox: () => ({ height: 19 }) };
  const scene_group = { querySelector: (selector_text) => scene_targets[selector_text] };
  const motion_animations = create_elevation_animations({ querySelector: () => scene_group });
  assert.equal(motion_animations.length, 5);
  const table_lift = recorded_animations.find((animation_record) => animation_record.target_name === 'table');
  const dialog_lift = recorded_animations.find((animation_record) => animation_record.target_name === 'dialog');
  assert.equal(table_lift.motion_frames[0].transform, 'translateY(31px)');
  assert.equal(dialog_lift.motion_frames[0].transform, 'translateY(19px)');
  for (const [part_name, lift_animation] of [['table', table_lift], ['dialog', dialog_lift]]) {
    const guide_animation = recorded_animations.find((animation_record) => animation_record.target_name === `guide-${part_name}`);
    assert.ok(guide_animation.motion_frames[1].offset >= lift_animation.motion_frames[2].offset);
    assert.equal(guide_animation.motion_frames[1].opacity, 0);
    assert.equal(guide_animation.motion_frames[2].opacity, 1);
  }
  assert.ok(dialog_lift.motion_frames[1].offset > table_lift.motion_frames[2].offset);
});

test('ordinary artwork and incomplete scenes remain static', () => {
  assert.deepEqual(create_elevation_animations({ querySelector: () => null }), []);
  assert.deepEqual(create_elevation_animations({ querySelector: () => ({ querySelector: () => null }) }), []);
});
