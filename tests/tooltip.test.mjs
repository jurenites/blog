import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const SHARED_BEHAVIOR_SOURCE = readFileSync(
  "src/slice/src/js/script.js",
  "utf8",
);

test("shared tooltips replace native titles and prefer explicit labels", () => {
  const explicit_label_index = SHARED_BEHAVIOR_SOURCE.indexOf(
    "tooltip_trigger.getAttribute('data-tooltip-label')",
  );
  const accessible_label_index = SHARED_BEHAVIOR_SOURCE.indexOf(
    "tooltip_trigger.getAttribute('aria-label')",
  );

  assert.ok(explicit_label_index >= 0);
  assert.ok(accessible_label_index > explicit_label_index);
  assert.match(SHARED_BEHAVIOR_SOURCE, /tooltip_trigger\.removeAttribute\('title'\)/);
  assert.match(SHARED_BEHAVIOR_SOURCE, /'tooltip tooltip--full-black'/);
});

test("shared tooltips attach in Drupal and discover asynchronous triggers", () => {
  assert.match(
    SHARED_BEHAVIOR_SOURCE,
    /Drupal\.behaviors\.jurenites_tooltips\s*=\s*\{/,
  );
  assert.match(SHARED_BEHAVIOR_SOURCE, /new tooltip_window\.MutationObserver/);
  assert.match(
    SHARED_BEHAVIOR_SOURCE,
    /initialize_tooltips\(added_node\)/,
  );
});
