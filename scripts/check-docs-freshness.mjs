import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const STALE_COMMIT_LIMIT = Number.parseInt(
  process.env.DOCS_STALE_COMMIT_LIMIT || "5",
  10,
);

const SOURCE_PATHS = [
  "src",
  "scripts",
  "web/modules/custom",
  "web/themes/custom",
  ".storybook",
  "package.json",
  "docker-compose.yml",
];

const DOCS_PATHS = ["docs", "README.md", "AGENTS.md"];

function git_output(argument_list) {
  return execFileSync("git", argument_list, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function latest_commit(path_list) {
  try {
    return git_output(["log", "-1", "--format=%H", "--", ...path_list]);
  } catch {
    return "";
  }
}

function commit_distance(older_commit, newer_commit) {
  if (!older_commit || !newer_commit || older_commit === newer_commit) {
    return 0;
  }

  try {
    return Number.parseInt(
      git_output(["rev-list", "--count", `${older_commit}..${newer_commit}`]),
      10,
    );
  } catch {
    return 0;
  }
}

function dirty_paths(path_list) {
  const status_text = git_output(["status", "--short", "--", ...path_list]);

  return status_text
    .split("\n")
    .map((status_line) => status_line.trim())
    .filter(Boolean);
}

function read_docs_version() {
  const version_file = "docs/version.md";

  if (!existsSync(version_file)) {
    throw new Error("Missing docs/version.md");
  }

  const version_text = readFileSync(version_file, "utf8");
  const version_match = version_text.match(/^Version:\s*(\d+\.\d+\.\d+)$/m);

  if (!version_match) {
    throw new Error("docs/version.md must contain a line like: Version: 0.1.1");
  }

  return version_match[1];
}

const docs_version = read_docs_version();
const source_commit = latest_commit(SOURCE_PATHS);
const docs_commit = latest_commit(DOCS_PATHS);
const commits_ahead = commit_distance(docs_commit, source_commit);
const source_dirty = dirty_paths(SOURCE_PATHS);
const docs_dirty = dirty_paths(DOCS_PATHS);

console.log(`Documentation version: ${docs_version}`);

if (!source_commit || !docs_commit) {
  console.log("Documentation freshness: no git history found for one path set.");
  process.exit(0);
}

console.log(`Source commits since latest docs checkpoint: ${commits_ahead}`);

if (source_dirty.length > 0) {
  console.log(`Source has uncommitted changes: ${source_dirty.length} file(s).`);
}

if (docs_dirty.length > 0) {
  console.log(`Docs have uncommitted changes: ${docs_dirty.length} file(s).`);
}

if (source_dirty.length > 0 && docs_dirty.length === 0) {
  console.log(
    "Review note: source changed locally, but docs are clean. Check whether docs need a patch bump before committing.",
  );
}

if (commits_ahead > STALE_COMMIT_LIMIT) {
  console.error(
    `Docs are stale: source is ${commits_ahead} commits ahead of docs, limit is ${STALE_COMMIT_LIMIT}.`,
  );
  process.exit(1);
}

console.log("Documentation freshness: OK");
