import { readFile, writeFile } from 'node:fs/promises';
import { TOKEN_RECORDS } from '../generated/token/tokens.js';

// Official SVG geometry is kept in source templates; editable brand colors are tokens.
for (const technology_key of ['drupal', 'laravel', 'react']) {
  const brand_record = TOKEN_RECORDS.find((token_record) => token_record.name === `color-palette-technology-${technology_key}`);
  if (!brand_record) throw new Error(`Missing brand color for ${technology_key}`);
  const source_path = new URL(`../src/brand/technology-stack/${technology_key}.svg.template`, import.meta.url);
  const output_path = new URL(`../src/public/assets/images/technology-stack/${technology_key}.svg`, import.meta.url);
  const source_text = await readFile(source_path, 'utf8');
  await writeFile(output_path, source_text.replaceAll('{{brand_color}}', brand_record.resolved_css_value));
}
