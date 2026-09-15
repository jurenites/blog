import { writeFile } from 'node:fs/promises';

const source_url = 'https://data.iana.org/TLD/tlds-alpha-by-domain.txt';
const response_info = await fetch(source_url);
if (!response_info.ok) throw new Error(`IANA request failed: ${response_info.status}`);
const source_lines = (await response_info.text()).trim().split(/\r?\n/);
const ending_rows = source_lines.filter(source_line => source_line && !source_line.startsWith('#'));
if (!source_lines[0].startsWith('# Version ') || ending_rows.length < 1000 || ending_rows.some(ending_text => !/^[A-Z0-9-]{2,63}$/.test(ending_text)) || !ending_rows.includes('COM')) throw new Error('Unexpected IANA data; existing snapshot was kept.');
const output_text = `// IANA delegated TLD snapshot. Refresh with scripts/update-qr-studio-tlds.mjs.\nexport const TLD_SOURCE=${JSON.stringify(source_url)};\nexport const TLD_VERSION=${JSON.stringify(source_lines[0].slice(2))};\nexport const TLD_LIST=${JSON.stringify(ending_rows)};\n`;
await writeFile(new URL('../web/modules/custom/jurenites_qr_studio/ui/tld-data.js', import.meta.url), output_text);
console.log(`Updated ${ending_rows.length} IANA top-level domains.`);
