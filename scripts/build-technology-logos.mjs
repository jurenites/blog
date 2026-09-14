import { readFile, writeFile } from 'node:fs/promises';
import { TECHNOLOGY_BRAND_COLORS } from '../src/brand/technology-stack/brand-colors.js';

// Official SVG geometry and fixed brand colors belong to the component artwork.
for (const [technology_key, brand_color] of Object.entries(TECHNOLOGY_BRAND_COLORS)) {
  const source_path = new URL(`../src/brand/technology-stack/${technology_key}.svg.template`, import.meta.url);
  const output_path = new URL(`../src/public/assets/images/technology-stack/${technology_key}.svg`, import.meta.url);
  const source_text = await readFile(source_path, 'utf8');
  await writeFile(output_path, source_text.replaceAll('{{brand_color}}', brand_color));
}
