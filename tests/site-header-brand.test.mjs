import assert from 'node:assert/strict';
import test from 'node:test';
import { enable_site_header_brand } from '../src/slice/src/js/site-header-brand.js';

function create_brand_fixture(test_context, reduced_motion = false) {
  test_context.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  const class_names = new Set();
  const event_handlers = new Map();
  let hover_active = false;
  let focus_active = false;
  const token_values = {
    '--component-site-header-brand-name-reveal-duration-default': '325ms',
    '--component-site-header-brand-name-reveal-stagger-default': '25ms',
    '--component-site-header-brand-name-hold-duration-default': '2000ms',
  };
  const brand_link = {
    ownerDocument: { defaultView: {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
      performance: { now: () => Date.now() },
      getComputedStyle: () => ({ getPropertyValue: (token_name) => token_values[token_name] }),
      matchMedia: () => ({ matches: reduced_motion }),
    } },
    classList: {
      add: (class_name) => class_names.add(class_name),
      remove: (class_name) => class_names.delete(class_name),
      contains: (class_name) => class_names.has(class_name),
    },
    querySelectorAll: () => Array(15),
    matches: (selector_text) => selector_text === ':focus-visible'
      ? focus_active : hover_active || focus_active,
    addEventListener: (event_name, event_handler) => {
      assert.ok(!event_handlers.has(event_name), 'initialization must not duplicate listeners');
      event_handlers.set(event_name, event_handler);
    },
  };
  enable_site_header_brand(brand_link);
  enable_site_header_brand(brand_link);
  return {
    is_revealed: () => class_names.has('is-brand-revealed'),
    advance_time: (elapsed_time) => test_context.mock.timers.tick(elapsed_time),
    hover_brand: (next_hover) => {
      hover_active = next_hover;
      event_handlers.get(next_hover ? 'pointerenter' : 'pointerleave')();
    },
    focus_brand: (next_focus) => {
      focus_active = next_focus;
      event_handlers.get(next_focus ? 'focus' : 'blur')();
    },
  };
}

test('brief hover finishes the entire 675ms reveal before the two-second hold', (test_context) => {
  const brand_fixture = create_brand_fixture(test_context);
  brand_fixture.hover_brand(true);
  brand_fixture.advance_time(10);
  brand_fixture.hover_brand(false);
  brand_fixture.advance_time(2664);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.advance_time(1);
  assert.ok(!brand_fixture.is_revealed());
  brand_fixture.hover_brand(true);
  assert.ok(brand_fixture.is_revealed(), 'a later hover triggers another reveal');
});

test('reentering cancels closure and continued hover stays open', (test_context) => {
  const brand_fixture = create_brand_fixture(test_context);
  brand_fixture.hover_brand(true);
  brand_fixture.advance_time(1000);
  brand_fixture.hover_brand(false);
  brand_fixture.advance_time(1900);
  brand_fixture.hover_brand(true);
  brand_fixture.advance_time(5000);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.hover_brand(false);
  brand_fixture.advance_time(1999);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.advance_time(1);
  assert.ok(!brand_fixture.is_revealed());
});

test('keyboard focus and hover independently keep the name open', (test_context) => {
  const brand_fixture = create_brand_fixture(test_context);
  brand_fixture.focus_brand(true);
  brand_fixture.hover_brand(true);
  brand_fixture.focus_brand(false);
  brand_fixture.advance_time(5000);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.focus_brand(true);
  brand_fixture.hover_brand(false);
  brand_fixture.advance_time(5000);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.focus_brand(false);
  brand_fixture.advance_time(2000);
  assert.ok(!brand_fixture.is_revealed());
});

test('reduced motion holds for two seconds without waiting for animation', (test_context) => {
  const brand_fixture = create_brand_fixture(test_context, true);
  brand_fixture.hover_brand(true);
  brand_fixture.hover_brand(false);
  brand_fixture.advance_time(1999);
  assert.ok(brand_fixture.is_revealed());
  brand_fixture.advance_time(1);
  assert.ok(!brand_fixture.is_revealed());
});
