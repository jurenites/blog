import { component_status_markup, connect_component_groups, source_link_markup } from './component-status.markup.js';
const SOURCE_LABEL = 'Storybook';
const SOURCE_URL = '/storybook/';
const COMPONENT_ROWS = [
  { component_id: 'atoms-button', component_name: 'Button', component_group: 'Atoms', overall_status: 'passed', checks: [{ check_key: 'drupal', status: 'passed' }, { check_key: 'storybook', status: 'passed' }, { check_key: 'figma', status: 'passed' }] },
  { component_id: 'example-article', component_name: 'Article Blog List Item', component_group: 'Molecules/Blog', story_ids: ['article--default', 'article--compact'], overall_status: 'attention', checks: [{ check_key: 'drupal', status: 'blocked' }, { check_key: 'storybook', status: 'passed', is_stale: true }, { check_key: 'figma', status: 'missing' }] },
  { component_id: 'example-select', component_name: 'Select Input', component_group: 'Atoms', story_ids: ['select--default', 'select--disabled', 'select--error'], overall_status: 'failed', checks: [{ check_key: 'drupal', status: 'failed' }, { check_key: 'storybook', status: 'passed' }, { check_key: 'figma', status: 'missing' }] },
  { component_id: 'example-avatar', component_name: 'Avatar', component_group: 'Atoms', story_ids: ['avatar--default'], overall_status: 'attention', checks: [] },
];
export default {
  title: 'Organisms/Testing Component status dashboard',
  tags: ['autodocs'],
  render: (story_args) => {
    const story_container = document.createElement('div');
    story_container.innerHTML = component_status_markup(story_args);
    connect_component_groups(story_container);
    return story_container;
  },
  args: { component_rows: COMPONENT_ROWS },
  parameters: { docs: { description: { component: 'Demonstration states only. Actual results are shown by the local Component status dashboard.' } } },
};
export const default_story = {};
export const source_link = {
  render: source_link_markup,
  args: { link_label: SOURCE_LABEL, link_url: SOURCE_URL },
  parameters: { docs: { description: { story: 'The review source link uses theme link styles and the Icon atom. Its suffix appears on hover and keyboard focus with a reserved 4px gap.' } } },
};
