import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { TOKEN_VALUES } from "../generated/token/tokens.js";
import { loadTokenTree } from "./build-tokens.mjs";

const ROOT_DIRECTORY = resolve(fileURLToPath(new URL("..", import.meta.url)));
const TOKEN_SOURCE_PATH = resolve(ROOT_DIRECTORY, "src/token/tokens.yaml");
const SCAN_DIRECTORIES = [".storybook", "scripts", "src", "web/themes/custom/jurenites_theme"];
const SOURCE_EXTENSIONS = new Set([".css", ".html", ".js", ".mjs", ".scss", ".twig"]);
const STYLE_EXTENSIONS = new Set([".css", ".html", ".scss"]);
const IGNORED_PATHS = new Set([
  "src/token/tokens.yaml",
  "web/themes/custom/jurenites_theme/css/style.min.css",
  "web/themes/custom/jurenites_theme/js/script.min.js",
]);
const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const OLD_COLOR_REFERENCE_PATTERN = /:\s*["']?\{(?:color\.(?:value|palette)|theme\.)[^}]+\}["']?/g;
const QUOTED_COLOR_REFERENCE_PATTERN = /:\s*["'](?:color\.(?:value|palette)|theme\.)[^"']+["']/g;
const CSS_VARIABLE_PATTERN = /var\((--[a-z0-9-]+)(?:\s*,[^)]*)?\)/g;
const CSS_OPACITY_PATTERN = /\bopacity\s*:/g;
const HARDCODED_FONT_SIZE_PATTERN = /\bfont-size\s*:\s*-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/g;
const HARDCODED_FONT_SHORTHAND_PATTERN = /\bfont\s*:\s*(?!var\(|inherit\b)[^;{}]*(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/g;
const VERBOSE_TOKEN_FIELD_PATTERN = /^\s*["']?\$(?:type|value|description)["']?\s*:/gm;
const SELF_MAPPING_PATTERN = /^\s*([a-z0-9-]+):\s+\1(?:\s+#.*)?$/gm;
const SHADOW_OBJECT_PATTERN = /^\s+level-[0-9]+:\s+\{.*(?:offsetX|offsetY|blur|spread|color):/gm;
const EXPECTED_TYPOGRAPHY_ROLES = new Set([
  "headline-1",
  "headline-2",
  "headline-3",
  "headline-4",
  "headline-5",
  "headline-6",
  "subtitle-1",
  "subtitle-2",
  "eyebrow",
  "body",
  "body-2",
  "link",
  "caption",
  "code",
  "badge",
  "overline",
  "numeric-display",
]);

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
const external_css_variables = new Set([
  "--gin-font-size-s",
]);
const contract_errors = [];
const token_source_content = await readFile(TOKEN_SOURCE_PATH, "utf8");

const token_tree = await loadTokenTree(TOKEN_SOURCE_PATH);
const typography_roles = Object.entries(token_tree.typography || {})
  .filter(([role_name]) => role_name !== "font-family");

for (const expected_role of EXPECTED_TYPOGRAPHY_ROLES) {
  if (!typography_roles.some(([role_name]) => role_name === expected_role)) {
    contract_errors.push(`src/token/tokens.yaml: missing concise typography role ${expected_role}`);
  }
}
for (const [role_name, role_token] of typography_roles) {
  if (!EXPECTED_TYPOGRAPHY_ROLES.has(role_name)) {
    contract_errors.push(`src/token/tokens.yaml: unexpected typography role ${role_name}; repurpose a concise shared role instead`);
  }
  if (typeof role_token?.$value !== "string") {
    contract_errors.push(`src/token/tokens.yaml: typography role ${role_name} must be one CSS font shorthand string`);
    continue;
  }
  if (role_token.$value.includes("roundabout")) {
    contract_errors.push(`src/token/tokens.yaml: Roundabout is demonstration-only and cannot own typography role ${role_name}`);
  }
  if (role_name !== "overline" && role_token.$value.includes("4pixel")) {
    contract_errors.push(`src/token/tokens.yaml: 4pixel is limited to the technical Overline role, not ${role_name}`);
  }
}

for (const verbose_field_match of token_source_content.matchAll(VERBOSE_TOKEN_FIELD_PATTERN)) {
  const line_number = token_source_content.slice(0, verbose_field_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: use a direct value and YAML comment instead of $type, $value, or $description`);
}
for (const self_mapping_match of token_source_content.matchAll(SELF_MAPPING_PATTERN)) {
  const line_number = token_source_content.slice(0, self_mapping_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: remove redundant key/value self-mapping ${self_mapping_match[1]}`);
}
for (const shadow_object_match of token_source_content.matchAll(SHADOW_OBJECT_PATTERN)) {
  const line_number = token_source_content.slice(0, shadow_object_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: store elevation shadows as complete CSS values, not property objects`);
}

for (const reference_match of token_source_content.matchAll(OLD_COLOR_REFERENCE_PATTERN)) {
  const line_number = token_source_content.slice(0, reference_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: color references must not use braces or quotes`);
}
for (const reference_match of token_source_content.matchAll(QUOTED_COLOR_REFERENCE_PATTERN)) {
  const line_number = token_source_content.slice(0, reference_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: color references must be unquoted dot paths`);
}

const color_palette_section = token_source_content.match(/^  palette:\n([\s\S]*?)^# Layer 2:/m)?.[1] || "";
for (const multiline_match of color_palette_section.matchAll(/^    [a-z0-9-]+:\s*$/gm)) {
  const section_offset = token_source_content.indexOf(color_palette_section);
  const line_number = token_source_content.slice(0, section_offset + multiline_match.index).split("\n").length;
  contract_errors.push(`src/token/tokens.yaml:${line_number}: each raw color token must occupy one line`);
}

for (const hex_match of token_source_content.matchAll(HEX_PATTERN)) {
  if (hex_match[0] !== hex_match[0].toUpperCase()) {
    const line_number = token_source_content.slice(0, hex_match.index).split("\n").length;
    contract_errors.push(`src/token/tokens.yaml:${line_number}: HEX color ${hex_match[0]} must use uppercase letters`);
  }
}

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

    if (STYLE_EXTENSIONS.has(extname(source_path))) {
      for (const font_size_match of source_content.matchAll(HARDCODED_FONT_SIZE_PATTERN)) {
        const line_number = source_content.slice(0, font_size_match.index).split("\n").length;
        contract_errors.push(`${relative_path}:${line_number}: hardcoded font size must use a typography role or semantic token`);
      }
      for (const font_shorthand_match of source_content.matchAll(HARDCODED_FONT_SHORTHAND_PATTERN)) {
        const line_number = source_content.slice(0, font_shorthand_match.index).split("\n").length;
        contract_errors.push(`${relative_path}:${line_number}: hardcoded font shorthand must use a typography role token`);
      }
    }

    if (extname(source_path) === ".scss") {
      for (const variable_match of source_content.matchAll(CSS_VARIABLE_PATTERN)) {
        if (!defined_variables.has(variable_match[1]) && !external_css_variables.has(variable_match[1])) {
          contract_errors.push(`${relative_path}: undefined token variable ${variable_match[1]}`);
        }
      }
    }
  }
}

if (contract_errors.length > 0) {
  throw new Error(`Token contract failed:\n- ${contract_errors.join("\n- ")}`);
}

console.log("Token contract and token style: OK");
