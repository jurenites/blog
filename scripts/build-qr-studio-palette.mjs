import { writeFile } from 'node:fs/promises';
import { collectTokens, formatResolvedCssValue, loadTokenTree } from './build-tokens.mjs';

const palette_tokens = collectTokens(await loadTokenTree()).filter(token_info => token_info.name.startsWith('qr-studio-color-'));
if (!palette_tokens.length) throw new Error('QR Studio palette is missing from src/token/tokens.yaml.');
const palette_styles = palette_tokens.map(token_info => `  --${token_info.name}: ${formatResolvedCssValue(token_info)};`).join('\n');
await writeFile(new URL('../web/modules/custom/jurenites_qr_studio/ui/palette.css', import.meta.url), `/* Generated from src/token/tokens.yaml by build-qr-studio-palette.mjs. */\n:root {\n${palette_styles}\n}\n`);
console.log(`Built ${palette_tokens.length} QR Studio color tokens.`);
