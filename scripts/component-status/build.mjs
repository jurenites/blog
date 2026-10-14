import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import * as sass from 'sass';
const PROJECT_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const OUTPUT_PATH = resolve(PROJECT_ROOT, 'generated/status-dashboard');
await mkdir(OUTPUT_PATH, { recursive: true });
await build({
  entryPoints: ['app', 'history'].map((entry_name) => resolve(PROJECT_ROOT, `src/status-dashboard/${entry_name}.js`)),
  outdir: OUTPUT_PATH, bundle: true, format: 'esm',
  plugins: [{ name: 'raw-template-assets', setup(build_context) {
    build_context.onResolve({ filter: /\.(html|svg)\?raw$/ }, (import_info) => ({ path: resolve(import_info.resolveDir, import_info.path.replace(/\?raw$/, '')), namespace: 'raw-template-assets' }));
    build_context.onLoad({ filter: /.*/, namespace: 'raw-template-assets' }, async (load_info) => ({ contents: await readFile(load_info.path, 'utf8'), loader: 'text' }));
  } }],
});
await writeFile(resolve(OUTPUT_PATH, 'history.html'), await readFile(resolve(PROJECT_ROOT, 'src/status-dashboard/history.html')));
await writeFile(resolve(OUTPUT_PATH, 'history.css'), sass.compile(resolve(PROJECT_ROOT, 'src/status-dashboard/history.scss'), { style: 'compressed' }).css);
const compiled_style = sass.compile(resolve(PROJECT_ROOT, 'src/status-dashboard/status.scss'), { style: 'compressed' });
await writeFile(resolve(OUTPUT_PATH, 'style.css'), compiled_style.css);
await writeFile(resolve(OUTPUT_PATH, 'index.html'), await readFile(resolve(PROJECT_ROOT, 'src/status-dashboard/index.html')));
await copyFile(resolve(PROJECT_ROOT, 'src/status-dashboard/favicon.svg'), resolve(OUTPUT_PATH, 'favicon.svg'));
await copyFile(resolve(PROJECT_ROOT, 'src/status-dashboard/assets/button-variants-overview.png'), resolve(OUTPUT_PATH, 'button-variants-overview.png'));
await writeFile(resolve(OUTPUT_PATH, 'build-info.json'), JSON.stringify({ built_at: new Date().toISOString() }, null, 2));
console.log('Built the local component status dashboard.');
