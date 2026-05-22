import * as esbuild from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const paths = {
  scssEntry: resolve(root, 'slice/src/scss/main.scss'),
  jsEntry: resolve(root, 'slice/src/js/script.js'),
  cssOutput: resolve(root, 'web/themes/custom/jurenites_theme/css/style.min.css'),
  jsOutput: resolve(root, 'web/themes/custom/jurenites_theme/js/script.min.js'),
};

await mkdir(dirname(paths.cssOutput), { recursive: true });
await mkdir(dirname(paths.jsOutput), { recursive: true });

const cssResult = sass.compile(paths.scssEntry, {
  style: 'compressed',
  sourceMap: false,
  loadPaths: [resolve(root, 'slice/src/scss')],
  quietDeps: true,
});

await writeFile(paths.cssOutput, cssResult.css);

await esbuild.build({
  entryPoints: [paths.jsEntry],
  outfile: paths.jsOutput,
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2018'],
  legalComments: 'none',
});

console.log(`Built theme assets:
- ${paths.cssOutput}
- ${paths.jsOutput}`);
