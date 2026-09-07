import assert from 'node:assert/strict';
import test from 'node:test';
import { initialize_hero_glow } from '../src/slice/src/js/hero-glow.js';

function create_target() {
  return {
    event_handlers: {},
    addEventListener(event_name, event_handler) { this.event_handlers[event_name] = event_handler; },
  };
}

function create_fixture(reduced_motion = false) {
  const motion_preference = { ...create_target(), matches: reduced_motion };
  const hover_preference = { ...create_target(), matches: true };
  const color_animations = [];
  const ray_element = {
    animate(key_frames, animation_options) {
      const animation_state = {
        key_frames, animation_options, playState: 'running',
        pause() { this.playState = 'paused'; },
        play() { this.playState = 'running'; },
        cancel() { this.playState = 'idle'; },
      };
      color_animations.push(animation_state);
      return animation_state;
    },
  };
  const owner_document = {
    ...create_target(), hidden: false,
    defaultView: {
      matchMedia: (media_query) => media_query.includes('reduced-motion') ? motion_preference : hover_preference,
      getComputedStyle: () => ({ getPropertyValue: (property_name) => property_name.includes('softness') ? '12px' : '2800ms' }),
    },
  };
  const hero_section = {
    ...create_target(), ownerDocument: owner_document, isConnected: true, has_focus: false,
    querySelector: () => ray_element,
    matches(selector_text) { return selector_text === '.hero-section--glow' || (selector_text === ':focus-within' && this.has_focus); },
  };
  initialize_hero_glow(hero_section);
  return { hero_section, owner_document, motion_preference, color_animations };
}

test('screen colors run only during interaction and pause when the page is hidden', async () => {
  const { hero_section, owner_document, color_animations } = create_fixture();
  assert.equal(color_animations.length, 0);
  hero_section.event_handlers.pointerenter();
  const first_animation = color_animations[0];
  assert.equal(first_animation.playState, 'running');
  assert.ok(first_animation.animation_options.duration >= 2240);
  assert.ok(first_animation.animation_options.duration <= 3920);
  owner_document.hidden = true;
  owner_document.event_handlers.visibilitychange();
  assert.equal(first_animation.playState, 'paused');
  owner_document.hidden = false;
  owner_document.event_handlers.visibilitychange();
  assert.equal(first_animation.playState, 'running');
  hero_section.event_handlers.pointerleave();
  assert.equal(first_animation.playState, 'paused');
  hero_section.has_focus = true;
  hero_section.event_handlers.focusin();
  assert.equal(first_animation.playState, 'running');
  hero_section.has_focus = false;
  hero_section.event_handlers.focusout();
  await Promise.resolve();
  assert.equal(first_animation.playState, 'paused');
});

test('color journeys join continuously, and reduced motion removes animated color', () => {
  const { hero_section, motion_preference, color_animations } = create_fixture();
  hero_section.event_handlers.pointerenter();
  const first_animation = color_animations[0];
  first_animation.onfinish();
  assert.equal(color_animations[1].key_frames[0].filter, first_animation.key_frames[1].filter);
  assert.equal(first_animation.playState, 'idle');
  motion_preference.matches = true;
  motion_preference.event_handlers.change();
  assert.equal(color_animations[1].playState, 'idle');
  const reduced_fixture = create_fixture(true);
  reduced_fixture.hero_section.event_handlers.pointerenter();
  assert.equal(reduced_fixture.color_animations.length, 0);
});
