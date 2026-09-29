import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const browser_instance = await chromium.launch({headless:true});
const page_instance = await browser_instance.newPage({viewport:{width:1300,height:1000}});
const runtime_errors=[];
page_instance.on('pageerror', error_value=>runtime_errors.push(error_value.message));
const login_url=execFileSync('docker',['exec','blog_jurenites_web','vendor/bin/drush','user:login','--uid=1','--uri=http://jurenites.local'],{encoding:'utf8'}).trim();
await page_instance.goto(login_url);
await page_instance.goto('http://jurenites.local/node/add/page');
await page_instance.waitForFunction(()=>window.Drupal?.CKEditor5Instances?.size>0);
console.log(await page_instance.evaluate(()=>{
 const editor_instance=[...Drupal.CKEditor5Instances.values()][0];
 editor_instance.setData('<h2>Source preview</h2><p>A <strong>bold</strong> word &amp; <a href="https://example.com">a link</a>.</p><ul><li>First item</li><li>Second item</li></ul>');
 editor_instance.plugins.get('SourceEditing').isSourceEditingMode=true;
 return {plugin:editor_instance.plugins.has('SourceCode'),source:document.querySelector('.source-code textarea')?.value};
}));
const source_area=page_instance.locator('.source-code textarea').first();
await source_area.waitFor();
await source_area.scrollIntoViewIfNeeded();
assert.ok(await page_instance.locator('.source-code__tag').count()>0);
await page_instance.locator('.source-code').screenshot({path:'/tmp/jurenites-source-editor.png'});
console.log(await source_area.evaluate(source_area=>{ const highlight_layer=source_area.parentElement.querySelector('pre');return {textarea:getComputedStyle(source_area).cssText,font:getComputedStyle(source_area).font,highlight_font:getComputedStyle(highlight_layer).font,color:getComputedStyle(highlight_layer.querySelector('span')).color};}));
await source_area.fill('<p>First</p><p>Second <strong>bold</strong> word.</p>');
await page_instance.locator('.source-code__format').click();
assert.match(await source_area.inputValue(), /\n/);
await source_area.evaluate(source_area=>{source_area.value='<p>Pasted</p><p>Next</p>';source_area.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertFromPaste'}));});
assert.equal(await source_area.inputValue(), '<p>Pasted</p><p>Next</p>');
assert.equal(await page_instance.locator('.source-code__highlight').textContent(),(await source_area.inputValue())+'\n');
console.log(await page_instance.evaluate(()=>{const editor_instance=[...Drupal.CKEditor5Instances.values()][0];editor_instance.plugins.get('SourceEditing').isSourceEditingMode=false; const result_data=editor_instance.getData();editor_instance.plugins.get('SourceEditing').isSourceEditingMode=true;return result_data;}));
assert.equal(await page_instance.locator('.source-code__highlight').count(),1);
// Long source must scroll inside the editor, with the decorative text aligned.
const long_source = Array.from({ length: 300 }, (_row_value, row_index) =>
  `<p>Source row ${row_index}: a long sentence about accounting, invoices and warehouse inventory.</p>`).join('\n');
await source_area.fill(long_source);
await source_area.evaluate(source_element => { source_element.scrollTop = source_element.scrollHeight; });
await page_instance.waitForFunction(() => {
  const source_element = document.querySelector('.source-code textarea');
  const highlight_element = document.querySelector('.source-code__highlight');
  return source_element.scrollTop > 0 && source_element.scrollTop === highlight_element.scrollTop;
});
assert.equal(await source_area.evaluate(source_element => {
  const highlight_element = source_element.parentElement.querySelector('pre');
  return source_element.clientHeight === highlight_element.clientHeight
    && source_element.scrollHeight === highlight_element.scrollHeight
    && source_element.parentElement.scrollHeight < innerHeight;
}), true);
await source_area.evaluate(source_element => {
  source_element.value += '\n<p>Edited at the end.</p>';
  source_element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
});
assert.equal(await page_instance.locator('.source-code__highlight').textContent(), (await source_area.inputValue()) + '\n');
// Native browser Find must reveal source matches without searching the mirror.
await source_area.evaluate(source_element => {
  source_element.setSelectionRange(0, 0);
  source_element.scrollTop = 0;
  window.getSelection().removeAllRanges();
});
assert.equal(await page_instance.evaluate(() => window.find('Source row 250:', false, false, false)), true);
await page_instance.waitForFunction(() => document.querySelector('.source-code textarea').scrollTop > 0);
assert.equal(await source_area.evaluate(source_element => source_element.value.slice(source_element.selectionStart, source_element.selectionEnd)), 'Source row 250:');
assert.equal(await source_area.evaluate(source_element => source_element.scrollTop === source_element.parentElement.querySelector('pre').scrollTop), true);
assert.equal(await page_instance.locator('.source-code__highlight').evaluate(highlight_element => highlight_element.inert), true);
assert.equal(await page_instance.evaluate(() => window.find('Source row 250:', false, false, false)), false);
await page_instance.locator('.source-code').screenshot({ path: '/tmp/jurenites-source-find.png' });
assert.equal(await page_instance.evaluate(() => window.find('Source row 20:', false, true, false)), true);
await page_instance.waitForFunction(() => document.querySelector('.source-code textarea').scrollTop < 2000);
// Native copy/paste in the middle must preserve the viewport and caret.
await source_area.evaluate(source_element => {
  const caret_offset = source_element.value.indexOf('Source row 150');
  source_element.focus({ preventScroll: true });
  source_element.setSelectionRange(caret_offset, caret_offset + 6);
  source_element.scrollTop = (source_element.scrollHeight - source_element.clientHeight) / 2;
});
const before_clipboard = await source_area.evaluate(source_element => ({
  scroll_top: source_element.scrollTop,
  page_scroll: window.scrollY,
  selection_start: source_element.selectionStart,
  selection_end: source_element.selectionEnd,
  source_text: source_element.value,
}));
await page_instance.keyboard.press('ControlOrMeta+c');
await page_instance.keyboard.press('ControlOrMeta+v');
assert.equal(await source_area.inputValue(), before_clipboard.source_text);
assert.equal(await source_area.evaluate(source_element => source_element.selectionStart), before_clipboard.selection_end);
assert.equal(await source_area.evaluate(source_element => source_element.scrollTop), before_clipboard.scroll_top);
assert.equal(await page_instance.evaluate(() => window.scrollY), before_clipboard.page_scroll);
// Drag the native wrapper handle and check both text layers grow together.
const source_wrapper = page_instance.locator('.source-code').first();
await source_wrapper.evaluate(wrapper_element => wrapper_element.scrollIntoView({ block: 'center', behavior: 'instant' }));
const wrapper_bounds = await source_wrapper.boundingBox();
assert.equal(await source_wrapper.evaluate(wrapper_element => getComputedStyle(wrapper_element).resize), 'vertical');
await page_instance.mouse.move(wrapper_bounds.x + wrapper_bounds.width - 8, wrapper_bounds.y + wrapper_bounds.height - 8);
await page_instance.mouse.down();
await page_instance.mouse.move(wrapper_bounds.x + wrapper_bounds.width - 8, wrapper_bounds.y + wrapper_bounds.height + 117, { steps: 10 });
await page_instance.mouse.up();
assert.ok((await source_wrapper.boundingBox()).height > wrapper_bounds.height + 80);
assert.equal(await source_area.evaluate(source_element => source_element.clientHeight === source_element.parentElement.querySelector('pre').clientHeight), true);
await source_wrapper.screenshot({ path: '/tmp/jurenites-source-editor-resized.png' });
await source_area.fill('\n\n  \n<p>First</p><p>Second</p>');
await page_instance.locator('.source-code__format').click();
assert.ok((await source_area.inputValue()).startsWith('<p>'));
const figure_source = '<p>Before</p>\n  \n<figure class="image">\n    \n    <img src="/example.png">\n    \n    <figcaption>Caption</figcaption>\n    \n</figure>\n  \n<figure class="image"><img src="/second.png"></figure>\n\n<p>After</p>';
await source_area.fill(figure_source);
await page_instance.locator('.source-code__format').click();
const formatted_figure = await source_area.inputValue();
assert.doesNotMatch(formatted_figure, /\n[\t ]*\n/);
assert.match(formatted_figure, /<figure class="image">\n +<img/);
await page_instance.locator('.source-code__format').click();
assert.doesNotMatch(await source_area.inputValue(), /\n[\t ]*\n/);
await page_instance.locator('.source-code').screenshot({ path: '/tmp/jurenites-source-figures.png' });
await source_area.fill('<p title="a > b">Safe &amp; <strong>inline</strong> text.</p><pre>  keep\n\n    spacing</pre>');
await page_instance.locator('.source-code__format').click();
assert.match(await source_area.inputValue(), /<pre>  keep\n\n    spacing<\/pre>/);
assert.equal(await page_instance.locator('.source-code__value').first().textContent(), '"a > b"');
await page_instance.evaluate(()=>[...Drupal.CKEditor5Instances.values()][0].enableReadOnlyMode('test'));
assert.equal(await source_area.getAttribute('readonly'), '');
assert.equal(await page_instance.locator('.source-code__format').isDisabled(), true);
await page_instance.evaluate(()=>[...Drupal.CKEditor5Instances.values()][0].disableReadOnlyMode('test'));
await page_instance.setViewportSize({width:390,height:844});
assert.equal(await source_area.evaluate(source_area=>getComputedStyle(source_area).font===getComputedStyle(source_area.parentElement.querySelector('pre')).font),true);
assert.deepEqual(runtime_errors,[]);
console.log('PASS: plugin, highlighting, formatting, paste, data sync, toggle, no runtime errors');
await browser_instance.close();
