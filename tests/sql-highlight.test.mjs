import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { highlight_sql } from '../src/stories/atoms/code-block/sql-highlight.js';

function original_text(highlighted_text) {
  return highlighted_text.replace(/<\/?span\b[^>]*>/g, '')
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'").replaceAll('&amp;', '&');
}

test('highlighting preserves saved SQL including whitespace and parameters', () => {
  const source_text = readFileSync(new URL('../scripts/contact-analytics/queries.sql', import.meta.url), 'utf8');
  const highlighted_text = highlight_sql(source_text);
  assert.equal(original_text(highlighted_text), source_text);
  assert.match(highlighted_text, /code-block__keyword">SELECT<\/span>/);
  assert.match(highlighted_text, /code-block__parameter">:report_id<\/span>/);
});

test('SQL strings and comments cannot introduce HTML or nested keyword highlighting', () => {
  const source_text = "SELECT '<img src=x onerror=alert(1)> SELECT it''s safe' -- SELECT <script>\n";
  const highlighted_text = highlight_sql(source_text);
  assert.equal(original_text(highlighted_text), source_text);
  assert.equal(highlighted_text.includes('<img'), false);
  assert.equal(highlighted_text.includes('<script>'), false);
  assert.equal((highlighted_text.match(/code-block__keyword/g) || []).length, 1);
});

test('quoted identifiers and multiline comments remain intact', () => {
  const source_text = '/* SELECT\nFROM */ SELECT "select", `from`, [where], 12.5, @report_id;';
  const highlighted_text = highlight_sql(source_text);
  assert.equal(original_text(highlighted_text), source_text);
  assert.equal((highlighted_text.match(/code-block__keyword/g) || []).length, 1);
  assert.equal((highlighted_text.match(/code-block__identifier/g) || []).length, 3);
});
