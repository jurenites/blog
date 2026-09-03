import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const PACKAGE_PATH = resolve(PROJECT_DIRECTORY, "package.json");
const PACKAGE_LOCK_PATH = resolve(PROJECT_DIRECTORY, "package-lock.json");
const DOCUMENTATION_VERSION_PATH = resolve(PROJECT_DIRECTORY, "docs/version.md");
const RELEASE_INFORMATION_PATH = resolve(
  PROJECT_DIRECTORY,
  "web/themes/custom/jurenites_theme/release-info.json",
);
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const SUPPORTED_BUMP_TYPES = new Set(["major", "minor", "patch"]);

function parse_project_version(version_value) {
  const version_match = version_value.match(VERSION_PATTERN);

  if (!version_match) {
    throw new Error(`Invalid project version: ${version_value}`);
  }

  return version_match.slice(1).map((version_part) => Number.parseInt(version_part, 10));
}

function calculate_next_version(current_version, bump_type) {
  const [major_version, minor_version, patch_version] = parse_project_version(current_version);

  if (bump_type === "major") {
    return `${major_version + 1}.0.0`;
  }

  if (bump_type === "minor") {
    return `${major_version}.${minor_version + 1}.0`;
  }

  return `${major_version}.${minor_version}.${patch_version + 1}`;
}

async function read_version_state() {
  const [package_text, package_lock_text, documentation_text, release_information_text] = await Promise.all([
    readFile(PACKAGE_PATH, "utf8"),
    readFile(PACKAGE_LOCK_PATH, "utf8"),
    readFile(DOCUMENTATION_VERSION_PATH, "utf8"),
    readFile(RELEASE_INFORMATION_PATH, "utf8"),
  ]);
  const package_data = JSON.parse(package_text);
  const package_lock_data = JSON.parse(package_lock_text);
  const release_information = JSON.parse(release_information_text);
  const documentation_match = documentation_text.match(/^Version:\s*(\d+\.\d+\.\d+)$/m);

  if (!documentation_match) {
    throw new Error("docs/version.md must contain a line like: Version: 1.0.0");
  }

  return {
    package_text,
    package_lock_text,
    documentation_text,
    release_information_text,
    package_version: package_data.version,
    package_lock_version: package_lock_data.version,
    package_lock_root_version: package_lock_data.packages?.[""]?.version,
    documentation_version: documentation_match[1],
    release_information_version: release_information.project_version,
  };
}

function assert_matching_versions(version_state) {
  const project_version = version_state.package_version;
  parse_project_version(project_version);

  const version_entries = [
    ["package-lock.json", version_state.package_lock_version],
    ["package-lock.json root package", version_state.package_lock_root_version],
    ["docs/version.md", version_state.documentation_version],
    ["release-info.json", version_state.release_information_version],
  ];
  const mismatched_entries = version_entries.filter(
    ([, version_value]) => version_value !== project_version,
  );

  if (mismatched_entries.length > 0) {
    const mismatch_summary = mismatched_entries
      .map(([version_location, version_value]) => `${version_location}=${version_value ?? "missing"}`)
      .join(", ");
    throw new Error(`Project version mismatch: package.json=${project_version}; ${mismatch_summary}`);
  }

  console.log(`Project version: ${project_version}`);
}

function replace_first_versions(file_text, next_version, replacement_limit) {
  let replacement_count = 0;
  const updated_text = file_text.replace(
    /("version"\s*:\s*")[^"]+(")/g,
    (full_match, prefix_text, suffix_text) => {
      if (replacement_count >= replacement_limit) {
        return full_match;
      }

      replacement_count += 1;
      return `${prefix_text}${next_version}${suffix_text}`;
    },
  );

  if (replacement_count !== replacement_limit) {
    throw new Error(`Expected ${replacement_limit} version field(s), updated ${replacement_count}`);
  }

  return updated_text;
}

async function write_project_version(version_state, next_version) {
  parse_project_version(next_version);

  const next_package_text = replace_first_versions(version_state.package_text, next_version, 1);
  const next_package_lock_text = replace_first_versions(version_state.package_lock_text, next_version, 2);
  const next_documentation_text = version_state.documentation_text.replace(
    /^Version:\s*\d+\.\d+\.\d+$/m,
    `Version: ${next_version}`,
  );
  const release_information = JSON.parse(version_state.release_information_text);
  if (release_information.project_version !== next_version) {
    release_information.project_version = next_version;
    release_information.released_gmt = new Date()
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, " GMT+0");
  }
  const next_release_information_text = `${JSON.stringify(release_information, null, 2)}\n`;

  await Promise.all([
    writeFile(PACKAGE_PATH, next_package_text, "utf8"),
    writeFile(PACKAGE_LOCK_PATH, next_package_lock_text, "utf8"),
    writeFile(DOCUMENTATION_VERSION_PATH, next_documentation_text, "utf8"),
    writeFile(RELEASE_INFORMATION_PATH, next_release_information_text, "utf8"),
  ]);

  assert_matching_versions(await read_version_state());
}

async function run_version_command() {
  const command_name = process.argv[2] ?? "check";
  const command_value = process.argv[3];
  const version_state = await read_version_state();

  if (command_name === "check") {
    assert_matching_versions(version_state);
    return;
  }

  if (command_name === "set") {
    if (!command_value) {
      throw new Error("Usage: npm run version:set -- 1.0.0");
    }

    await write_project_version(version_state, command_value);
    return;
  }

  if (command_name === "bump") {
    const bump_type = command_value ?? "minor";

    if (!SUPPORTED_BUMP_TYPES.has(bump_type)) {
      throw new Error("Version bump type must be major, minor, or patch");
    }

    assert_matching_versions(version_state);
    await write_project_version(
      version_state,
      calculate_next_version(version_state.package_version, bump_type),
    );
    return;
  }

  throw new Error("Version command must be check, set, or bump");
}

await run_version_command();
