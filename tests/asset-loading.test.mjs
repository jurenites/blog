import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { build_icon_sprite } from '../scripts/build-icon-sprite.mjs';
import { can_warm_assets, public_page_url, install_asset_warming } from '../src/slice/src/js/asset-warming.js';

function link_fixture(link_path, extra_attributes = {}) {
  const link_attributes = { href: link_path, ...extra_attributes };
  return {
    href: new URL(link_path, 'https://example.test').href,
    getAttribute: (attribute_name) => link_attributes[attribute_name] ?? null,
    hasAttribute: (attribute_name) => attribute_name in link_attributes,
    closest: (selector_name) => selector_name === '[data-no-prefetch]' ? null : link_fixture(link_path),
    matches: () => false,
  };
}

function browser_fixture({ saved_data = false, response_headers = {}, response_source = '<html></html>' } = {}) {
  const document_events = new Map();
  const window_events = new Map();
  const fetch_requests = [];
  const appended_hints = [];
  const asset_sources = [
    ['SCRIPT', '/shared.js'], ['SCRIPT', '/future.js'], ['LINK', '/future.css'],
    ['IMG', 'https://external.test/photo.jpg'], ['IMG', '/photo.jpg'],
    ['IMG', '/photo.jpg'], ['IMG', '/second.jpg'], ['IMG', '/third.jpg'],
  ];
  const page_document = {
    readyState: 'loading', visibilityState: 'visible', documentElement: { dataset: {} },
    body: { classList: { contains: () => false } },
    head: { appendChild: (hint_element) => appended_hints.push(hint_element) },
    addEventListener: (event_name, event_handler) => document_events.set(event_name, event_handler),
    querySelectorAll: () => [link_fixture('/about')],
    createElement: (tag_name) => tag_name === 'template' ? {
      content: { querySelectorAll: () => asset_sources.map(([asset_tag, asset_path]) => ({
        tagName: asset_tag, getAttribute: () => asset_path,
      })) },
    } : { relList: { supports: () => true }, dataset: {}, setAttribute: () => {} },
  };
  const page_window = {
    navigator: { onLine: true, connection: { saveData: saved_data, effectiveType: '4g' } },
    location: new URL('https://example.test/blog'),
    performance: { getEntriesByName: (asset_url) => asset_url.endsWith('/shared.js') ? [{}] : [] },
    setTimeout, clearTimeout,
    addEventListener: (event_name, event_handler) => window_events.set(event_name, event_handler),
    requestIdleCallback: (idle_callback) => idle_callback(),
    fetch: async (page_url, request_options) => {
      fetch_requests.push({ page_url, request_options });
      return new Response(response_source, { headers: { 'content-type': 'text/html', ...response_headers } });
    },
  };
  return { page_window, page_document, document_events, window_events, fetch_requests, appended_hints };
}

const settle_requests = () => new Promise((resolve_test) => { setImmediate(resolve_test); });

test('sprite contains every source icon with unique fragment IDs and preserved geometry', async () => {
  const sprite_source = await build_icon_sprite();
  const icon_files = (await readdir(new URL('../src/public/assets/icons/', import.meta.url))).filter((file_name) => file_name.endsWith('.svg'));
  for (const file_name of icon_files) assert.ok(sprite_source.includes(`id="jurenites-icon-${file_name.replace('.svg', '')}"`));
  const symbol_ids = [...sprite_source.matchAll(/\bid="([^"]+)"/g)].map((id_match) => id_match[1]);
  assert.equal(new Set(symbol_ids).size, symbol_ids.length);
  for (const reference_match of sprite_source.matchAll(/url\(#([^)]+)\)/g)) assert.ok(symbol_ids.includes(reference_match[1]));
  assert.match(sprite_source, /id="jurenites-icon-chevron-down"[^>]*fill="none"/);
  assert.match(sprite_source, /viewBox="0 0 1000 1000"/);
  assert.doesNotMatch(sprite_source, /<style|class="st\d|#[0-9a-f]{6}\b/i);
  const sprite_directory = new URL('../web/themes/custom/jurenites_theme/assets/icon-sprites/', import.meta.url);
  const { asset_name } = JSON.parse(await readFile(new URL('manifest.json', sprite_directory), 'utf8'));
  assert.match(asset_name, /^icons\.[a-f0-9]{16}\.svg$/);
  assert.equal(sprite_source, await readFile(new URL(asset_name, sprite_directory), 'utf8'));
  const html_template = await readFile(new URL('../web/themes/custom/jurenites_theme/templates/layout/html.html.twig', import.meta.url), 'utf8');
  assert.doesNotMatch(html_template, /icon-sprite\.html|<symbol/);
});

test('speculation excludes actions, downloads, external destinations and current page', () => {
  for (const link_path of ['/admin/content', '/user/logout', '/node/1/edit', '/blog?tag=font', '/blog#item', '/file.zip', 'https://external.test/about', '/blog']) {
    assert.equal(public_page_url(link_fixture(link_path), 'https://example.test/blog'), null, link_path);
  }
  assert.equal(public_page_url(link_fixture('/about', { download: '' }), 'https://example.test/blog'), null);
  assert.equal(public_page_url(link_fixture('/about'), 'https://example.test/blog'), 'https://example.test/about');
});

test('offline, hidden, signed-in and slow/data-saving connections do not warm assets', () => {
  const { page_document, page_window } = browser_fixture();
  assert.equal(can_warm_assets(page_window.navigator, page_document), true);
  for (const effective_type of ['slow-2g', '2g', '3g']) assert.equal(can_warm_assets({ connection: { effectiveType: effective_type } }, page_document), false);
  assert.equal(can_warm_assets({ connection: { saveData: true } }, page_document), false);
  assert.equal(can_warm_assets({ onLine: false }, page_document), false);
  page_document.visibilityState = 'hidden';
  assert.equal(can_warm_assets({}, page_document), false);
  page_document.visibilityState = 'visible';
  page_document.body.classList.contains = () => true;
  assert.equal(can_warm_assets({}, page_document), false);
});

test('warms only after load, deduplicates assets, limits images and warms at most two pages', async () => {
  const test_browser = browser_fixture();
  install_asset_warming(test_browser.page_window, test_browser.page_document);
  install_asset_warming(test_browser.page_window, test_browser.page_document);
  assert.equal(test_browser.fetch_requests.length, 0);
  test_browser.window_events.get('load')();
  await settle_requests();
  assert.equal(test_browser.fetch_requests.length, 1);
  assert.deepEqual(test_browser.appended_hints.map((hint_element) => hint_element.href), [
    'https://example.test/future.js', 'https://example.test/future.css',
    'https://example.test/photo.jpg', 'https://example.test/second.jpg',
  ]);
  for (const link_path of ['/about', '/portfolio', '/contact']) {
    test_browser.document_events.get('focusin')({ target: link_fixture(link_path) });
    await settle_requests();
  }
  assert.equal(test_browser.fetch_requests.length, 2);
  assert.equal(test_browser.appended_hints.length, 5);
});

test('private, no-store and oversized responses do not warm dependent assets', async () => {
  for (const test_options of [
    { response_headers: { 'cache-control': 'private' } },
    { response_headers: { 'cache-control': 'no-store' } },
    { response_source: 'x'.repeat(262145) },
    { saved_data: true },
  ]) {
    const test_browser = browser_fixture(test_options);
    install_asset_warming(test_browser.page_window, test_browser.page_document);
    test_browser.window_events.get('load')();
    await settle_requests();
    assert.equal(test_browser.appended_hints.length, 0);
  }
});

test('failed speculation does not prevent a later navigation-intent request', async () => {
  const test_browser = browser_fixture();
  let request_count = 0;
  test_browser.page_window.fetch = async () => { request_count += 1; throw new Error('offline'); };
  install_asset_warming(test_browser.page_window, test_browser.page_document);
  test_browser.window_events.get('load')();
  await settle_requests();
  test_browser.document_events.get('focusin')({ target: link_fixture('/portfolio') });
  await settle_requests();
  assert.equal(request_count, 2);
});
