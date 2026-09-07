import assert from 'node:assert/strict';
import test from 'node:test';
import { attach_layered_scene } from '../src/slice/src/js/layered-scene.js';

function create_fixture({ reduced_motion = false, arrival_enabled = true } = {}) {
  const event_handlers = {};
  const animation_calls = [];
  let notify_intersection;
  let resolve_background;
  let resolve_foreground;
  const background_image = { naturalWidth: 1600, decode: () => new Promise((resolve_image) => { resolve_background = resolve_image; }) };
  const foreground_image = { naturalWidth: 1600, decode: () => new Promise((resolve_image) => { resolve_foreground = resolve_image; }), animate(key_frames, animation_options) {
    const animation_state = { key_frames, animation_options, cancelled: false, cancel() { this.cancelled = true; }, pause() {}, play() {} };
    animation_calls.push(animation_state); return animation_state;
  } };
  const class_names = new Set();
  const scene_element = {
    dataset: { arrivalEnabled: String(arrival_enabled) }, isConnected: true, classList: { add: (class_name) => class_names.add(class_name) },
    querySelector: (selector_text) => selector_text.includes('background') ? background_image : foreground_image,
    ownerDocument: { hidden: false, addEventListener: (event_name, event_handler) => { event_handlers[event_name] = event_handler; }, defaultView: {
      matchMedia: () => ({ matches: reduced_motion, addEventListener() {} }),
      getComputedStyle: () => ({ getPropertyValue: (property_name) => property_name.includes('delay') ? '450ms' : '1100ms' }),
      IntersectionObserver: class { constructor(observer_handler) { notify_intersection = observer_handler; } observe() {} disconnect() {} },
    } },
  };
  const dispose_scene = attach_layered_scene(scene_element);
  return { scene_element, foreground_image, background_image, animation_calls, class_names, dispose_scene,
    load_images: async () => { resolve_background(); resolve_foreground(); await new Promise(setImmediate); },
    enter_view: () => notify_intersection([{ isIntersecting: true }]),
  };
}

test('waits for decoded images and visibility, animates only foreground, then holds without replay', async () => {
  const scene_fixture = create_fixture();
  assert.equal(scene_fixture.animation_calls.length, 1);
  await scene_fixture.load_images();
  assert.equal(scene_fixture.scene_element.dataset.sceneState, 'waiting');
  scene_fixture.enter_view();
  assert.equal(scene_fixture.animation_calls.length, 2);
  assert.equal(scene_fixture.animation_calls[1].animation_options.duration, 1100);
  scene_fixture.animation_calls[1].onfinish();
  scene_fixture.enter_view();
  assert.equal(scene_fixture.animation_calls.length, 2);
  assert.equal(scene_fixture.scene_element.dataset.sceneState, 'complete');
});

test('reduced motion and disabled animation show a static final scene', async () => {
  for (const fixture_options of [{ reduced_motion: true }, { arrival_enabled: false }]) {
    const scene_fixture = create_fixture(fixture_options);
    await scene_fixture.load_images();
    assert.equal(scene_fixture.animation_calls.length, 0);
    assert.equal(scene_fixture.scene_element.dataset.sceneState, 'complete');
  }
});

test('failed foreground leaves the fixed background; failed background leaves copy', async () => {
  const foreground_failure = create_fixture();
  foreground_failure.foreground_image.naturalWidth = 0;
  await foreground_failure.load_images();
  assert.equal(foreground_failure.foreground_image.hidden, true);
  const background_failure = create_fixture();
  background_failure.background_image.naturalWidth = 0;
  await background_failure.load_images();
  assert.ok(background_failure.class_names.has('has-background-error'));
});

test('Drupal detach cancels pending work even while image decoding is unfinished', async () => {
  const scene_fixture = create_fixture();
  scene_fixture.dispose_scene();
  await scene_fixture.load_images();
  scene_fixture.enter_view();
  assert.equal(scene_fixture.animation_calls.length, 1);
  assert.equal(scene_fixture.animation_calls[0].cancelled, true);
});
