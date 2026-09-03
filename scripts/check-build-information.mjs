import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build_information } from "./build-information.mjs";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const STORYBOOK_BUILD_INFO_PATH = resolve(
  PROJECT_DIRECTORY,
  "generated/storybook/storybook-build-info.js",
);
const IDENTITY_FIELDS = ["project_version", "commit_hash", "commit_url", "collaboration_credit"];

function parse_storybook_information(script_content) {
  const information_match = script_content.match(
    /^globalThis\.STORYBOOK_BUILD_INFO = Object\.freeze\((\{.*\})\);\s*$/,
  );

  if (!information_match) {
    throw new Error("Invalid generated Storybook build information");
  }

  return JSON.parse(information_match[1]);
}

function assert_current_identity(output_name, output_information, current_information) {
  const stale_fields = IDENTITY_FIELDS.filter(
    (field_name) => output_information[field_name] !== current_information[field_name],
  );

  if (stale_fields.length > 0) {
    throw new Error(
      `${output_name} build identity is stale (${stale_fields.join(", ")}). Run npm run build:info.`,
    );
  }
}

const [storybook_content, current_information] = await Promise.all([
  readFile(STORYBOOK_BUILD_INFO_PATH, "utf8"),
  build_information(),
]);
const storybook_information = parse_storybook_information(storybook_content);

assert_current_identity("Storybook", storybook_information, current_information);
console.log(
  `Build identity: ${current_information.project_version} · ${current_information.commit_hash} (current)`,
);
