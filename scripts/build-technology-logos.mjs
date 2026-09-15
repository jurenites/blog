import { readFile, writeFile } from 'node:fs/promises';
import { PHP_LETTER_COLOR, TECHNOLOGY_BRAND_COLORS } from '../src/brand/technology-stack/brand-colors.js';

// Official SVG geometry and fixed brand colors belong to the component artwork.
for (const [technology_key, brand_color] of Object.entries(TECHNOLOGY_BRAND_COLORS)) {
  const source_path = new URL(`../src/brand/technology-stack/${technology_key}.svg.template`, import.meta.url);
  const artwork_name = technology_key === 'laravel' ? 'laravel-symbol' : technology_key;
  const output_path = new URL(`../src/public/assets/images/technology-stack/${artwork_name}.svg`, import.meta.url);
  const source_text = await readFile(source_path, 'utf8');
  await writeFile(output_path, source_text.replaceAll('{{brand_color}}', brand_color));
}

// Derive the inactive PHP artwork from the same official SVG as the color state.
// Knock the black lettering through every layer, including the oval behind it.
const php_source_path = new URL('../src/public/assets/images/technology-stack/php.svg', import.meta.url);
const php_source_text = await readFile(php_source_path, 'utf8');
const php_letter_groups = [...php_source_text.matchAll(/<g\b[^>]*transform="(translate\([^"]+\))"[^>]*>\s*(<path\b[^>]*\/>)/g)]
  .filter(([, , letter_markup]) => letter_markup.includes(`fill:${PHP_LETTER_COLOR};`));
if (php_letter_groups.length !== 3) {
  throw new Error('Expected three black letter paths in the official PHP artwork.');
}
const php_mask_letters = php_letter_groups.map(([, letter_transform, letter_markup]) =>
  `<g transform="${letter_transform}">${letter_markup.replace(/ id="[^"]+"/, '')}</g>`,
).join('\n');
const php_mask_markup = `<mask id="php-letter-cutouts" maskUnits="userSpaceOnUse" x="0" y="0" width="711.20123" height="383.5975">
  <path fill="white" d="M0 0H711.20123V383.5975H0Z"/>
  <g transform="matrix(1.25,0,0,-1.25,-4.4,394.29875)">${php_mask_letters}</g>
</mask>`;
const php_inactive_text = php_source_text
  .replace('</defs>', `${php_mask_markup}\n</defs>`)
  .replace('<g id="g3438"', '<g mask="url(#php-letter-cutouts)"><g id="g3438"')
  .replace('</svg>', '</g>\n</svg>');
await writeFile(new URL('../src/public/assets/images/technology-stack/php-white.svg', import.meta.url), php_inactive_text);
