import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_DIRECTORY = resolve(SCRIPT_DIRECTORY, "..");
const PACKAGE_PATH = resolve(PROJECT_DIRECTORY, "package.json");

function resolve_commit_hash() {
  const environment_hash =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.CI_COMMIT_SHA;

  if (environment_hash) {
    return environment_hash;
  }

  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: PROJECT_DIRECTORY,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function resolve_repository_url(repository_value) {
  const repository_url =
    typeof repository_value === "string"
      ? repository_value
      : repository_value?.url;

  return repository_url?.replace(/\.git$/, "") ?? "";
}

function format_gmt_date(date_value) {
  return date_value.toISOString().replace("T", " ").replace(/\.\d{3}Z$/, " GMT");
}

export async function build_information() {
  const package_data = JSON.parse(await readFile(PACKAGE_PATH, "utf8"));
  const full_commit_hash = resolve_commit_hash();
  const repository_url = resolve_repository_url(package_data.repository);

  return {
    project_version: package_data.version,
    collaboration_credit: (package_data.visualCredits ?? []).join(" & "),
    commit_hash: full_commit_hash.slice(0, 7),
    commit_url:
      repository_url && full_commit_hash !== "unknown"
        ? `${repository_url}/commit/${full_commit_hash}`
        : "",
    created_gmt: format_gmt_date(new Date()),
  };
}
