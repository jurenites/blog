import { escape_html } from '../../template.js';

// A display lexer, not a SQL parser. Match strings/comments first so their
// contents cannot be interpreted as keywords or executable HTML.
const SQL_KEYWORDS = new Set(('SELECT FROM WHERE AS AND OR NOT NULL NULLIF ROUND CASE WHEN THEN ELSE END '
  + 'JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER ASC DESC HAVING LIMIT OFFSET DISTINCT '
  + 'WITH UNION ALL EXISTS IN IS BETWEEN LIKE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE '
  + 'IF PRIMARY KEY REFERENCES CHECK PRAGMA COUNT SUM AVG MIN MAX COALESCE').split(' '));
const SQL_LEXEMES = /(--[^\r\n]*|\/\*[\s\S]*?(?:\*\/|$)|'(?:''|[^'])*(?:'|$)|"(?:""|[^"])*(?:"|$)|`(?:``|[^`])*(?:`|$)|\[(?:[^\]])*\]|[:@$][a-z_]\w*|\b\d+(?:\.\d+)?\b|\b[a-z_]\w*\b)/gi;

export function highlight_sql(snippet_text) {
  const source_text = String(snippet_text);
  let source_offset = 0;
  let highlighted_text = '';
  for (const token_match of source_text.matchAll(SQL_LEXEMES)) {
    highlighted_text += escape_html(source_text.slice(source_offset, token_match.index));
    const token_text = token_match[0];
    let token_kind = '';
    if (/^(--|\/\*)/.test(token_text)) token_kind = 'comment';
    else if (token_text.startsWith("'")) token_kind = 'string';
    else if (/^["`[]/.test(token_text)) token_kind = 'identifier';
    else if (/^[:@$]/.test(token_text)) token_kind = 'parameter';
    else if (/^\d/.test(token_text)) token_kind = 'number';
    else if (SQL_KEYWORDS.has(token_text.toUpperCase())) token_kind = 'keyword';
    highlighted_text += token_kind
      ? `<span class="code-block__${token_kind}">${escape_html(token_text)}</span>`
      : escape_html(token_text);
    source_offset = token_match.index + token_text.length;
  }
  return highlighted_text + escape_html(source_text.slice(source_offset));
}
