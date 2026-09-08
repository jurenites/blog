import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';

const ICON_DIRECTORY = new URL('../src/public/assets/icons/', import.meta.url);

// Source geometry stays editable as separate files; every consumer gets the same symbols.
export async function build_icon_sprite(icon_directory = ICON_DIRECTORY) {
  const icon_files = (await readdir(icon_directory)).filter((file_name) => file_name.endsWith('.svg')).sort();
  const sprite_symbols = await Promise.all(icon_files.map(async (file_name) => {
    const icon_name = file_name.replace(/\.svg$/, '');
    const icon_source = await readFile(new URL(file_name, icon_directory), 'utf8');
    const root_match = icon_source.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/);
    if (!root_match || !/viewBox="[^"]+"/.test(root_match[1])) {
      throw new Error(`Icon needs an SVG root and viewBox: ${file_name}`);
    }
    const symbol_attributes = root_match[1].replace(/\s(?:width|height|xmlns|id|aria-labelledby)="[^"]*"/g, '');
    let symbol_content = root_match[2];
    // Namespace clip paths and other internal references so files cannot collide.
    symbol_content = symbol_content.replace(/\bid="([^"]+)"/g, `id="jurenites-${icon_name}-$1"`)
      .replace(/url\(#([^)]+)\)/g, `url(#jurenites-${icon_name}-$1)`)
      .replace(/href="#([^"]+)"/g, `href="#jurenites-${icon_name}-$1"`);
    // Avoid global style selectors leaking out of inline SVGs. The source's simple
    // fill classes become SVG presentation attributes, including token variables.
    symbol_content = symbol_content.replace(/<style>[\s\S]*?<\/style>/g, '');
    for (const style_rule of root_match[2].matchAll(/\.([\w-]+)\s*\{\s*fill:\s*([^;]+);\s*\}/g)) {
      symbol_content = symbol_content.replaceAll(`class="${style_rule[1]}"`, `fill="${style_rule[2].trim()}"`);
    }
    return `<symbol id="jurenites-icon-${icon_name}"${symbol_attributes}>${symbol_content.trim()}</symbol>`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon-sprite" aria-hidden="true" focusable="false">\n${sprite_symbols.join('\n')}\n</svg>\n`;
}

// The content hash changes the URL only when icon geometry changes.
export async function write_icon_sprite_assets(output_directory) {
  const sprite_source = await build_icon_sprite();
  const content_hash = createHash('sha256').update(sprite_source).digest('hex').slice(0, 16);
  const asset_name = `icons.${content_hash}.svg`;
  await mkdir(output_directory, { recursive: true });
  await writeFile(resolve(output_directory, asset_name), sprite_source);
  await writeFile(resolve(output_directory, 'manifest.json'), `${JSON.stringify({ asset_name })}\n`);
  return asset_name;
}

export async function storybook_sprite_placeholder() {
  const manifest_source = await readFile(new URL('../generated/storybook/assets/icon-sprites/manifest.json', import.meta.url), 'utf8');
  const { asset_name } = JSON.parse(manifest_source);
  if (!/^icons\.[a-f0-9]{16}\.svg$/.test(asset_name)) throw new Error('Invalid sprite manifest');
  return `<span hidden data-icon-sprite-url="./assets/icon-sprites/${asset_name}"></span>`;
}
