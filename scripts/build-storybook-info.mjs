import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import { build_information } from "./build-information.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const TOKEN_SCSS_PATH = resolve(PROJECT_DIRECTORY, "generated/styles/_tokens.scss");
const FONT_SCSS_PATH = resolve(PROJECT_DIRECTORY, "src/slice/src/scss/settings/_fonts.scss");
const OUTPUT_DIRECTORY = resolve(PROJECT_DIRECTORY, "generated/storybook");
const BUILD_INFO_PATH = resolve(OUTPUT_DIRECTORY, "storybook-build-info.js");
const TOKEN_CSS_PATH = resolve(OUTPUT_DIRECTORY, "storybook-tokens.css");

const token_scss = await readFile(TOKEN_SCSS_PATH, "utf8");
const font_css = sass.compile(FONT_SCSS_PATH, { style: "expanded" }).css;
const root_block = token_scss.match(/:root \{[\s\S]*?\n\}/)?.[0];

if (!root_block) {
  throw new Error(`Could not find the generated :root token block in ${TOKEN_SCSS_PATH}.`);
}

const build_info = await build_information();
const script_content = `globalThis.STORYBOOK_BUILD_INFO = Object.freeze(${JSON.stringify(build_info)});\n`;
const token_css_content = `/* GENERATED from token and font sources. Do not edit. */\n${root_block}\n\n${font_css}`;

await mkdir(OUTPUT_DIRECTORY, { recursive: true });
await Promise.all([
  writeFile(BUILD_INFO_PATH, script_content, "utf8"),
  writeFile(TOKEN_CSS_PATH, token_css_content, "utf8"),
]);

console.log(
  `Storybook version ${build_info.project_version} · ${build_info.commit_hash} · ${build_info.collaboration_credit} (${build_info.created_gmt})`,
);
