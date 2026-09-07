import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const CATALOGUE_DIRECTORY = new URL("../../translations/", import.meta.url);

export async function translation_review_rows() {
  const review_rows = [["scope", "key", "English", "Russian"]];
  for (const catalogue_name of ["content", "interface", "config"]) {
    const catalogue_rows = JSON.parse(await readFile(new URL(`${catalogue_name}.ru.json`, CATALOGUE_DIRECTORY), "utf8"));
    for (const translation_row of catalogue_rows) {
      const record_key = catalogue_name === "content"
        ? `${translation_row.entity_type}:${translation_row.uuid}:${translation_row.field}:${translation_row.delta}:${translation_row.property}`
        : catalogue_name === "config"
          ? `${translation_row.config}:${translation_row.path}`
          : `${translation_row.context}:${translation_row.en}`;
      review_rows.push([catalogue_name, record_key, translation_row.en, translation_row.ru]);
    }
  }
  return review_rows;
}

export function encode_review_csv(review_rows) {
  return review_rows.map((review_row) => review_row.map((cell_value) =>
    `"${cell_value.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}

export async function export_translation_files(review_rows) {
  review_rows ??= await translation_review_rows();
  await writeFile(new URL("review.en-ru.csv", CATALOGUE_DIRECTORY), encode_review_csv(review_rows));
  const interface_rows = JSON.parse(await readFile(new URL("interface.ru.json", CATALOGUE_DIRECTORY), "utf8"));
  const po_lines = [
    "# Generated from interface.ru.json. Edit the JSON source and regenerate.",
    'msgid ""',
    'msgstr ""',
    '"Language: ru\\n"',
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
    '"Plural-Forms: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<12 || n%100>14) ? 1 : 2);\\n"',
  ];
  for (const interface_row of interface_rows) {
    po_lines.push("");
    if (interface_row.context) po_lines.push(`msgctxt ${JSON.stringify(interface_row.context)}`);
    po_lines.push(`msgid ${JSON.stringify(interface_row.en)}`, `msgstr ${JSON.stringify(interface_row.ru)}`);
  }
  await writeFile(new URL("interface.ru.po", CATALOGUE_DIRECTORY), po_lines.join("\n") + "\n");
  return review_rows.length - 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`Exported ${await export_translation_files()} English/Russian pairs.`);
}
