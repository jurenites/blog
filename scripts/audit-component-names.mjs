import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'espree';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_NAME_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/;

async function source_files(root_path, file_suffix) {
  const file_entries = await readdir(root_path, { withFileTypes: true });
  const nested_files = await Promise.all(file_entries.map(file_entry => file_entry.isDirectory()
    ? source_files(resolve(root_path, file_entry.name), file_suffix)
    : file_entry.name.endsWith(file_suffix) ? [resolve(root_path, file_entry.name)] : []));
  return nested_files.flat().sort();
}

function object_properties(object_node) {
  return Object.fromEntries((object_node?.properties ?? []).filter(property_node => property_node.type === 'Property')
    .map(property_node => [property_node.key.name ?? property_node.key.value, property_node.value]));
}

export function story_metadata(source_text) {
  const syntax_tree = parse(source_text, { ecmaVersion: 'latest', sourceType: 'module', loc: true });
  const default_node = syntax_tree.body.find(statement_node => statement_node.type === 'ExportDefaultDeclaration');
  const metadata_nodes = object_properties(default_node?.declaration);
  const control_nodes = object_properties(metadata_nodes.argTypes);
  return {
    story_title: metadata_nodes.title?.value,
    control_names: [...new Set([...Object.keys(control_nodes), ...Object.keys(object_properties(metadata_nodes.args))])],
    controls: Object.fromEntries(Object.entries(control_nodes).map(([control_name, control_node]) => {
      const control_fields = object_properties(control_node);
      return [control_name, control_fields.control?.value ?? object_properties(control_fields.control).type?.value ?? null];
    })),
  };
}

export function compare_button_contract(figma_component, story_data, style_options) {
  if (!figma_component || figma_component.property_definitions === null) return 'missing_evidence';
  const style_definition = figma_component.property_definitions.button_style;
  const state_definition = figma_component.property_definitions.button_state;
  return figma_component.component_name === 'Atoms/Button'
    && style_definition?.type === 'VARIANT'
    && JSON.stringify(style_definition.variantOptions?.slice().sort()) === JSON.stringify(['primary', 'secondary', 'text'].sort())
    && state_definition?.type === 'VARIANT'
    && JSON.stringify(state_definition.variantOptions?.slice().sort()) === JSON.stringify(['default', 'hover', 'disabled'].sort())
    && story_data.story_title === 'Atoms/Button'
    && story_data.controls.button_style === 'inline-radio'
    && story_data.controls.is_disabled === 'boolean'
    && !story_data.control_names.some(control_name => /hover|button_state/.test(control_name))
    && JSON.stringify(style_options) === JSON.stringify(['primary', 'secondary', 'text']) ? 'verified' : 'mismatch';
}

export async function audit_component_names(project_root = PROJECT_ROOT, figma_evidence = null) {
  const audit_rows = [];
  function record_check(component_id, surface_name, check_name, check_status, expected_value, observed_value, source_paths) {
    audit_rows.push({ check_id: `${component_id}:${surface_name}:${check_name}`, component_id, surface_name,
      check_name, check_status, expected_value, observed_value, source_paths,
      correction_prompt: check_status === 'verified' ? '' : `Review naming check ${component_id}:${surface_name}:${check_name}. Expected ${expected_value}; observed ${observed_value}. Inspect ${source_paths.join(', ')} and docs/naming-conventions.md. Correct only this agreed mapping; preserve CMS copy and Button is_disabled boolean, native hover, and text → button--ghost. Obtain missing evidence before claiming a pass; do not broadly rename production or Figma components.` });
  }
  const evidence_data = figma_evidence ?? JSON.parse(await readFile(resolve(project_root, 'config/naming-figma-evidence.json'), 'utf8'));
  const story_paths = await source_files(resolve(project_root, 'src/stories'), '.stories.js');
  const theme_paths = await source_files(resolve(project_root, 'web/themes/custom/jurenites_theme/templates'), '.twig');
  const theme_sources = await Promise.all(theme_paths.map(async source_path => ({ source_path: relative(project_root, source_path), source_text: await readFile(source_path, 'utf8') })));
  const documentation_text = await readFile(resolve(project_root, 'docs/naming-conventions.md'), 'utf8');
  const component_rows = [];
  for (const story_path of story_paths) {
    const source_path = relative(project_root, story_path);
    const component_block = source_path.split('/').at(-2);
    const component_id = source_path.split('/').slice(2, -1).join('-');
    let story_data;
    try { story_data = story_metadata(await readFile(story_path, 'utf8')); }
    catch (read_error) { record_check(component_id, 'storybook', 'metadata', 'missing_evidence', 'parseable story metadata', String(read_error), [source_path]); continue; }
    component_rows.push({ component_id, component_block, source_path, ...story_data });
    record_check(component_id, 'storybook', 'component-name', story_data.story_title ? 'verified' : 'missing_evidence', 'literal Storybook title', story_data.story_title ?? 'unresolved default export', [source_path]);
    for (const control_name of story_data.control_names) record_check(component_id, 'storybook', `control-${control_name}`, PUBLIC_NAME_PATTERN.test(control_name) ? 'verified' : 'mismatch', 'two-word snake_case public argument', control_name, [source_path]);
    const matching_templates = theme_sources.filter(theme_source => new RegExp(`(?<![a-z0-9-])${component_block}(?=[\\s"'._{]|__|--|$)`).test(theme_source.source_text));
    record_check(component_id, 'drupal', 'bem-mapping', matching_templates.length ? 'verified' : 'missing_evidence', `.${component_block} in theme Twig`, matching_templates.length ? 'source-level BEM occurrence; runtime not checked' : 'no theme Twig occurrence; module integration may exist', matching_templates.length ? matching_templates.map(theme_source => theme_source.source_path) : [source_path]);
    record_check(component_id, 'documentation', 'mapping', documentation_text.includes(story_data.story_title ?? '\0') ? 'verified' : 'missing_evidence', 'documented surface mapping', documentation_text.includes(story_data.story_title ?? '\0') ? story_data.story_title : 'no explicit title in naming documentation', ['docs/naming-conventions.md']);
    const matched_components = evidence_data.pages.filter(page_data => page_data.page_id !== '1:4').flatMap(page_data => page_data.components.map(component_data => ({ ...component_data, page_name: page_data.page_name })));
    const figma_matches = matched_components.filter(component_data => component_data.component_name.split('/').at(-1).toLowerCase().replaceAll(' ', '-').replace('checkox', 'checkbox') === component_block);
    record_check(component_id, 'figma', 'component-name', figma_matches.some(component_data => component_data.component_name === story_data.story_title) ? 'verified' : figma_matches.length ? 'mismatch' : 'missing_evidence', story_data.story_title ?? 'resolved Storybook title', figma_matches.map(component_data => `${component_data.component_name} (${component_data.node_id}, ${component_data.page_name})`).join('; ') || 'no candidate in captured library pages', ['config/naming-figma-evidence.json', source_path]);
    if (!figma_matches.length) record_check(component_id, 'figma', 'property-mapping', 'missing_evidence', 'reviewed property-to-control mapping', 'no component candidate', ['config/naming-figma-evidence.json']);
    for (const component_data of figma_matches) {
      record_check(component_id, 'figma', `name-${component_data.node_id}`, component_data.component_name === story_data.story_title ? 'verified' : 'mismatch', story_data.story_title, `${component_data.component_name} (${component_data.page_name})`, ['config/naming-figma-evidence.json', source_path]);
      if (component_block === 'button' && component_data.node_id === '1394:1177') continue;
      record_check(component_id, 'figma', `properties-${component_data.node_id}`, 'missing_evidence', 'explicit reviewed property-to-control mapping', component_data.evidence_error || JSON.stringify(component_data.property_definitions), ['config/naming-figma-evidence.json', source_path]);
    }
  }
  const manual_page = evidence_data.pages.find(page_data => page_data.page_id === '1730:1342');
  for (const component_data of manual_page?.components ?? []) {
    const candidate_block = component_data.component_name.split('/').at(-1).toLowerCase().replaceAll(' ', '-').replace('checkox', 'checkbox');
    if (!component_rows.some(component_row => component_row.component_block === candidate_block)) {
      record_check(`figma-node-${component_data.node_id}`, 'figma', 'story-mapping', 'missing_evidence', 'reviewed Storybook component mapping or explicit exclusion', component_data.component_name, ['config/naming-figma-evidence.json']);
    }
  }
  const button_row = component_rows.find(component_row => component_row.component_id === 'atoms-button');
  const button_component = evidence_data.pages.flatMap(page_data => page_data.components).find(component_data => component_data.node_id === '1394:1177');
  const { BUTTON_STYLE_OPTIONS, button_style_args } = await import(resolve(project_root, 'src/stories/atoms/button/button.states.js'));
  record_check('atoms-button', 'contract', 'public-dimensions', compare_button_contract(button_component, button_row ?? { controls: {}, control_names: [] }, BUTTON_STYLE_OPTIONS), 'Atoms/Button; button_style primary/secondary/text; is_disabled BOOLEAN; button_state visual reference only', 'captured Figma definitions and parsed Storybook controls', ['config/naming-figma-evidence.json', 'src/stories/atoms/button/button.stories.js', 'src/stories/atoms/button/button.states.js']);
  const button_scss = await readFile(resolve(project_root, 'src/slice/src/scss/atoms/_button.scss'), 'utf8');
  record_check('atoms-button', 'theme', 'text-ghost-hover', button_style_args({ button_style: 'text' }).style_variant === 'ghost' && button_scss.includes('&:not(:disabled):hover') && theme_sources.some(theme_source => theme_source.source_text.includes('button--ghost')) ? 'verified' : 'mismatch', 'text → button--ghost; natural enabled CSS hover', 'adapter, SCSS selector, and Twig source checked', ['src/stories/atoms/button/button.states.js', 'src/slice/src/scss/atoms/_button.scss']);
  const summary_counts = Object.fromEntries(['verified', 'mismatch', 'missing_evidence'].map(check_status => [check_status, audit_rows.filter(audit_row => audit_row.check_status === check_status).length]));
  return { schema_version: 1, audit_kind: 'component-naming', generated_at: new Date().toISOString(), evidence_captured_at: evidence_data.captured_at, scope_note: 'Source naming checks only; Figma snapshot, theme Twig only, no runtime or visual certification. Guideline artwork and preserved AI library are not renamed. Unreviewed property mappings stay incomplete.', summary_counts, component_rows, audit_rows };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const audit_report = await audit_component_names();
  const output_index = process.argv.indexOf('--output');
  const report_text = `${JSON.stringify(audit_report, null, 2)}\n`;
  if (output_index !== -1) {
    if (!process.argv[output_index + 1]) throw new Error('--output requires a file path');
    const output_path = resolve(process.argv[output_index + 1]);
    await mkdir(dirname(output_path), { recursive: true });
    await writeFile(output_path, report_text);
    console.log(JSON.stringify(audit_report.summary_counts));
  } else console.log(report_text);
  if (process.argv.includes('--strict') && (audit_report.summary_counts.mismatch || audit_report.summary_counts.missing_evidence)) process.exitCode = 1;
}
