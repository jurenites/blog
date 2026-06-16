#!/usr/bin/env node
// Refresh the readable YAML source after an automated JSON-side token update,
// such as importing Figma variable changes through scripts/figma/pull-from-figma.mjs.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('generated/tokens/tokens.json');
const destination = resolve('src/token/tokens.yaml');

if (!existsSync(source)) {
  console.error(`Missing ${source}.`);
  process.exit(1);
}

const ruby = `
require "json"
require "yaml"

source = ARGV.fetch(0)
destination = ARGV.fetch(1)
data = JSON.parse(File.read(source))
yaml = YAML.dump(data, line_width: -1)
yaml.sub!(/^---\\n/, "")
header = "# Editable source of truth for Blog Jurenites design tokens.\\n" \
         "# Run npm run build:tokens after changes to regenerate JSON/CSS/SCSS outputs.\\n"
File.write(destination, header + yaml)
puts "generated/tokens/tokens.json -> src/token/tokens.yaml"
`;

const result = spawnSync('ruby', ['-e', ruby, source, destination], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
