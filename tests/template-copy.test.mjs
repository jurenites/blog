import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

async function template_paths(directory_path) {
  const directory_entries = await readdir(directory_path, { withFileTypes: true });
  const nested_paths = await Promise.all(directory_entries.map(async (directory_entry) => {
    const entry_path = join(directory_path, directory_entry.name);
    if (directory_entry.isDirectory()) return template_paths(entry_path);
    return entry_path.endsWith(".html.twig") ? [entry_path] : [];
  }));
  return nested_paths.flat();
}

test("Drupal templates route human-readable copy through content or translation", async () => {
  const root_paths = ["web/themes/custom/jurenites_theme/templates", "web/modules/custom"];
  const source_paths = (await Promise.all(root_paths.map(template_paths))).flat();
  const raw_copy_findings = [];
  for (const source_path of source_paths) {
    const source_text = (await readFile(source_path, "utf8"))
      .replace(/\{#[\s\S]*?#\}|<!--[\s\S]*?-->|\{%\s*trans\s*%\}[\s\S]*?\{%\s*endtrans\s*%\}|\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}/g, "")
      .replace(/&(?:#\d+|#x[\da-f]+|[a-z]+);/gi, "");
    const visible_text = [...source_text.matchAll(/>([^<>]+)</g)].map((text_match) => text_match[1]);
    const accessible_text = [...source_text.matchAll(/(?:aria-label|aria-roledescription|title|placeholder|alt)="([^"]*)"/g)].map((attribute_match) => attribute_match[1]);
    for (const copy_text of [...visible_text, ...accessible_text]) {
      if (/\p{L}/u.test(copy_text)) raw_copy_findings.push(`${source_path}: ${copy_text.trim()}`);
    }
  }
  assert.deepEqual(raw_copy_findings, [], "Literal human-readable text needs a content variable or translation filter");
});
