import assert from 'node:assert/strict';
import { readFileSync as read_file_sync } from 'node:fs';
import { runInNewContext as run_in_new_context } from 'node:vm';
import { test as test_case } from 'node:test';

test_case('protected cards keep their link tag, attributes and raw artwork', () => {
  const raw_matchers = [];
  const conversion_rules = {};
  const editor_instance = {
    model: { schema: { register() {} } },
    data: { processor: { registerRawContentMatcher: preview_matcher => raw_matchers.push(preview_matcher) } },
    conversion: { for: conversion_name => ({
      elementToElement: conversion_rule => (conversion_rules[conversion_name] ||= []).push(conversion_rule),
    }) },
  };
  const ckeditor_api = { core: { Plugin: class {} }, widget: { Widget: class {}, toWidget() {} } };
  run_in_new_context(read_file_sync(new URL('../web/modules/custom/jurenites_admin/js/phone-preview.js', import.meta.url), 'utf8'), {
    window: { CKEditor5: ckeditor_api },
  });
  const preview_plugin = new ckeditor_api.phonePreview.PhonePreview();
  preview_plugin.editor = editor_instance;
  preview_plugin.init();

  for (const wrapper_name of ['a', 'div']) {
    const card_matcher = raw_matchers.find(preview_matcher => preview_matcher.name === wrapper_name && preview_matcher.attributes?.['data-cursor-card']);
    assert.ok(card_matcher, `Raw protection registered for ${wrapper_name} cards`);
    const upcast_rule = conversion_rules.upcast.find(conversion_rule => conversion_rule.view === card_matcher);
    const artwork_markup = '<span data-card-phone><svg viewBox="0 0 399 836"><image href="/screen.png"></image></svg><span data-screen-sequence><span data-screen-frame><video muted playsinline></video></span></span></span>';
    const wrapper_attributes = [['class', 'card card--thumbnail'], ['data-cursor-card', ''], ['aria-label', 'Read project']];
    if (wrapper_name === 'a') wrapper_attributes.push(['href', '/portfolio/project']);
    const model_element = upcast_rule.model({
      name: wrapper_name,
      getAttributes: () => wrapper_attributes,
      getCustomProperty: () => artwork_markup,
    }, { writer: { createElement: (_model_name, model_attributes) => ({ getAttribute: attribute_name => model_attributes[attribute_name] }) } });
    const output_element = {};
    conversion_rules.dataDowncast[0].view(model_element, { writer: {
      createRawElement: (element_name, element_attributes, render_content) => {
        assert.equal(element_name, wrapper_name);
        assert.deepEqual({ ...element_attributes }, Object.fromEntries(wrapper_attributes));
        render_content(output_element);
      },
    } });
    assert.equal(output_element.innerHTML, artwork_markup);
  }
  assert.ok(raw_matchers.some(preview_matcher => preview_matcher.attributes?.['data-phone-preview']));
  assert.ok(raw_matchers.some(preview_matcher => preview_matcher.attributes?.['data-scatchapp-sequence']));
});
