import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOKEN_VALUES } from "../generated/token/tokens.js";

const ROOT_DIRECTORY = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCAN_DIRECTORIES = [".storybook", "scripts", "src", "web/themes/custom/jurenites_theme"];
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".mjs", ".scss", ".twig"]);
const STYLE_EXTENSIONS = new Set([".css", ".html", ".scss"]);
const IGNORED_PATHS = new Set([
  "src/token/tokens.yaml",
  "web/themes/custom/jurenites_theme/css/style.min.css",
  "web/themes/custom/jurenites_theme/js/script.min.js",
]);
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const CSS_VARIABLE_PATTERN = /var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)/g;
const CSS_OPACITY_PATTERN = /\bopacity\s*:/g;

async function source_files(directory_path) {
  const directory_entries = await readdir(directory_path, { withFileTypes: true });
  const nested_files = await Promise.all(directory_entries.map(async (directory_entry) => {
    const entry_path = resolve(directory_path, directory_entry.name);
    if (directory_entry.isDirectory()) {
      return source_files(entry_path);
    }
    return SOURCE_EXTENSIONS.has(extname(entry_path)) ? [entry_path] : [];
  }));

  return nested_files.flat();
}

const defined_variables = new Set(Object.keys(TOKEN_VALUES).map((token_name) => `--${token_name}`));
const contract_errors = [];

for (const scan_directory of SCAN_DIRECTORIES) {
  const directory_path = resolve(ROOT_DIRECTORY, scan_directory);
  for (const source_path of await source_files(directory_path)) {
    const relative_path = relative(ROOT_DIRECTORY, source_path);
    if (IGNORED_PATHS.has(relative_path)) {
      continue;
    }

    const source_content = await readFile(source_path, "utf8");
    const hex_matches = [...source_content.matchAll(HEX_PATTERN)];
    for (const hex_match of hex_matches) {
      contract_errors.push(`${relative_path}: hardcoded color ${hex_match[0]}`);
    }

    if (STYLE_EXTENSIONS.has(extname(source_path)) && CSS_OPACITY_PATTERN.test(source_content)) {
      contract_errors.push(`${relative_path}: CSS opacity must be represented by a token color`);
    }
    CSS_OPACITY_PATTERN.lastIndex = 0;

    if (extname(source_path) === ".scss") {
      for (const variable_match of source_content.matchAll(CSS_VARIABLE_PATTERN)) {
        if (!defined_variables.has(variable_match[1])) {
          contract_errors.push(`${relative_path}: undefined token variable ${variable_match[1]}`);
        }
      }
    }
  }
}

if (contract_errors.length > 0) {
  throw new Error(`Token contract failed:\n- ${contract_errors.join("\n- ")}`);
}

console.log("Token contract: OK");
