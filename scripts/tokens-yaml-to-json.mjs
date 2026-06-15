#!/usr/bin/env node
// Convert the human-edited token source into the JSON contract consumed by the
// existing build scripts. Uses Ruby's built-in YAML parser to avoid adding a
// package dependency just for this small bridge.

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const source = resolve('tokens/tokens.yaml');
const destination = resolve('tokens/tokens.json');

if (!existsSync(source)) {
  console.error(`Missing ${source}. Edit tokens/tokens.yaml, then rebuild tokens.`);
  process.exit(1);
}

const ruby = `
require "json"
require "date"
require "yaml"

source = ARGV.fetch(0)
destination = ARGV.fetch(1)
data = YAML.safe_load(
  File.read(source),
  permitted_classes: [Date, Time, Symbol],
  aliases: true
)
File.write(destination, JSON.pretty_generate(data) + "\\n")
top_keys = data.keys.reject { |key| key.to_s.start_with?("$") || key.to_s == "meta" }
puts "tokens/tokens.yaml -> tokens/tokens.json (#{top_keys.length} top-level token groups)"
`;

const result = spawnSync('ruby', ['-e', ruby, source, destination], {
  cwd: process.cwd(),
  encoding: 'utf8',
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
