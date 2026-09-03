import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const RELEASE_INFORMATION_PATH = resolve(
  PROJECT_DIRECTORY,
  "web/themes/custom/jurenites_theme/release-info.json",
);
const COMMIT_HASH_PATTERN = /^[0-9a-f]{7,64}$/i;

function normalize_commit_hash(commit_hash) {
  const normalized_hash = commit_hash.trim().toLowerCase();

  if (!COMMIT_HASH_PATTERN.test(normalized_hash)) {
    throw new Error(`Invalid Git commit hash supplied to the build: ${commit_hash}`);
  }

  return normalized_hash;
}

function resolve_commit_hash() {
  const environment_hash =
    process.env.JURENITES_GIT_COMMIT ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.CI_COMMIT_SHA;

  if (environment_hash) {
    return normalize_commit_hash(environment_hash);
  }

  try {
    return normalize_commit_hash(execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: PROJECT_DIRECTORY,
      encoding: "utf8",
    }));
  } catch {
    return "unknown";
  }
}

export async function build_information() {
  const release_information = JSON.parse(
    await readFile(RELEASE_INFORMATION_PATH, "utf8"),
  );
  const full_commit_hash = resolve_commit_hash();
  const repository_url = release_information.repository_url?.replace(/\.git$/, "") ?? "";

  return {
    project_version: release_information.project_version,
    collaboration_credit: release_information.collaboration_credit,
    commit_hash: full_commit_hash.slice(0, 7),
    commit_url:
      repository_url && full_commit_hash !== "unknown"
        ? `${repository_url}/commit/${full_commit_hash}`
        : "",
    created_gmt: release_information.released_gmt,
  };
}
