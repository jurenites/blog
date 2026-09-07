import assert from 'node:assert/strict';
import test from 'node:test';
import { initialize_hero_glow } from '../src/slice/src/js/hero-glow.js';

function event_target() {
  return { event_handlers: {}, addEventListener(event_name, event_handler) { this.event_handlers[event_name] = event_handler; } };
}
function create_fixture(reduced_motion = false) {
  const motion_preference = { ...event_target(), matches: reduced_motion };
  const hover_preference = { ...event_target(), matches: true };
  const light_animations = [];
  const create_layer = () => ({ animate(key_frames, animation_options) {
    const animation_state = { key_frames, animation_options, playState: 'running',
      pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; }, cancel() { this.playState = 'idle'; } };
    light_animations.push(animation_state); return animation_state;
  } });
  const color_element = create_layer();
  const beam_elements = [create_layer(), create_layer()];
  const toggle_button = { ...event_target(), setAttribute(attribute_name, attribute_value) { this[attribute_name] = attribute_value; } };
  const owner_document = { ...event_target(), hidden: false, activeElement: null, defaultView: {
    matchMedia: (media_query) => media_query.includes('reduced-motion') ? motion_preference : hover_preference,
    getComputedStyle: () => ({ getPropertyValue: () => '2800ms' }),
  } };
  const hero_section = { ...event_target(), ownerDocument: owner_document, isConnected: true, has_focus: false,
    classList: { toggle() {} }, querySelector: (selector_text) => selector_text.includes('light-toggle') ? toggle_button : color_element,
    querySelectorAll: () => beam_elements,
    matches(selector_text) { return selector_text === '.hero-section--glow' || (selector_text === ':focus-within' && this.has_focus); },
  };
  initialize_hero_glow(hero_section);
  return { hero_section, owner_document, motion_preference, hover_preference, light_animations, toggle_button };
}

test('stationary hover runs endless hue and density journeys and resumes without restarting', () => {
  const { hero_section, light_animations, owner_document } = create_fixture();
  assert.equal(light_animations.length, 0);
  hero_section.event_handlers.pointerenter();
  assert.equal(light_animations.length, 3);
  assert.ok(light_animations.every((animation_item) => animation_item.animation_options.iterations === Infinity));
  assert.notEqual(light_animations[1].animation_options.duration, light_animations[2].animation_options.duration);
  hero_section.event_handlers.pointerleave();
  assert.ok(light_animations.every((animation_item) => animation_item.playState === 'paused'));
  hero_section.event_handlers.pointerenter();
  assert.equal(light_animations.length, 3);
  owner_document.hidden = true;
  owner_document.event_handlers.visibilitychange();
  assert.ok(light_animations.every((animation_item) => animation_item.playState === 'paused'));
});

test('touch toggle works without hover, turns off while focused, and honors reduced motion', () => {
  const { hero_section, hover_preference, toggle_button, owner_document, light_animations, motion_preference } = create_fixture();
  hover_preference.matches = false;
  owner_document.activeElement = toggle_button;
  hero_section.has_focus = true;
  toggle_button.event_handlers.click();
  assert.equal(toggle_button['aria-pressed'], 'true');
  assert.equal(light_animations.length, 3);
  toggle_button.event_handlers.click();
  assert.ok(light_animations.every((animation_item) => animation_item.playState === 'paused'));
  motion_preference.matches = true;
  motion_preference.event_handlers.change();
  assert.ok(light_animations.every((animation_item) => animation_item.playState === 'idle'));
  const reduced_fixture = create_fixture(true);
  reduced_fixture.hero_section.event_handlers.pointerenter();
  assert.equal(reduced_fixture.light_animations.length, 0);
});
