import test from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as wait_for_timer } from 'node:timers/promises';
import { create_auto_capture } from '../src/status-dashboard/auto-capture.js';

test('capture waits for settled edits, skips initial render and duplicate values', async () => {
  let current_settings = { selector_value: '.old' };
  const captured_values = [];
  const capture_queue = create_auto_capture({ read_settings: () => current_settings, run_capture: async capture_settings => captured_values.push(capture_settings), on_status() {}, on_complete() {}, delay_ms: 10 });
  await wait_for_timer(20);
  assert.equal(captured_values.length, 0);
  current_settings = { selector_value: '.incomplete' };
  capture_queue.schedule_capture();
  current_settings = { selector_value: '.complete' };
  capture_queue.schedule_capture();
  await wait_for_timer(25);
  assert.deepEqual(captured_values, [{ selector_value: '.complete' }]);
  capture_queue.schedule_capture();
  await wait_for_timer(20);
  assert.equal(captured_values.length, 1);
  capture_queue.dispose();
});

test('edits during capture queue only the latest settings and suppress stale completion', async () => {
  let current_settings = { width_value: 360 };
  let finish_capture;
  const captured_values = [];
  const completed_values = [];
  const capture_queue = create_auto_capture({ read_settings: () => current_settings, run_capture: capture_settings => { captured_values.push(capture_settings); return new Promise(resolve_capture => { finish_capture = () => resolve_capture(capture_settings); }); }, on_status() {}, on_complete: result_data => completed_values.push(result_data), delay_ms: 10 });
  current_settings = { width_value: 768 };
  capture_queue.schedule_capture();
  await wait_for_timer(20);
  current_settings = { width_value: 1280 };
  capture_queue.schedule_capture();
  current_settings = { width_value: 1920 };
  capture_queue.schedule_capture();
  await wait_for_timer(20);
  assert.equal(captured_values.length, 1);
  finish_capture();
  await wait_for_timer(25);
  assert.deepEqual(captured_values, [{ width_value: 768 }, { width_value: 1920 }]);
  assert.equal(completed_values.length, 0);
  finish_capture();
  await wait_for_timer(5);
  assert.deepEqual(completed_values, [{ width_value: 1920 }]);
  capture_queue.dispose();
});

test('invalid drafts and disconnected panels do not launch captures', async () => {
  let current_settings = { width_value: 360 };
  let capture_count = 0;
  const capture_queue = create_auto_capture({ read_settings: () => current_settings, run_capture: async () => { capture_count += 1; }, on_status() {}, on_complete() {}, delay_ms: 10 });
  current_settings = null;
  capture_queue.schedule_capture();
  await wait_for_timer(20);
  assert.equal(capture_count, 0);
  current_settings = { width_value: 768 };
  capture_queue.schedule_capture();
  capture_queue.dispose();
  await wait_for_timer(20);
  assert.equal(capture_count, 0);
});

test('busy server retries automatically and corrected settings recover after errors', async () => {
  let current_settings = { selector_value: '.original' };
  let capture_attempts = 0;
  let completed_count = 0;
  const capture_queue = create_auto_capture({ read_settings: () => current_settings, run_capture: async () => {
    capture_attempts += 1;
    if (capture_attempts === 1) throw Object.assign(new Error('Capture busy'), { retry_after_ms: 10 });
    if (capture_attempts === 2) throw new Error('Selector did not match');
  }, on_status() {}, on_complete() { completed_count += 1; }, delay_ms: 10 });
  current_settings = { selector_value: '.missing' };
  capture_queue.schedule_capture();
  await wait_for_timer(45);
  assert.equal(capture_attempts, 2);
  assert.equal(completed_count, 0);
  current_settings = { selector_value: '.correct' };
  capture_queue.schedule_capture();
  await wait_for_timer(25);
  assert.equal(capture_attempts, 3);
  assert.equal(completed_count, 1);
  capture_queue.dispose();
});
