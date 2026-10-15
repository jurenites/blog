import { BUTTON_STYLE_OPTIONS } from '../../atoms/button/button.states.js';

const SOURCE_DEFINITIONS = [
  { source_key: 'figma', source_label: 'Figma', icon_name: 'brand-figma' },
  { source_key: 'storybook', source_label: 'Storybook', icon_name: 'brand-storybook' },
  { source_key: 'drupal', source_label: 'Web', icon_name: 'globe' },
];
const SOURCE_STATUS_LABELS = {
  attached: 'Source attached', incomplete: 'Source settings incomplete', missing: 'Source missing',
};

export function component_variant_count(component_row) {
  // Button's one story renders every style × enabled/disabled combination.
  // Pointer interactions do not multiply the number of component variants.
  if (component_row.component_id === 'atoms-button') return BUTTON_STYLE_OPTIONS.length * 2;
  return new Set(component_row.story_ids ?? []).size;
}

export function component_source_states(component_row) {
  const source_case = component_row.source_case ?? {};
  const has_value = field_value => typeof field_value === 'string' && field_value.trim().length > 0;
  const valid_source_url = (source_url, is_figma = false) => {
    try {
      const parsed_url = new URL(source_url, 'http://localhost');
      return ['http:', 'https:'].includes(parsed_url.protocol) && (!is_figma || ['figma.com', 'www.figma.com'].includes(parsed_url.hostname));
    } catch { return false; }
  };
  const figma_status = has_value(source_case.figma_url) ? valid_source_url(source_case.figma_url, true) ? 'attached' : 'incomplete'
    : has_value(source_case.figma_baseline) && !source_case.remove_baseline ? 'attached' : 'missing';
  const story_url = source_case.story_url ?? (component_row.story_ids?.length ? `/storybook/iframe.html?id=${component_row.story_ids[0]}` : '');
  const story_status = has_value(story_url) ? valid_source_url(story_url) ? 'attached' : 'incomplete' : 'missing';
  const website_examples = source_case.website_examples ?? [{ page_url: source_case.drupal_url, component_selector: source_case.drupal_selector }];
  const has_website_source = website_examples.some(example_row => has_value(example_row.page_url) || has_value(example_row.component_selector));
  const web_status = !has_website_source ? 'missing' : website_examples.every(example_row => has_value(example_row.page_url) && valid_source_url(example_row.page_url) && has_value(example_row.component_selector)) ? 'attached' : 'incomplete';
  const source_statuses = { figma: figma_status, storybook: story_status, drupal: web_status };
  return SOURCE_DEFINITIONS.map(source_definition => {
    const status_key = source_statuses[source_definition.source_key];
    return { ...source_definition, status_key, status_label: SOURCE_STATUS_LABELS[status_key] };
  });
}
