import code_block_template from './code-block.template.html?raw';
import { escape_html, render_template } from '../../template.js';
import { highlight_sql } from './sql-highlight.js';

export function code_block_markup({ snippet_text = '', code_language = 'sql' } = {}) {
  const resolved_language = code_language === 'sql' ? 'sql' : 'text';
  return render_template(code_block_template, {
    code_language: resolved_language,
    language_label: resolved_language.toUpperCase(),
    highlighted_markup: resolved_language === 'sql' ? highlight_sql(snippet_text) : escape_html(snippet_text),
  });
}
