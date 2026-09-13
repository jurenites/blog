import technology_categories from '../../../../web/modules/custom/jurenites_technology_stack/data/technologies.json';
import { technology_stack_markup } from './technology-stack.markup.js';

const SECTION_HEADING = 'Technology stack';
const TECHNOLOGY_CATEGORIES = technology_categories;

export default {
  title: 'Organisms/Technology Stack',
  tags: ['autodocs'],
  render: technology_stack_markup,
  args: { section_heading: SECTION_HEADING, technology_categories: TECHNOLOGY_CATEGORIES },
  argTypes: { section_heading: { control: 'text' }, technology_categories: { control: 'object' } },
};

export const default_stack = {};
export const mobile_stack = { parameters: { viewport: { defaultViewport: 'mobile1' } } };
