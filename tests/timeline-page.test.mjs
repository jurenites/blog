import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const TIMELINE_MODULE_PATH = "web/modules/custom/jurenites_timeline";
const TIMELINE_THEME_TEMPLATE = "web/themes/custom/jurenites_theme/templates/content/node--timeline.html.twig";

async function read_project_file(file_path) {
  return readFile(new URL("../" + file_path, import.meta.url), "utf8");
}

test("Timeline uses one node with repeatable non-node item records", async () => {
  const [node_type_config, items_storage_config, item_type_config, period_storage_config] =
    await Promise.all([
      read_project_file(TIMELINE_MODULE_PATH + "/config/install/node.type.timeline.yml"),
      read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.storage.node.field_timeline_items.yml"),
      read_project_file(TIMELINE_MODULE_PATH + "/config/install/paragraphs.paragraphs_type.timeline_item.yml"),
      read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.storage.paragraph.field_timeline_periods.yml"),
    ]);

  assert.match(node_type_config, /type: timeline/);
  assert.match(items_storage_config, /type: entity_reference_revisions/);
  assert.match(items_storage_config, /cardinality: -1/);
  assert.match(item_type_config, /id: timeline_item/);
  assert.match(period_storage_config, /type: daterange/);
  assert.match(period_storage_config, /cardinality: -1/);
});

test("Starter timeline contains the complete CV project list and exact personal event", async () => {
  const [timeline_data, installer_source] = await Promise.all([
    read_project_file(TIMELINE_MODULE_PATH + "/data/timeline-items.php"),
    read_project_file(TIMELINE_MODULE_PATH + "/jurenites_timeline.install"),
  ]);
  const item_count = (timeline_data.match(/\['name' =>/g) ?? []).length;

  assert.equal(item_count, 73);
  assert.match(timeline_data, /'2023-11-09', '2023-11-09'/);
  assert.match(timeline_data, /'name' => 'Mullikin Law'.*'emphasis' => 'heart'/);
  assert.match(timeline_data, /'name' => 'Accountia'.*'emphasis' => 'featured'/);
  assert.match(installer_source, /'alias' => '\/timeline'/);
  assert.match(installer_source, /'menu_name' => 'main'/);
});

test("Timeline rendering provides sticky years, exact markers, and shared heart geometry", async () => {
  const [timeline_template, timeline_styles, heart_icon, timeline_story] = await Promise.all([
    read_project_file(TIMELINE_THEME_TEMPLATE),
    read_project_file("src/slice/src/scss/organisms/_timeline.scss"),
    read_project_file("src/public/assets/icons/heart-timeline.svg"),
    read_project_file("src/stories/organisms/timeline/timeline.stories.js"),
  ]);

  assert.match(timeline_template, /timeline__year-heading/);
  assert.match(timeline_template, /timeline__marker--duration/);
  assert.match(timeline_template, /heart-timeline/);
  assert.doesNotMatch(timeline_template, /\s(?:style|width|height)=/);
  assert.match(timeline_styles, /position: sticky/);
  assert.match(timeline_styles, /content-visibility: auto/);
  assert.match(timeline_styles, /component-timeline-marker-size-default/);
  assert.match(heart_icon, /viewBox="0 0 24 24"/);
  assert.match(heart_icon, /stroke-width="1"/);
  assert.match(timeline_story, /Organisms\/Timeline/);
});
