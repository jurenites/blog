import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read_project_file(file_path) {
  return readFile(new URL(`../${file_path}`, import.meta.url), "utf8");
}

test("Pulse Indicator keeps the reference DOM roles in scoped BEM markup", async () => {
  const [story_source, template_source] = await Promise.all([
    read_project_file("src/stories/atoms/pulse-indicator/pulse-indicator.stories.js"),
    read_project_file("src/stories/atoms/pulse-indicator/pulse-indicator.template.html"),
  ]);

  assert.match(story_source, /title: "Atoms\/Pulse Indicator"/);
  assert.match(story_source, /const IS_ANIMATION_PAUSED = false/);
  assert.match(template_source, /class="pulse-indicator\{\{animation_class_name\}\}" aria-hidden="true"/);
  assert.match(template_source, /class="pulse-indicator__radius"/);
  assert.match(template_source, /class="pulse-indicator__dot"/);
});

test("Pulse Indicator expands four times while its token color fades to transparent", async () => {
  const [style_source, token_source] = await Promise.all([
    read_project_file("src/slice/src/scss/atoms/_pulse-indicator.scss"),
    read_project_file("src/token/tokens.yaml"),
  ]);

  assert.match(token_source, /pulse-default: \[0\.1, 0\.5, 0\.6, 1\]/);
  assert.match(token_source, /marker-size-default: 8px/);
  assert.match(token_source, /radius-scale-expanded: 4/);
  assert.match(token_source, /animation-duration-default: 3000ms/);
  assert.match(token_source, /radius-color-start: "#FFFFFF40"/);
  assert.match(token_source, /radius-color-end: "#FFFFFF00"/);
  assert.match(style_source, /@keyframes pulse-indicator-radius/);
  assert.match(style_source, /66%[\s\S]*?radius-color-end[\s\S]*?radius-scale-expanded/);
  assert.match(style_source, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?animation: none/);
});
