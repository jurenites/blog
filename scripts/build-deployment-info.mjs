import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build_information } from "./build-information.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const STORYBOOK_BUILD_INFO_PATH = resolve(
  PROJECT_DIRECTORY,
  "generated/storybook/storybook-build-info.js",
);

export async function write_build_information() {
  const deployment_information = await build_information();
  const storybook_content = `globalThis.STORYBOOK_BUILD_INFO = Object.freeze(${JSON.stringify(deployment_information)});\n`;

  await mkdir(dirname(STORYBOOK_BUILD_INFO_PATH), { recursive: true });
  await writeFile(STORYBOOK_BUILD_INFO_PATH, storybook_content, "utf8");

  return deployment_information;
}

const executed_script_path = process.argv[1] ? resolve(process.argv[1]) : "";

if (executed_script_path === fileURLToPath(import.meta.url)) {
  const deployment_information = await write_build_information();
  console.log(
    `Build identity ${deployment_information.project_version} · ${deployment_information.commit_hash} (${deployment_information.created_gmt})`,
  );
}
