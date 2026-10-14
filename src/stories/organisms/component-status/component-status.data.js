import { BUTTON_STYLE_OPTIONS } from '../../atoms/button/button.states.js';

const SOURCE_DEFINITIONS = [
  { source_key: 'drupal', source_label: 'Web', icon_name: 'globe' },
  { source_key: 'storybook', source_label: 'Storybook', icon_name: 'brand-storybook' },
  { source_key: 'figma', source_label: 'Figma', icon_name: 'brand-figma' },
];
const SOURCE_STATUS_LABELS = {
  passed: 'Passed', failed: 'Failed', blocked: 'Blocked',
  missing: 'Missing', not_checked: 'Not checked', stale: 'Stale',
};

export function component_variant_count(component_row) {
  // Button's one story renders every style × enabled/disabled combination.
  // Pointer interactions do not multiply the number of component variants.
  if (component_row.component_id === 'atoms-button') return BUTTON_STYLE_OPTIONS.length * 2;
  return new Set(component_row.story_ids ?? []).size;
}

export function component_source_states(component_row) {
  return SOURCE_DEFINITIONS.map(source_definition => {
    const source_check = component_row.checks?.find(check_result => check_result.check_key === source_definition.source_key);
    const recorded_status = source_check?.status ?? 'not_checked';
    const status_key = source_check?.is_stale && !['missing', 'not_checked'].includes(recorded_status) ? 'stale'
      : Object.hasOwn(SOURCE_STATUS_LABELS, recorded_status) ? recorded_status : 'not_checked';
    return { ...source_definition, status_key, status_label: SOURCE_STATUS_LABELS[status_key] };
  });
}
