import assert from 'node:assert/strict';
import test from 'node:test';
import { initialize_hero_sections } from '../src/slice/src/js/hero-section.js';

// Small DOM fixture keeps keyboard and progressive-enhancement tests independent
// of Storybook. Actual desktop/mobile geometry is checked in the browser.
function create_element() {
  return {
    attributes: {}, listeners: {}, dataset: {}, hidden: false, tabIndex: 0,
    setAttribute(attribute_name, attribute_value) { this.attributes[attribute_name] = attribute_value; },
    addEventListener(event_name, event_handler) { this.listeners[event_name] = event_handler; },
    focus() { this.was_focused = true; },
  };
}

function create_hero(slide_count) {
  const hero_element = create_element();
  hero_element.slide_panels = Array.from({ length: slide_count }, create_element);
  hero_element.slide_buttons = Array.from({ length: slide_count }, create_element);
  hero_element.slide_navigation = create_element();
  hero_element.slide_navigation.hidden = true;
  hero_element.querySelectorAll = (selector_text) => {
    if (selector_text === '[data-hero-panel]') return hero_element.slide_panels;
    if (selector_text === '[data-hero-select]') return hero_element.slide_buttons;
    return [];
  };
  hero_element.querySelector = () => hero_element.slide_navigation;
  hero_element.matches = (selector_text) => selector_text === '[data-hero-section]';
  return hero_element;
}

test('manual selection exposes only the selected panel and its tab stop', () => {
  const hero_element = create_hero(3);
  initialize_hero_sections(hero_element);
  assert.deepEqual(hero_element.slide_panels.map((slide_panel) => slide_panel.hidden), [false, true, true]);
  hero_element.slide_buttons[2].listeners.click();
  assert.deepEqual(hero_element.slide_panels.map((slide_panel) => slide_panel.hidden), [true, true, false]);
  assert.deepEqual(hero_element.slide_buttons.map((slide_button) => slide_button.tabIndex), [-1, -1, 0]);
  assert.equal(hero_element.slide_buttons[2].attributes['aria-selected'], 'true');
  assert.equal(hero_element.slide_buttons[2].attributes['aria-controls'], hero_element.slide_panels[2].id);
});

test('keyboard navigation wraps, supports Home/End and follows RTL direction', () => {
  const hero_element = create_hero(3);
  let text_direction = 'ltr';
  const original_styles = globalThis.getComputedStyle;
  globalThis.getComputedStyle = () => ({ direction: text_direction });
  try {
    initialize_hero_sections(hero_element);
    const press_key = (button_index, key_name) => hero_element.slide_buttons[button_index].listeners.keydown({ key: key_name, preventDefault() {} });
    press_key(0, 'ArrowLeft');
    assert.equal(hero_element.slide_panels[2].hidden, false);
    assert.equal(hero_element.slide_buttons[2].was_focused, true);
    press_key(2, 'Home');
    assert.equal(hero_element.slide_panels[0].hidden, false);
    press_key(0, 'End');
    assert.equal(hero_element.slide_panels[2].hidden, false);
    text_direction = 'rtl';
    press_key(2, 'ArrowRight');
    assert.equal(hero_element.slide_panels[1].hidden, false);
  } finally {
    if (original_styles) globalThis.getComputedStyle = original_styles;
    else delete globalThis.getComputedStyle;
  }
});

test('multiple block instances have independent controls and repeated attachment preserves selection', () => {
  const first_hero = create_hero(2);
  const second_hero = create_hero(2);
  initialize_hero_sections({ querySelectorAll: () => [first_hero, second_hero] });
  first_hero.slide_buttons[1].listeners.click();
  initialize_hero_sections(first_hero);
  assert.equal(first_hero.slide_panels[1].hidden, false);
  assert.equal(second_hero.slide_panels[0].hidden, false);
  assert.notEqual(first_hero.slide_panels[0].id, second_hero.slide_panels[0].id);
});

test('one slide hides navigation; incomplete or empty markup remains readable', () => {
  const single_hero = create_hero(1);
  initialize_hero_sections(single_hero);
  assert.equal(single_hero.slide_navigation.hidden, true);
  assert.equal(single_hero.slide_panels[0].hidden, false);
  const incomplete_hero = create_hero(2);
  incomplete_hero.slide_buttons.pop();
  initialize_hero_sections(incomplete_hero);
  assert.equal(incomplete_hero.dataset.heroInitialized, undefined);
  assert.ok(incomplete_hero.slide_panels.every((slide_panel) => !slide_panel.hidden));
  assert.doesNotThrow(() => initialize_hero_sections(create_hero(0)));
});
