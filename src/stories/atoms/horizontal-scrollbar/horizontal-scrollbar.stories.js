import { escape_html } from '../../template.js';
import './horizontal-scrollbar.scss';

const EXAMPLE_ITEMS = ['First item', 'Second item', 'Third item', 'Fourth item', 'Fifth item'];
const SCROLL_LABEL = 'Horizontal scrollbar example';

export default {
  title: 'Atoms/Horizontal Scrollbar',
  tags: ['autodocs'],
  args: { example_items: EXAMPLE_ITEMS, scroll_label: SCROLL_LABEL },
  render: ({ example_items, scroll_label }) => `<div class="horizontal-scrollbar horizontal-scrollbar-demo" tabindex="0" role="region" aria-label="${escape_html(scroll_label)}">${example_items.map((item_text) => `<div class="horizontal-scrollbar-demo__item">${escape_html(item_text)}</div>`).join('')}</div>`,
};

export const default_story = {};
