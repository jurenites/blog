/** Generate editable vectors and the outlined, three-depth Drupal thumbnail. */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import opentype from 'opentype.js';
import { TOKEN_RECORDS } from '../generated/token/tokens.js';

const project_root = new URL('../', import.meta.url);
const asset_directory = new URL('src/public/assets/images/projects/visual-testing/', project_root);
const token_values = new Map(TOKEN_RECORDS.map((token_record) => [token_record.name, token_record.value]));
const palette_color = (color_name) => token_values.get(`color-palette-${color_name}`);
const display_font = opentype.parse((await readFile(new URL('src/public/assets/fonts/opensans-bold.woff', project_root))).buffer);
const detail_font = opentype.parse((await readFile(new URL('src/public/assets/fonts/opensans-regular.woff', project_root))).buffer);
const escape_xml = (text_value) => text_value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

function text_markup(text_value, text_x, text_y, font_size, color_name, is_bold, editable_text) {
  const font_face = is_bold ? display_font : detail_font;
  const fill_color = palette_color(color_name);
  if (editable_text) return `<text x="${text_x}" y="${text_y}" font-family="${is_bold ? 'Open Sans' : 'Open Sans'}" font-weight="${is_bold ? 700 : 400}" font-size="${font_size}" fill="${fill_color}">${escape_xml(text_value)}</text>`;
  return `<path d="${font_face.getPath(text_value, text_x, text_y, font_size).toPathData(2)}" fill="${fill_color}"/>`;
}

function artwork_markup(editable_text) {
  const draw_text = (...text_args) => text_markup(...text_args, editable_text);
  const draw_rect = (rect_x, rect_y, rect_width, rect_height, color_name, extra_attrs = '') => `<rect x="${rect_x}" y="${rect_y}" width="${rect_width}" height="${rect_height}" fill="${palette_color(color_name)}" ${extra_attrs}/>`;
  const draw_line = (start_x, start_y, end_x, end_y, color_name, extra_attrs = '') => `<path d="M${start_x} ${start_y}H${end_x}V${end_y}" fill="none" stroke="${palette_color(color_name)}" ${extra_attrs}/>`;
  const panel_markup = (depth_number, panel_x, panel_y, source_name, source_caption, accent_name, surface_name) => `<g id="level_${depth_number}">
    <title>${source_name} — depth ${depth_number}</title>
    ${draw_rect(panel_x + 8, panel_y + 16, 496, 272, 'full-black', 'opacity="0.22"')}
    ${draw_rect(panel_x, panel_y, 496, 272, surface_name)}
    ${draw_rect(panel_x, panel_y, 4, 64, accent_name)}
    ${draw_text(`0${depth_number}`, panel_x + 24, panel_y + 40, 18, accent_name, false)}
    ${draw_text(source_name, panel_x + 64, panel_y + 40, 24, 'white', true)}
    ${draw_text(source_caption, panel_x + 24, panel_y + 88, 12, 'light-gray', false)}
    ${draw_line(panel_x + 24, panel_y + 104, panel_x + 472, panel_y + 104, 'gray', 'opacity="0.45"')}
    ${draw_rect(panel_x + 24, panel_y + 128, 272, 104, surface_name, `stroke="${palette_color(accent_name)}" stroke-dasharray="4 4" opacity="0.8"`)}
    ${draw_rect(panel_x + 40, panel_y + 152, 240, 56, accent_name)}
    ${draw_text('Review component', panel_x + 64, panel_y + 188, 16, 'dark-black', true)}
    ${draw_text('Button', panel_x + 328, panel_y + 152, 14, 'white', false)}
    ${draw_text('default', panel_x + 328, panel_y + 176, 12, 'light-gray', false)}
    ${draw_line(panel_x + 328, panel_y + 200, panel_x + 448, panel_y + 200, 'gray')}
    ${draw_text('1:1 capture', panel_x + 328, panel_y + 224, 12, accent_name, false)}
  </g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
<title>Visual testing — three sources, one component</title>
<desc>Three editable sibling layers: Figma design, isolated Storybook component and the live website. The website animates their depth on pointer movement.</desc>
<defs><radialGradient id="background_highlight" cx="0" cy="0" r="1" gradientUnits="objectBoundingBox"><stop stop-color="${palette_color('brand-primary')}" stop-opacity="0.16"/><stop offset="1" stop-color="${palette_color('black')}" stop-opacity="0"/></radialGradient></defs>
<g id="background">${draw_rect(0, 0, 800, 800, 'dark-black')}<rect width="800" height="800" fill="url(#background_highlight)"/></g>
<g id="fixed-editorial-heading">
${draw_text('DESIGN ENGINEERING / 01', 48, 56, 14, 'brand-primary', false)}
${draw_text('Visual testing', 48, 128, 56, 'white', true)}
${draw_text('From intended design to release evidence.', 48, 168, 16, 'light-gray', false)}
${draw_text('CAPTURE', 48, 760, 13, 'light-gray', false)}
${draw_line(120, 755, 168, 755, 'gray')}
${draw_text('COMPARE', 184, 760, 13, 'light-gray', false)}
${draw_line(256, 755, 304, 755, 'gray')}
${draw_text('REVIEW', 320, 760, 13, 'brand-primary', false)}
${draw_text('test.jurenites.com', 560, 760, 13, 'light-gray', false)}
</g>
${panel_markup(1, 48, 216, 'Figma', 'DESIGN INTENT', 'brand-secondary', 'black')}
${panel_markup(2, 128, 320, 'Storybook', 'ISOLATED COMPONENT', 'brand-tertiary', 'light-black')}
${panel_markup(3, 208, 424, 'Website', 'REAL PAGE CONTEXT', 'brand-primary', 'deep-gray')}
</svg>\n`;
}
await mkdir(asset_directory, { recursive: true });
const outlined_markup = artwork_markup(false);
if (/NaN|Infinity/.test(outlined_markup)) throw new Error('Artwork contains invalid path coordinates.');
await writeFile(new URL('thumbnail.svg', asset_directory), outlined_markup);
await writeFile(new URL('thumbnail-editable.svg', asset_directory), artwork_markup(true));
console.log('Generated three-layer visual testing SVGs: outlined for Drupal and editable text for Figma.');
