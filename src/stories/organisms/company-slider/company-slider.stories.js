import company_catalogue from '../../../../web/modules/custom/jurenites_companies/data/companies.json';
import { company_slider_markup } from './company-slider.markup.js';
import { initialize_company_sliders } from '../../../slice/src/js/company-slider.js';

const SECTION_HEADING = 'Companies I have worked with';
const COMPANY_ITEMS = company_catalogue;

export default {
  title: 'Organisms/Company Slider',
  tags: ['autodocs'],
  args: { section_heading: SECTION_HEADING, company_items: COMPANY_ITEMS },
  argTypes: { section_heading: { control: 'text' }, company_items: { control: 'object' } },
  render: company_slider_markup,
  play: ({ canvasElement: canvas_element }) => initialize_company_sliders(canvas_element),
};

export const default_story = {};
