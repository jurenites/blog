import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import * as sass from 'sass';
const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'generated/status-dashboard');
await mkdir(OUTPUT_PATH, { recursive: true });
await build({
  entryPoints: [resolve(PROJECT_ROOT, 'src/status-dashboard/app.js')],
  outfile: resolve(OUTPUT_PATH, 'app.js'), bundle: true, format: 'esm',
  plugins: [{ name: 'raw-html', setup(build_context) {
    build_context.onResolve({ filter: /\.html\?raw$/ }, (import_info) => ({ path: resolve(import_info.resolveDir, import_info.path.replace(/\?raw$/, '')), namespace: 'raw-html' }));
    build_context.onLoad({ filter: /.*/, namespace: 'raw-html' }, async (load_info) => ({ contents: await readFile(load_info.path, 'utf8'), loader: 'text' }));
  } }],
});
const compiled_style = sass.compile(resolve(PROJECT_ROOT, 'src/status-dashboard/status.scss'), { style: 'compressed' });
await writeFile(resolve(OUTPUT_PATH, 'style.css'), compiled_style.css);
await writeFile(resolve(OUTPUT_PATH, 'index.html'), await readFile(resolve(PROJECT_ROOT, 'src/status-dashboard/index.html')));
await writeFile(resolve(OUTPUT_PATH, 'build-info.json'), JSON.stringify({ built_at: new Date().toISOString() }, null, 2));
console.log('Built the local component status dashboard.');
