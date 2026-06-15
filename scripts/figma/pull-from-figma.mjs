// Pull: Figma variables -> tokens/tokens.json, then scripts/sync.sh refreshes tokens/tokens.yaml.
//
// Input is a flat JSON map keyed by the same dash names used as CSS variables:
//   { "color-palette-white": "#fafafa", "space-scale-large-default": "24px" }
// or the verbose form { "color-palette-white": { "value": "#fafafa" } }.
//
// Produce that input from Figma either with the Tokens Studio export or with the
// Figma MCP (see docs/figma-sync.md for the read snippet).
//
// Reason: tokens.flat.json carries the authoritative JSON path for every token,
// so we never have to guess how to reverse-split a dash name whose segments also
// contain dashes (for example "extra-small", "small-default").

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TOKENS_SOURCE = resolve(ROOT, 'tokens/tokens.json');
const FLAT_MAP = resolve(ROOT, 'tokens/tokens.flat.json');
const DEFAULT_INPUT = resolve(ROOT, 'scripts/figma/figma-variables.json');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const inputPath = resolve(ROOT, args.find((arg) => !arg.startsWith('--')) || DEFAULT_INPUT);

function normalizeIncomingValue(raw) {
  if (raw && typeof raw === 'object' && 'value' in raw) {
    return raw.value;
  }
  return raw;
}

function setNodeValue(tree, path, value) {
  const node = path.reduce((current, segment) => current && current[segment], tree);
  if (!node || node.$value === undefined) {
    return false;
  }
  node.$value = value;
  return true;
}

async function main() {
  const [sourceText, flatText, inputText] = await Promise.all([
    readFile(TOKENS_SOURCE, 'utf8'),
    readFile(FLAT_MAP, 'utf8'),
    readFile(inputPath, 'utf8'),
  ]);

  const sourceTree = JSON.parse(sourceText);
  const flatMap = JSON.parse(flatText);
  const incoming = JSON.parse(inputText);

  const changes = [];
  const skippedReferences = [];
  const unknown = [];

  for (const [name, rawValue] of Object.entries(incoming)) {
    const meta = flatMap[name];
    if (!meta) {
      unknown.push(name);
      continue;
    }
    const incomingValue = normalizeIncomingValue(rawValue);
    if (String(incomingValue) === String(meta.value)) {
      continue;
    }
    if (meta.isReference && !isForce) {
      skippedReferences.push({ name, from: meta.value, to: incomingValue });
      continue;
    }
    changes.push({ name, path: meta.path, from: meta.value, to: incomingValue });
  }

  for (const change of changes) {
    if (!isDryRun) {
      setNodeValue(sourceTree, change.path, change.to);
    }
  }

  if (!isDryRun && changes.length > 0) {
    await writeFile(TOKENS_SOURCE, `${JSON.stringify(sourceTree, null, 2)}\n`);
  }

  console.log(`Figma -> tokens pull (${isDryRun ? 'dry run' : 'applied'})`);
  console.log(`  Input: ${inputPath}`);
  console.log(`  Changed: ${changes.length}`);
  changes.forEach((change) => console.log(`    ~ ${change.name}: ${change.from} -> ${change.to}`));
  if (skippedReferences.length > 0) {
    console.log(`  Skipped ${skippedReferences.length} semantic reference(s) (use --force to overwrite):`);
    skippedReferences.forEach((skip) => console.log(`    ! ${skip.name} (currently aliased to ${skip.from})`));
  }
  if (unknown.length > 0) {
    console.log(`  Unknown token name(s) ignored: ${unknown.join(', ')}`);
  }
  if (!isDryRun && changes.length > 0) {
    console.log('  Next: run `npm run build:tokens` to regenerate derived files.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
