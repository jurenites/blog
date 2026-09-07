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

test("Starter timeline contains only the complete CV commercial-project list", async () => {
  const [timeline_data, timeline_details, installer_source] = await Promise.all([
    read_project_file(TIMELINE_MODULE_PATH + "/data/timeline-items.php"),
    read_project_file(TIMELINE_MODULE_PATH + "/data/timeline-project-details.php"),
    read_project_file(TIMELINE_MODULE_PATH + "/jurenites_timeline.install"),
  ]);
  const item_count = (timeline_data.match(/\['name' =>/g) ?? []).length;
  const description_count = (timeline_details.match(/'summary' =>/g) ?? []).length;
  const proof_link_count = (timeline_details.match(/\['title' =>/g) ?? []).length;

  assert.equal(item_count, 72);
  assert.equal(description_count, 72);
  assert.equal(proof_link_count, 81);
  assert.doesNotMatch(timeline_data, /'kind' => 'event'/);
  assert.match(timeline_data, /'name' => 'Mullikin Law'.*'emphasis' => 'heart'/);
  assert.match(timeline_data, /'name' => 'Accountia'.*'emphasis' => 'featured'/);
  assert.match(installer_source, /'alias' => '\/timeline'/);
  assert.match(installer_source, /'menu_name' => 'footer'/);
  assert.match(installer_source, /\$timeline_menu_link->set\('weight', 4\)/);
  assert.match(timeline_details, /Scatch_app\.pdf\?dl=0/);
  assert.match(timeline_details, /Accountia\?node-id=0%3A1/);
});

test("Timeline rendering provides calendar years, exact duration lanes, and official emphasis icons", async () => {
  const [timeline_template, timeline_styles, heart_icon, star_icon, timeline_story, timeline_tokens, timeline_script, timeline_module] = await Promise.all([
    read_project_file(TIMELINE_THEME_TEMPLATE),
    read_project_file("src/slice/src/scss/organisms/_timeline.scss"),
    read_project_file("src/public/assets/icons/heart-outline.svg"),
    read_project_file("src/public/assets/icons/star-outline.svg"),
    read_project_file("src/stories/organisms/timeline/timeline.stories.js"),
    read_project_file("src/token/tokens.yaml"),
    read_project_file("src/slice/src/js/timeline.js"),
    read_project_file(TIMELINE_MODULE_PATH + "/jurenites_timeline.module"),
  ]);

  assert.match(timeline_template, /timeline__year-heading/);
  assert.match(timeline_template, /timeline__marker--duration/);
  assert.doesNotMatch(timeline_template, /timeline__duration/);
  assert.doesNotMatch(timeline_template, /timeline__hours/);
  assert.match(timeline_template, /timeline__organization-link/);
  assert.match(timeline_template, /data-jurenites-timeline-organization-sticky/);
  assert.match(timeline_template, /timeline__organization-transition/);
  assert.match(timeline_template, /timeline__proof-links/);
  assert.match(timeline_template, /timeline__year-details/);
  assert.match(timeline_template, /href="\{\{ timeline_item\.primary_project_url \}\}"/);
  assert.doesNotMatch(timeline_template, /timeline-project-vincofy/);
  assert.match(timeline_template, /timeline__year-group--month-count-/);
  assert.match(timeline_template, /heart-outline/);
  assert.match(timeline_template, /star-outline/);
  assert.doesNotMatch(timeline_template, /★/);
  assert.doesNotMatch(timeline_template, /\s(?:style|width|height)=/);
  assert.match(timeline_styles, /position: sticky/);
  assert.match(timeline_styles, /content-visibility: auto/);
  assert.match(timeline_styles, /component-timeline-marker-size-default/);
  assert.match(timeline_styles, /repeat\(12, var\(--component-timeline-month-height-default\)\)/);
  assert.match(timeline_styles, /repeating-linear-gradient/);
  assert.match(timeline_styles, /@for \$lane_number from 1 through 4/);
  assert.match(timeline_styles, /@for \$visible_month_count from 1 through 12/);
  assert.match(timeline_styles, /timeline__organization-sticky/);
  assert.match(timeline_styles, /timeline__year-details/);
  assert.match(timeline_styles, /\$timeline-axis-width/);
  assert.match(timeline_styles, /\$timeline-label-column-width/);
  assert.match(timeline_styles, /\.timeline__organization-sticky[^}]+justify-content: flex-start;[^}]+text-align: left;/s);
  assert.match(timeline_styles, /\.timeline__year-heading[^}]+text-align: left;/s);
  assert.match(timeline_styles, /height: calc\(100% - var\(--space-scale-two\)\)/);
  assert.match(timeline_script, /find_active_organization_index/);
  assert.match(timeline_tokens, /month-height-default: 32px/);
  assert.match(heart_icon, /viewBox="0 0 24 24"/);
  assert.match(star_icon, /viewBox="0 0 24 24"/);
  assert.match(timeline_module, /JURENITES_TIMELINE_FIRST_YEAR = 2010/);
  assert.match(timeline_module, /'month_span' => \$fragment_end_month - \$fragment_start_month \+ 1/);
  assert.match(timeline_module, /array_slice\(\$timeline_item\['proof_links'\], 1\)/);
  assert.match(timeline_story, /Organisms\/Timeline/);
  assert.match(timeline_story, /TIMELINE_CURRENT_DATE = "2026-09-07"/);
});

test("Timeline editor provides short descriptions and repeatable proof links", async () => {
  const [summary_field, proof_storage, proof_field, organization_field, kind_storage, item_form] = await Promise.all([
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.field.paragraph.timeline_item.field_timeline_summary.yml"),
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.storage.paragraph.field_timeline_proof_links.yml"),
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.field.paragraph.timeline_item.field_timeline_proof_links.yml"),
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.field.paragraph.timeline_item.field_timeline_organization_url.yml"),
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/field.storage.paragraph.field_timeline_kind.yml"),
    read_project_file(TIMELINE_MODULE_PATH + "/config/install/core.entity_form_display.paragraph.timeline_item.default.yml"),
  ]);

  assert.match(summary_field, /label: 'Short description'/);
  assert.match(proof_storage, /cardinality: -1/);
  assert.match(proof_field, /Dropbox PDF links/);
  assert.match(organization_field, /Official company website/);
  assert.doesNotMatch(kind_storage, /value: event/);
  assert.match(item_form, /hidden:\n  created: true\n  field_timeline_kind: true/);
});
