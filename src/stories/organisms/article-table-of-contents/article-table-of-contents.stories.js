import { escape_html, render_template } from '../../template.js';
import { initialize_article_table_of_content, detach_article_table_of_content } from '../../../slice/src/js/article-table-of-content.js';
import article_template from './article-table-of-contents.template.html?raw';

const ARTICLE_TITLE = 'Designing a readable long-form article';
const CONTENTS_LABEL = 'Table of contents';
const COMMENTS_TITLE = 'Comments';
const COMMENT_TEXT = 'Headings outside Body are excluded from the contents.';
const PARAGRAPH_TEXT = 'A useful article gives readers a clear path through its ideas. Descriptive headings explain the structure, while the table of contents lets readers return to the details they need. The text stays in a comfortable reading column and the navigation follows alongside it on a wide screen.';
const BODY_SECTIONS = [
  { heading_level: 2, heading_text: 'Start with the reader', heading_id: 'reader-needs' },
  { heading_level: 3, heading_text: 'Make the structure visible' },
  { heading_level: 3, heading_text: 'Keep the reading rhythm' },
  { heading_level: 2, heading_text: 'Navigation through a long read' },
  { heading_level: 3, heading_text: 'Keyboard and shared links' },
  { heading_level: 2, heading_text: 'Review the result' },
];
const EDGE_SECTIONS = [
  { heading_level: 3, heading_text: 'A subsection before any H2' },
  { heading_level: 2, heading_text: 'Повторный заголовок' },
  { heading_level: 3, heading_text: 'Подробности' },
  { heading_level: 2, heading_text: 'Повторный заголовок' },
  { heading_level: 3, heading_text: 'A preserved anchor', heading_id: 'article-heading-review-the-result' },
  { heading_level: 2, heading_text: 'Review the result' },
];

export default {
  title: 'Organisms/Blog/Article Table of Contents',
  parameters: { layout: 'padded' },
  args: {
    article_title: ARTICLE_TITLE,
    contents_label: CONTENTS_LABEL,
    comments_title: COMMENTS_TITLE,
    comment_text: COMMENT_TEXT,
    paragraph_text: PARAGRAPH_TEXT,
    body_sections: BODY_SECTIONS,
  },
  render: (story_arguments) => render_template(article_template, {
    article_title: escape_html(story_arguments.article_title),
    contents_label: escape_html(story_arguments.contents_label),
    comments_title: escape_html(story_arguments.comments_title),
    comment_text: escape_html(story_arguments.comment_text),
    body_markup: story_arguments.body_sections.map((body_section) => {
      const heading_level = body_section.heading_level === 3 ? 3 : 2;
      const heading_id = body_section.heading_id ? ` id="${escape_html(body_section.heading_id)}"` : '';
      return `<h${heading_level}${heading_id}>${escape_html(body_section.heading_text)}</h${heading_level}>` +
        Array.from({ length: 3 }, () => `<p>${escape_html(story_arguments.paragraph_text)}</p>`).join('');
    }).join('') || `<p>${escape_html(story_arguments.paragraph_text)}</p>`,
  }),
  beforeEach: ({ canvasElement: canvas_element }) => () => detach_article_table_of_content(canvas_element),
  play: ({ canvasElement: canvas_element }) => initialize_article_table_of_content(canvas_element),
};

export const default_story = {};
export const repeated_and_cyrillic_headings = { args: { body_sections: EDGE_SECTIONS } };
export const single_heading = { args: { body_sections: BODY_SECTIONS.slice(0, 1) } };
export const without_headings = { args: { body_sections: [] } };
