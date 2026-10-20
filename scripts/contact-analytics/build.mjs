import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import * as sass from 'sass';
import { PROJECT_ROOT } from './database.mjs';

const output_path = resolve(PROJECT_ROOT, 'generated/contact-analytics');
await mkdir(output_path, { recursive: true });
await build({
  entryPoints: [resolve(PROJECT_ROOT, 'src/contact-analytics/app.js')],
  outdir: output_path, bundle: true, format: 'esm',
  plugins: [{ name: 'raw-template-assets', setup(build_context) {
    build_context.onResolve({ filter: /\.(html|svg)\?raw$/ }, (import_info) => ({
      path: resolve(import_info.resolveDir, import_info.path.replace(/\?raw$/, '')),
      namespace: 'raw-template-assets',
    }));
    build_context.onLoad({ filter: /.*/, namespace: 'raw-template-assets' }, async (load_info) => ({
      contents: await readFile(load_info.path, 'utf8'), loader: 'text',
    }));
  } }],
});
await writeFile(resolve(output_path, 'index.html'),
  await readFile(resolve(PROJECT_ROOT, 'src/contact-analytics/index.html')));
await writeFile(resolve(output_path, 'style.css'),
  sass.compile(resolve(PROJECT_ROOT, 'src/contact-analytics/dashboard.scss'), { style: 'compressed' }).css);
console.log('Built local contact analytics dashboard.');
