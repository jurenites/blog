import assert from 'node:assert/strict';
import { test } from 'node:test';
import { install_icon_sprite } from '../src/slice/src/js/icon-sprite.js';

function sprite_fixture({ ready_state = 'loading', failure_count = 0 } = {}) {
  const event_handlers = new Map();
  const scheduled_tasks = [];
  const request_urls = [];
  const inserted_nodes = [];
  const sprite_marker = { dataset: { iconSpriteUrl: '/assets/icon-sprites/icons.1234567890abcdef.svg' } };
  const sprite_element = { localName: 'svg', classList: { contains: () => true } };
  const page_document = {
    readyState: ready_state,
    querySelector: () => sprite_marker,
    body: { prepend: (loaded_sprite) => inserted_nodes.push(loaded_sprite) },
    importNode: (loaded_sprite) => loaded_sprite,
  };
  const page_window = {
    location: new URL('https://example.test/blog'),
    addEventListener: (event_name, event_handler) => event_handlers.set(event_name, event_handler),
    setTimeout: (timeout_callback, delay_time) => { scheduled_tasks.push({ timeout_callback, delay_time }); return scheduled_tasks.length; },
    clearTimeout: () => {},
    DOMParser: class {
      parseFromString() { return { documentElement: sprite_element, querySelector: () => null }; }
    },
    fetch: async (request_url) => {
      request_urls.push(request_url);
      if (request_urls.length <= failure_count) throw new Error('temporary network failure');
      return new Response('<svg/>', { headers: { 'content-type': 'image/svg+xml' } });
    },
  };
  return { page_document, page_window, event_handlers, scheduled_tasks, request_urls, inserted_nodes, sprite_marker };
}
const settle_tasks = () => new Promise((resolve_test) => { setImmediate(resolve_test); });

test('first sprite request starts in a task after window load, with one fetch/insertion per document', async () => {
  const test_browser = sprite_fixture();
  const sprite_promise = install_icon_sprite(test_browser.page_window, test_browser.page_document);
  assert.equal(install_icon_sprite(test_browser.page_window, test_browser.page_document), sprite_promise);
  assert.equal(test_browser.request_urls.length, 0);
  test_browser.event_handlers.get('load')();
  assert.equal(test_browser.request_urls.length, 0);
  assert.equal(test_browser.inserted_nodes.length, 0);
  test_browser.scheduled_tasks.find((task_entry) => task_entry.delay_time === 0).timeout_callback();
  assert.equal(await sprite_promise, true);
  assert.equal(test_browser.request_urls.length, 1);
  assert.equal(test_browser.inserted_nodes.length, 1);
  assert.equal(test_browser.sprite_marker.dataset.iconSpriteState, 'ready');
});

test('already-loaded pages still yield before requesting their cached sprite', async () => {
  const test_browser = sprite_fixture({ ready_state: 'complete' });
  const sprite_promise = install_icon_sprite(test_browser.page_window, test_browser.page_document);
  assert.equal(test_browser.request_urls.length, 0);
  test_browser.scheduled_tasks[0].timeout_callback();
  assert.equal(await sprite_promise, true);
});

test('one transient failure retries once and inserts the successful response', async () => {
  const test_browser = sprite_fixture({ ready_state: 'complete', failure_count: 1 });
  const sprite_promise = install_icon_sprite(test_browser.page_window, test_browser.page_document);
  test_browser.scheduled_tasks[0].timeout_callback();
  await settle_tasks();
  test_browser.scheduled_tasks.find((task_entry) => task_entry.delay_time === 1500).timeout_callback();
  assert.equal(await sprite_promise, true);
  assert.equal(test_browser.request_urls.length, 2);
  assert.equal(test_browser.inserted_nodes.length, 1);
});

test('persistent failure resolves without an unhandled error or endless retries', async () => {
  const test_browser = sprite_fixture({ ready_state: 'complete', failure_count: 2 });
  const sprite_promise = install_icon_sprite(test_browser.page_window, test_browser.page_document);
  test_browser.scheduled_tasks[0].timeout_callback();
  await settle_tasks();
  test_browser.scheduled_tasks.find((task_entry) => task_entry.delay_time === 1500).timeout_callback();
  assert.equal(await sprite_promise, false);
  assert.equal(test_browser.request_urls.length, 2);
  assert.equal(test_browser.inserted_nodes.length, 0);
  assert.equal(test_browser.sprite_marker.dataset.iconSpriteState, 'failed');
});

test('missing configuration and cross-origin sprite URLs cause no request', async () => {
  for (const config_kind of ['missing', 'external']) {
    const test_browser = sprite_fixture({ ready_state: 'complete' });
    if (config_kind === 'missing') test_browser.page_document.querySelector = () => null;
    else test_browser.sprite_marker.dataset.iconSpriteUrl = 'https://external.test/icons.svg';
    assert.equal(await install_icon_sprite(test_browser.page_window, test_browser.page_document), false);
    assert.equal(test_browser.request_urls.length, 0);
  }
});
