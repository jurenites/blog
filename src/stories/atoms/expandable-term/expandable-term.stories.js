import { expandable_term_markup } from './expandable-term.markup.js';
import { initialize_expandable_terms } from '../../../slice/src/js/expandable-term.js';

const TERM_LABEL = 'the whole product';
const EXPLANATION_TEXT = 'the business, the people using it, and the team building it';
const NESTED_LABEL = 'the business';
const NESTED_EXPLANATION = 'how the product creates value and earns its revenue';

export default {
  title: 'Atoms/Expandable Term',
  tags: ['autodocs'],
  args: { term_label: TERM_LABEL, explanation_text: EXPLANATION_TEXT },
  argTypes: { term_label: { control: 'text' }, explanation_text: { control: 'text' } },
  render: (story_args) => `<p>I care about ${expandable_term_markup(story_args)}.</p>`,
  play: ({ canvasElement: canvas_element }) => initialize_expandable_terms(canvas_element),
};

export const default_story = {};
export const nested_story = {
  render: (story_args) => `<blockquote><p>I care about ${expandable_term_markup({
    ...story_args,
    explanation_markup: `${expandable_term_markup({ term_label: NESTED_LABEL, explanation_text: NESTED_EXPLANATION })}, the people using it, and the team building it`,
  })}.</p></blockquote>`,
};
