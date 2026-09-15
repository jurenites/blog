import assert from 'node:assert/strict';
import test from 'node:test';
import { initialize_company_sliders, detach_company_sliders } from '../src/slice/src/js/company-slider.js';

function slider_fixture({ reduced_motion = false, viewport_width = 800 } = {}) {
  let clock_time = 0;
  let callback_index = 0;
  const timer_callbacks = new Map();
  const frame_callbacks = new Map();
  const track_classes = new Set();
  const motion_query = Object.assign(new EventTarget(), { matches: reduced_motion });
  const slider_document = Object.assign(new EventTarget(), { hidden: false });
  let visibility_callback;
  const slider_window = Object.assign(new EventTarget(), {
    performance: { now: () => clock_time },
    matchMedia: () => motion_query,
    setTimeout: (timer_callback, delay_value) => {
      timer_callbacks.set(++callback_index, { timer_callback, due_time: clock_time + delay_value });
      return callback_index;
    },
    clearTimeout: (timer_id) => timer_callbacks.delete(timer_id),
    requestAnimationFrame: (frame_callback) => { frame_callbacks.set(++callback_index, frame_callback); return callback_index; },
    cancelAnimationFrame: (frame_id) => frame_callbacks.delete(frame_id),
    ResizeObserver: class { observe() {} disconnect() {} },
    IntersectionObserver: class {
      constructor(observer_callback) { visibility_callback = observer_callback; }
      observe() {}
      disconnect() {}
    },
  });
  slider_document.defaultView = slider_window;
  const track_element = Object.assign(new EventTarget(), {
    scrollLeft: 0, scrollWidth: 1536, clientWidth: viewport_width,
    classList: { add: (class_name) => track_classes.add(class_name), remove: (class_name) => track_classes.delete(class_name) },
    children: [],
  });
  track_element.children = Array.from({ length: 5 }, (_, item_index) => ({
    getBoundingClientRect: () => ({ left: 8 + item_index * 312 - track_element.scrollLeft }),
  }));
  track_element.firstElementChild = track_element.children[0];
  const slider_element = Object.assign(new EventTarget(), {
    ownerDocument: slider_document,
    querySelector: (selector_text) => selector_text === '[data-company-track]' ? track_element : null,
    contains: (candidate_element) => candidate_element === track_element,
  });
  const page_context = { querySelectorAll: () => [slider_element], contains: () => true };
  initialize_company_sliders(page_context);
  visibility_callback([{ isIntersecting: true }]);
  const advance_time = (elapsed_time) => {
    const ending_time = clock_time + elapsed_time;
    while (clock_time < ending_time) {
      clock_time = Math.min(ending_time, clock_time + 10);
      for (const [timer_id, timer_data] of [...timer_callbacks]) {
        if (timer_data.due_time <= clock_time) {
          timer_callbacks.delete(timer_id);
          timer_data.timer_callback();
        }
      }
      const queued_frames = [...frame_callbacks.values()];
      frame_callbacks.clear();
      queued_frames.forEach((frame_callback) => frame_callback(clock_time));
    }
  };
  return { page_context, track_element, slider_element, slider_document, motion_query, advance_time, timer_callbacks, frame_callbacks, visibility_callback, track_classes };
}

test('autoplay holds, eases one card at a time, and reverses at both ends without clones', () => {
  const slider_state = slider_fixture();
  const { track_element, advance_time } = slider_state;
  advance_time(2990);
  assert.equal(track_element.scrollLeft, 0);
  advance_time(360);
  assert(track_element.scrollLeft > 0 && track_element.scrollLeft < 312, 'Transition has intermediate positions');
  assert(slider_state.track_classes.has('company-slider__track--animating'));
  advance_time(350);
  assert.equal(track_element.scrollLeft, 312);
  assert.equal(slider_state.track_classes.size, 0);
  const resting_offsets = [312];
  for (let step_index = 0; step_index < 6; step_index += 1) {
    advance_time(3700);
    resting_offsets.push(track_element.scrollLeft);
  }
  assert.deepEqual(resting_offsets, [312, 624, 736, 624, 312, 0, 312]);
  assert.equal(track_element.children.length, 5);
  detach_company_sliders(slider_state.page_context);
});

test('hover, focus, offscreen state and reduced motion suspend autoplay; detach clears work', () => {
  const slider_state = slider_fixture();
  const pointer_event = Object.assign(new Event('pointerenter'), { pointerType: 'mouse' });
  slider_state.slider_element.dispatchEvent(pointer_event);
  slider_state.advance_time(10000);
  assert.equal(slider_state.track_element.scrollLeft, 0);
  slider_state.slider_element.dispatchEvent(new Event('pointerleave'));
  slider_state.advance_time(3700);
  assert.equal(slider_state.track_element.scrollLeft, 312);
  slider_state.slider_element.dispatchEvent(new Event('focusin'));
  slider_state.advance_time(10000);
  assert.equal(slider_state.track_element.scrollLeft, 312);
  slider_state.slider_element.dispatchEvent(Object.assign(new Event('focusout'), { relatedTarget: null }));
  slider_state.visibility_callback([{ isIntersecting: false }]);
  slider_state.advance_time(10000);
  assert.equal(slider_state.track_element.scrollLeft, 312);
  slider_state.visibility_callback([{ isIntersecting: true }]);
  slider_state.motion_query.matches = true;
  slider_state.motion_query.dispatchEvent(new Event('change'));
  slider_state.advance_time(10000);
  assert.equal(slider_state.track_element.scrollLeft, 312);
  detach_company_sliders(slider_state.page_context);
  assert.equal(slider_state.timer_callbacks.size, 0);
  assert.equal(slider_state.frame_callbacks.size, 0);
});

test('a row that fits and an initial reduced-motion preference never start autoplay', () => {
  for (const fixture_options of [{ viewport_width: 1600 }, { reduced_motion: true }]) {
    const slider_state = slider_fixture(fixture_options);
    slider_state.advance_time(15000);
    assert.equal(slider_state.track_element.scrollLeft, 0);
    assert.equal(slider_state.timer_callbacks.size, 0);
    detach_company_sliders(slider_state.page_context);
  }
});
