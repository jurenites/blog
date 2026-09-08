import { write_icon_sprite_assets } from './build-icon-sprite.mjs';
import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const ROOT_DIRECTORY = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_PATHS = {
  scss_entry: resolve(ROOT_DIRECTORY, 'src/slice/src/scss/theme.scss'),
  ckeditor_scss_entry: resolve(ROOT_DIRECTORY, 'src/slice/src/scss/ckeditor5.scss'),
  js_entry: resolve(ROOT_DIRECTORY, 'src/slice/src/js/script.js'),
  font_preview_js_entry: resolve(ROOT_DIRECTORY, 'src/slice/src/js/font-preview-entry.js'),
  fonts_source: resolve(ROOT_DIRECTORY, 'src/public/assets/fonts'),
  fonts_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/assets/fonts'),
  icons_source: resolve(ROOT_DIRECTORY, 'src/public/assets/icons'),
  icons_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/assets/icons'),
  images_source: resolve(ROOT_DIRECTORY, 'src/public/assets/images'),
  images_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/assets/images'),
  brand_logo_source: resolve(ROOT_DIRECTORY, 'src/public/assets/brand/jurenites-logo.svg'),
  brand_logo_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/logo.svg'),
  css_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/css/style.min.css'),
  ckeditor_css_output: resolve(
    ROOT_DIRECTORY,
    'web/themes/custom/jurenites_theme/css/ckeditor5.min.css',
  ),
  js_output: resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/js/script.min.js'),
  font_preview_js_output: resolve(
    ROOT_DIRECTORY,
    'web/themes/custom/jurenites_theme/js/font-preview.min.js',
  ),
};

async function remove_generated_trailing_whitespace(output_path) {
  const generated_source = await readFile(output_path, 'utf8');
  await writeFile(output_path, generated_source.replace(/[ \t]+$/gm, ''));
}

await write_icon_sprite_assets(resolve(ROOT_DIRECTORY, 'web/themes/custom/jurenites_theme/assets/icon-sprites'));

await mkdir(dirname(BUILD_PATHS.css_output), { recursive: true });
await mkdir(dirname(BUILD_PATHS.js_output), { recursive: true });
await cp(BUILD_PATHS.fonts_source, BUILD_PATHS.fonts_output, { recursive: true, force: true });
await cp(BUILD_PATHS.icons_source, BUILD_PATHS.icons_output, { recursive: true, force: true });
await cp(BUILD_PATHS.images_source, BUILD_PATHS.images_output, { recursive: true, force: true });
await cp(BUILD_PATHS.brand_logo_source, BUILD_PATHS.brand_logo_output, { force: true });

const css_result = sass.compile(BUILD_PATHS.scss_entry, {
  style: 'compressed',
  sourceMap: false,
  loadPaths: [resolve(ROOT_DIRECTORY, 'src/slice/src/scss')],
  quietDeps: true,
});

await writeFile(BUILD_PATHS.css_output, css_result.css);

const ckeditor_css_result = sass.compile(BUILD_PATHS.ckeditor_scss_entry, {
  style: 'compressed',
  sourceMap: false,
  loadPaths: [resolve(ROOT_DIRECTORY, 'src/slice/src/scss')],
  quietDeps: true,
});

await writeFile(BUILD_PATHS.ckeditor_css_output, ckeditor_css_result.css);

await esbuild.build({
  entryPoints: [BUILD_PATHS.js_entry],
  outfile: BUILD_PATHS.js_output,
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2018'],
  legalComments: 'none',
});

await esbuild.build({
  entryPoints: [BUILD_PATHS.font_preview_js_entry],
  outfile: BUILD_PATHS.font_preview_js_output,
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2018'],
  legalComments: 'none',
});
await remove_generated_trailing_whitespace(BUILD_PATHS.font_preview_js_output);

console.log(`Built theme assets:
- ${BUILD_PATHS.css_output}
- ${BUILD_PATHS.ckeditor_css_output}
- ${BUILD_PATHS.js_output}
- ${BUILD_PATHS.font_preview_js_output}`);
