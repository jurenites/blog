import test from 'node:test';
import assert from 'node:assert/strict';
import { create_swipe_motion } from '../src/slice/src/js/screen-swipe.js';

test('Resuming after a manual drag starts at the chosen position and completes the remaining scroll', () => {
  for (const requested_position of [-100, 975, 2400, 2600]) {
    const { key_frames, duration_ms } = create_swipe_motion(2400, 600, requested_position, 400, 800);
    const expected_position = Math.min(2400, Math.max(0, requested_position));
    assert.equal(key_frames[0].transform, `translateY(${-expected_position}px)`);
    assert.equal(key_frames[1].transform, key_frames[0].transform, 'Hold at the manually selected position');
    assert.equal(key_frames.at(-1).transform, 'translateY(0px)', 'Return to top after the remaining swipes');
    assert.ok(key_frames.some(frame_value => frame_value.transform === 'translateY(-2400px)'));
    assert.ok(duration_ms > 0);
    assert.ok(key_frames.every((frame_value, frame_index) => frame_index === 0 || frame_value.offset > key_frames[frame_index - 1].offset));
  }
});

for (const start_position of ['top', 'bottom']) {
  test(`Swipe motion from ${start_position} settles within the screen and pauses between gestures`, () => {
    const { key_frames, duration_ms } = create_swipe_motion(2400, 600, start_position, 850, 800);
    const scroll_positions = key_frames.map(frame_value => Math.abs(Number(frame_value.transform.match(/translateY\(([-\d.]+)px\)/)[1])));
    assert.equal(scroll_positions[0], start_position === 'bottom' ? 2400 : 0);
    assert.equal(scroll_positions.at(-1), start_position === 'bottom' ? 2400 : 0);
    assert.equal(Math.max(...scroll_positions), 2427);
    assert.ok(scroll_positions.every(scroll_position => scroll_position >= 0), 'No top overscroll');
    const overscroll_index = scroll_positions.indexOf(2427);
    assert.equal(scroll_positions[overscroll_index + 1], 2400, 'Snap exactly to bottom');
    assert.ok(scroll_positions.some((scroll_position, frame_index) => scroll_position > 0 && scroll_position < 2400 && scroll_position === scroll_positions[frame_index + 1]), 'Pause between swipes');
    assert.equal(key_frames[0].offset, 0);
    assert.equal(key_frames.at(-1).offset, 1);
    assert.ok(key_frames.every((frame_value, frame_index) => frame_index === 0 || frame_value.offset > key_frames[frame_index - 1].offset));
    assert.ok(duration_ms < 9000, 'Long screens complete in seconds');
    if (start_position === 'bottom') assert.equal(scroll_positions[2], 0, 'First movement reaches top directly');
  });
}
