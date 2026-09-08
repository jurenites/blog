import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialize_message_timeout } from '../src/slice/src/js/message-toast.js';

function create_test_toast(message_type) {
  const message_element = new EventTarget();
  message_element.getAttribute = () => message_type;
  message_element.hover_active = false;
  message_element.focus_active = false;
  message_element.was_removed = false;
  message_element.matches = () => message_element.hover_active || message_element.focus_active;
  message_element.remove = () => { message_element.was_removed = true; };
  return message_element;
}

function install_test_clock(test_context) {
  let elapsed_time = 0;
  test_context.mock.timers.enable({ apis: ['setTimeout'] });
  test_context.mock.method(performance, 'now', () => elapsed_time);
  return (advance_duration) => {
    elapsed_time += advance_duration;
    test_context.mock.timers.tick(advance_duration);
  };
}

test('status expires at six seconds, warning at ten, errors persist', (test_context) => {
  const advance_clock = install_test_clock(test_context);
  const status_toast = create_test_toast('status');
  const warning_toast = create_test_toast('warning');
  const error_toast = create_test_toast('error');
  [status_toast, warning_toast, error_toast].forEach(initialize_message_timeout);
  advance_clock(5999);
  assert.equal(status_toast.was_removed, false);
  advance_clock(1);
  assert.equal(status_toast.was_removed, true);
  assert.equal(warning_toast.was_removed, false);
  advance_clock(4000);
  assert.equal(warning_toast.was_removed, true);
  advance_clock(60000);
  assert.equal(error_toast.was_removed, false);
});

test('hover and focus pause together, then resume the remaining duration', async (test_context) => {
  const advance_clock = install_test_clock(test_context);
  const status_toast = create_test_toast('status');
  initialize_message_timeout(status_toast);
  advance_clock(2000);
  status_toast.hover_active = true;
  status_toast.dispatchEvent(new Event('mouseenter'));
  advance_clock(20000);
  assert.equal(status_toast.was_removed, false);
  status_toast.focus_active = true;
  status_toast.dispatchEvent(new Event('focusin'));
  status_toast.hover_active = false;
  status_toast.dispatchEvent(new Event('mouseleave'));
  advance_clock(20000);
  assert.equal(status_toast.was_removed, false);
  status_toast.focus_active = false;
  status_toast.dispatchEvent(new Event('focusout'));
  await Promise.resolve();
  advance_clock(3999);
  assert.equal(status_toast.was_removed, false);
  advance_clock(1);
  assert.equal(status_toast.was_removed, true);
});

test('repeated Drupal behavior attachment does not restart the timer', (test_context) => {
  const advance_clock = install_test_clock(test_context);
  const status_toast = create_test_toast('status');
  initialize_message_timeout(status_toast);
  advance_clock(4000);
  initialize_message_timeout(status_toast);
  advance_clock(2000);
  assert.equal(status_toast.was_removed, true);
});
