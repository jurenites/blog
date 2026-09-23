import { ICON_SHAPES } from '../generated/icons/icon-markup.js';
import { CLOSE_ICON_SVG, CHEVRON_ICON_SVG } from '../generated/icons/control-icons.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
import { build_icon_sprite } from '../scripts/build-icon-sprite.mjs';
import { can_warm_assets, public_page_url } from '../src/slice/src/js/asset-warming.js';

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

test('sprite contains every source icon with unique fragment IDs and preserved geometry', async () => {
  const sprite_source = await build_icon_sprite();
  const icon_files = (await readdir(new URL('../src/public/assets/icons/', import.meta.url))).filter((file_name) => file_name.endsWith('.svg'));
  for (const file_name of icon_files) {
    const icon_name = file_name.replace('.svg', '');
    const source_svg = await readFile(new URL(`../src/public/assets/icons/${file_name}`, import.meta.url), 'utf8');
    const source_viewbox = source_svg.match(/viewBox="[^"]+"/)[0];
    const symbol_start = sprite_source.indexOf(`<symbol id="jurenites-icon-${icon_name}"`);
    assert.notEqual(symbol_start, -1);
    assert.ok(sprite_source.slice(symbol_start, sprite_source.indexOf('>', symbol_start)).includes(source_viewbox), file_name);
  }
  const symbol_ids = [...sprite_source.matchAll(/\bid="([^"]+)"/g)].map((id_match) => id_match[1]);
  assert.equal(new Set(symbol_ids).size, symbol_ids.length);
  for (const reference_match of sprite_source.matchAll(/url\(#([^)]+)\)/g)) assert.ok(symbol_ids.includes(reference_match[1]));
  assert.match(sprite_source, /id="jurenites-icon-chevron-down"[^>]*fill="none"/);
  assert.doesNotMatch(sprite_source, /<style|class="st\d/i);
  assert.doesNotMatch(sprite_source, /\sstyle="/);
  assert.match(sprite_source, /<mask[^>]*mask-type="luminance"/);
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
  const page_document = { visibilityState: 'visible', body: { classList: { contains: () => false } } };
  const page_window = { navigator: { onLine: true } };
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

test('initial control geometry remains available without any sprite or external request', () => {
  for (const control_shape of [CLOSE_ICON_SVG, CHEVRON_ICON_SVG]) {
    assert.match(control_shape, /<svg[^>]+viewBox="0 0 24 24"/);
    assert.match(control_shape, /<path[^>]+d="[^"]+"/);
    assert.doesNotMatch(control_shape, /<use|href=|__ICON_/);
  }
  assert.match(CHEVRON_ICON_SVG, /stroke="currentColor"/);
});

test('each initial icon renders its own geometry with scoped internal references', async () => {
  const icon_files = (await readdir(new URL('../src/public/assets/icons/', import.meta.url))).filter((file_name) => file_name.endsWith('.svg'));
  assert.equal(Object.keys(ICON_SHAPES).length, icon_files.length);
  for (const icon_shape of Object.values(ICON_SHAPES)) {
    assert.match(icon_shape, /<svg/);
    assert.doesNotMatch(icon_shape, /<use[^>]+href="#jurenites-icon-/);
    for (const reference_match of icon_shape.matchAll(/url\(#([^)]+)\)/g)) {
      assert.ok(reference_match[1].includes('__ICON_INSTANCE__'));
      assert.ok(icon_shape.includes(`id="${reference_match[1]}"`));
    }
  }
  const cookie_template = await readFile(new URL('../web/themes/custom/jurenites_theme/templates/block/block--jurenites-theme-cookie-policy-notice.html.twig', import.meta.url), 'utf8');
  assert.match(cookie_template, /<button[^>]+cookie-policy-notice__close/);
  assert.match(cookie_template, /icon_name: 'cross-big'/);
});
