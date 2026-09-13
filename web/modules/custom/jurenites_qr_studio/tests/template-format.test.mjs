import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {format_studio_template} from '../../../../../scripts/format-qr-studio-twig.mjs';

test('Twig layout switching preserves inline spaces, quoted attributes, expressions and raw content',()=>{
 const compact_text=`<!doctype html><html><head><css-placeholder token="{{ placeholder_token }}"></head><body><span>QR <strong>PIXEL</strong></span><a href="{{ url('a>b') }}" title="A > B">Go</a><span>One</span> <span>Two</span><pre> A\n  B</pre><script>const source_text = '<tag>';\n</script></body></html>\n`;
 const expanded_text=format_studio_template(compact_text,'expand');
 assert.match(expanded_text,/<html>\n  <head>\n    <css-placeholder/);
 assert.equal(format_studio_template(expanded_text,'compact'),compact_text);
 assert.equal(format_studio_template(expanded_text,'expand'),expanded_text);
 assert.ok(expanded_text.includes('<pre> A\n  B</pre>'));
 assert.throws(()=>format_studio_template('{% if enabled %}<div></div>{% endif %}','expand'),/control-flow/);
});

test('the QR Studio template survives both formatting directions',async()=>{
 const source_text=await readFile(new URL('../templates/qr-studio-document.html.twig',import.meta.url),'utf8');
 const compact_text=format_studio_template(source_text,'compact');
 assert.equal(format_studio_template(format_studio_template(compact_text,'expand'),'compact'),compact_text);
 assert.match(compact_text,/<span>QR <strong>/);
 for(const template_variable of ['favicon_url','placeholder_token','studio_url','website_url'])assert.ok(compact_text.includes(`{{ ${template_variable} }}`));
});
