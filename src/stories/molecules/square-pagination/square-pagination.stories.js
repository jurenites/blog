import { square_pagination_markup } from './square-pagination.markup.js';
import { update_square_pagination } from '../../../slice/src/js/square-pagination.js';

const PAGE_LABELS = ['Show project 1', 'Show project 2', 'Show project 3', 'Show project 4'];
const PAGINATION_LABEL = 'Project pagination';

export default {
  title: 'Molecules/Square Pagination',
  tags: ['autodocs'],
  args: { page_labels: PAGE_LABELS, pagination_label: PAGINATION_LABEL },
  render: square_pagination_markup,
  play: ({ canvasElement: canvas_element }) => {
    const dot_elements = [...canvas_element.querySelectorAll('[data-slider-dot]')];
    dot_elements.forEach((dot_element, dot_index) => dot_element.addEventListener('click', () => update_square_pagination(dot_elements, dot_index)));
  },
};

export const default_story = {};
