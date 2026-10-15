import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { audit_component_names, compare_button_contract, story_metadata } from '../scripts/audit-component-names.mjs';

const FIGMA_BUTTON = { component_name: 'Atoms/Button', property_definitions: {
  button_style: { type: 'VARIANT', variantOptions: ['primary', 'secondary', 'text'] },
  button_state: { type: 'VARIANT', variantOptions: ['default', 'hover', 'disabled'] },
} };
const STORY_BUTTON = { story_title: 'Atoms/Button', controls: { button_style: 'inline-radio', is_disabled: 'boolean' }, control_names: ['button_style', 'is_disabled'] };
const STYLE_OPTIONS = ['primary', 'secondary', 'text'];

test('Button keeps boolean disabled and reference-only Figma state', () => {
  assert.equal(compare_button_contract(FIGMA_BUTTON, STORY_BUTTON, STYLE_OPTIONS), 'verified');
  for (const control_names of [['button_state'], ['is_hovered'], ['button_style', 'is_disabled', 'hover_state']]) {
    assert.equal(compare_button_contract(FIGMA_BUTTON, { ...STORY_BUTTON, control_names }, STYLE_OPTIONS), 'mismatch');
  }
  assert.equal(compare_button_contract(FIGMA_BUTTON, { ...STORY_BUTTON, controls: { is_disabled: 'select' } }, STYLE_OPTIONS), 'mismatch');
  assert.equal(compare_button_contract(undefined, STORY_BUTTON, STYLE_OPTIONS), 'missing_evidence');
  assert.equal(compare_button_contract({ ...FIGMA_BUTTON, property_definitions: null }, STORY_BUTTON, STYLE_OPTIONS), 'missing_evidence');
  assert.equal(compare_button_contract(FIGMA_BUTTON, STORY_BUTTON, ['primary', 'secondary', 'ghost']), 'mismatch');
});

test('Story controls are parsed structurally without executing story imports', () => {
  const story_data = story_metadata("// title: 'wrong'\nexport default {title: 'Atoms/Button', argTypes: {is_disabled: {control: {type: 'boolean'}}}, args: {badname: false}};");
  assert.equal(story_data.story_title, 'Atoms/Button');
  assert.equal(story_data.controls.is_disabled, 'boolean');
  assert.deepEqual(story_data.control_names, ['is_disabled', 'badname']);
  assert.equal(story_metadata('const story_meta = {}; export default story_meta;').story_title, undefined);
});

test('Repository report preserves missing Figma evidence and scoped correction prompts', async () => {
  const audit_report = await audit_component_names();
  assert.equal(audit_report.audit_kind, 'component-naming');
  assert.equal(new Set(audit_report.audit_rows.map(audit_row => audit_row.check_id)).size, audit_report.audit_rows.length);
  assert.ok(audit_report.summary_counts.missing_evidence > 0);
  assert.equal(audit_report.audit_rows.find(audit_row => audit_row.check_id === 'atoms-button:contract:public-dimensions').check_status, 'verified');
  assert.equal(audit_report.audit_rows.find(audit_row => audit_row.check_id === 'atoms-button:theme:text-ghost-hover').check_status, 'verified');
  assert.ok(audit_report.audit_rows.filter(audit_row => audit_row.check_status !== 'verified').every(audit_row => audit_row.correction_prompt.includes(audit_row.check_id)));
  const figma_evidence = JSON.parse(await readFile(new URL('../config/naming-figma-evidence.json', import.meta.url), 'utf8'));
  figma_evidence.pages = [];
  const absent_report = await audit_component_names(undefined, figma_evidence);
  assert.equal(absent_report.audit_rows.find(audit_row => audit_row.check_id === 'atoms-button:contract:public-dimensions').check_status, 'missing_evidence');
});
