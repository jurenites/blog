import { role_slider_markup } from './role-slider.markup.js';
import { numeric_values_markup } from '../numeric-values/numeric-values.markup.js';
import { expandable_term_markup } from '../../atoms/expandable-term/expandable-term.markup.js';
import { initialize_role_sliders } from '../../../slice/src/js/role-slider.js';
import { initialize_expandable_terms } from '../../../slice/src/js/expandable-term.js';

const ROLE_ITEMS = [
  { numeric_number: '~10 000h', numeric_description: 'As a Web developer', role_heading: 'Web developer', numeric_caption: '*tracked with', numeric_caption_link_label: 'redmine.org', numeric_caption_link_url: 'https://redmine.org', story_text: 'Your web development story goes here.' },
  { numeric_number: '~10 000h', numeric_description: 'As a Project manager & product owner', role_heading: 'Project manager & product owner', story_text: 'Your project management and product ownership story goes here.' },
  { numeric_number: '~8 000h', numeric_description: 'As a Business analyst & UI/UX designer', role_heading: 'Business analyst & UI/UX designer', story_text: 'Your business analysis and design story goes here.' },
];
const METRIC_ITEMS = [
  { numeric_number: '80+', numeric_description: 'Commercial projects', numeric_link_label: 'See timeline', numeric_link_url: '/timeline' },
  { numeric_number: '16', numeric_description: 'Years in software development' },
];
const EXPANDED_STORY = `<p>I care about ${expandable_term_markup({
  term_label: 'the whole product', explanation_markup: `${expandable_term_markup({ term_label: 'the business', explanation_text: 'how the product creates value and earns its revenue' })}, the people using it, and the team building it`,
})}.</p>`;

export default {
  title: 'Organisms/Role Slider', tags: ['autodocs'],
  args: { role_items: ROLE_ITEMS, metric_items: METRIC_ITEMS },
  argTypes: { role_items: { control: 'object' }, metric_items: { control: 'object' } },
  render: (story_args) => numeric_values_markup({ numeric_items: story_args.metric_items, section_label: 'Experience in numbers' }) + role_slider_markup(story_args),
  play: ({ canvasElement: canvas_element }) => {
    initialize_role_sliders(canvas_element);
    initialize_expandable_terms(canvas_element);
  },
};
export const default_story = {};
export const nested_explanation = {
  args: { role_items: ROLE_ITEMS.map((role_item, item_index) => item_index === 0 ? { ...role_item, story_markup: EXPANDED_STORY } : role_item) },
};
