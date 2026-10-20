import { code_block_markup } from './code-block.markup.js';

const CODE_LANGUAGE = 'sql';
const SNIPPET_TEXT = `-- Contact-page reach for the selected report
SELECT page_title, active_users,
  ROUND(100.0 * active_users / NULLIF(:site_users, 0), 1) AS reach_percent
FROM page_totals
WHERE report_id = :report_id
  AND page_title = 'Contact | jurenites'
ORDER BY active_users DESC;`;

export default {
  title: 'Atoms/Code Block',
  tags: ['autodocs'],
  render: code_block_markup,
  argTypes: {
    snippet_text: { control: 'text' },
    code_language: { control: 'select', options: ['sql', 'text'] },
  },
  args: { snippet_text: SNIPPET_TEXT, code_language: CODE_LANGUAGE },
};

export const default_story = {};
export const plain_text = { args: { code_language: 'text' } };
