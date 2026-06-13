// Push side: wrap tokens/tokens.json into a Tokens Studio single-file structure.
//
// The Tokens Studio Figma plugin (in W3C/DTCG mode) reads this file from the repo
// and writes the values into Figma variables. We expose the whole contract as one
// set named "global" so token names stay identical on both sides.
//
// Reason: tokens.json is the source of truth; this file is a derived transport
// artifact, regenerated on every push and never hand-edited.

import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TOKENS_SOURCE = resolve(ROOT, 'tokens/tokens.json');
const OUTPUT = resolve(ROOT, 'tokens/tokens.studio.json');
const SET_NAME = 'global';

async function main() {
  const sourceTree = JSON.parse(await readFile(TOKENS_SOURCE, 'utf8'));

  // Strip non-token keys so the plugin only sees token groups in the set.
  const { $schema, meta, ...tokenGroups } = sourceTree;

  const studioDocument = {
    [SET_NAME]: tokenGroups,
    $themes: [],
    $metadata: {
      tokenSetOrder: [SET_NAME],
    },
  };

  await writeFile(OUTPUT, `${JSON.stringify(studioDocument, null, 2)}\n`);
  console.log(`Wrote Tokens Studio file: ${OUTPUT}`);
  console.log('In Figma: Tokens Studio -> Settings -> Sync -> point at tokens/tokens.studio.json, then Pull.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
