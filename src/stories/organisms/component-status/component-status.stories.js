import { component_status_markup } from './component-status.markup.js';
const COMPONENT_ROWS = [
  { component_id: 'example-button', component_name: 'Button', overall_status: 'passed', checks: [{ status: 'passed' }] },
  { component_id: 'example-article', component_name: 'Article Blog List Item', overall_status: 'attention', checks: [{ status: 'blocked' }] },
  { component_id: 'example-select', component_name: 'Select Input', overall_status: 'failed', checks: [{ status: 'failed' }] },
  { component_id: 'example-avatar', component_name: 'Avatar', overall_status: 'attention', checks: [] },
];
export default {
  title: 'Organisms/Component Status',
  tags: ['autodocs'],
  render: component_status_markup,
  args: { component_rows: COMPONENT_ROWS },
  parameters: { docs: { description: { component: 'Demonstration states only. Actual results are shown by the local Component status dashboard.' } } },
};
export const default_story = {};
