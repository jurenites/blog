import assert from 'node:assert/strict';
import test from 'node:test';
import {
  numeric_counter_frame,
  numeric_counter_uses_compact_size,
  numeric_slot_frame,
  parse_css_time_milliseconds,
  parse_numeric_counter_target,
} from '../src/slice/src/js/numeric-values.js';

test('numeric counter targets preserve authored grouping and affixes', () => {
  assert.deepEqual(parse_numeric_counter_target('10,000+'), {
    grouping_separator: ',',
    prefix_text: '',
    suffix_text: '+',
    target_value: 10000,
  });
  assert.deepEqual(parse_numeric_counter_target('~80 projects'), {
    grouping_separator: '',
    prefix_text: '~',
    suffix_text: ' projects',
    target_value: 80,
  });
  assert.equal(parse_numeric_counter_target('Many projects'), null);
});

test('small counters roll nine to zero before the second drum appears', () => {
  const target_details = parse_numeric_counter_target('16');
  const before_ten_frame = numeric_counter_frame(9.9, target_details);
  const ten_frame = numeric_counter_frame(10, target_details);

  assert.equal(before_ten_frame.display_characters.length, 1);
  assert.equal(before_ten_frame.display_characters[0].current_digit, 9);
  assert.equal(before_ten_frame.display_characters[0].next_digit, 0);
  assert.deepEqual(
    ten_frame.display_characters.map(({ current_digit }) => current_digit),
    [1, 0],
  );
});

test('large counters skip intermediate values but land on the exact grouped target', () => {
  const target_details = parse_numeric_counter_target('10,000+');
  const rolling_frame = numeric_slot_frame(0.5, target_details);
  const target_frame = numeric_slot_frame(1, target_details);

  assert.equal(rolling_frame.display_characters.filter(
    ({ character_type }) => character_type === 'digit',
  ).some(({ drum_step }) => drum_step > 0), true);

  assert.deepEqual(
    target_frame.display_characters.map((display_character) => (
      display_character.character_type === 'digit'
        ? String(display_character.current_digit)
        : display_character.display_character
    )).join(''),
    '10,000',
  );
  assert.equal(target_frame.suffix_text, '+');
});

test('motion duration accepts the shared token CSS formats', () => {
  assert.equal(parse_css_time_milliseconds('375ms'), 375);
  assert.equal(parse_css_time_milliseconds('0.375s'), 375);
});

test('only long authored values opt into the compact number size', () => {
  assert.equal(numeric_counter_uses_compact_size('80+'), false);
  assert.equal(numeric_counter_uses_compact_size('~10\u00a0000h'), true);
});
