import { chromium } from 'playwright';
import { execFileSync as exec_file_sync } from 'node:child_process';
import assert from 'node:assert/strict';

// Local integration check: saves node 111 with its phone previews centered.
const browser_instance = await chromium.launch();
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1100 } });
const runtime_errors = [];
page_instance.on('pageerror', error_value => runtime_errors.push(error_value.message));
try {
  const login_url = exec_file_sync('docker', ['exec', 'blog_jurenites_web', 'vendor/bin/drush', 'user:login', '--uid=1', '--uri=http://jurenites.local'], { encoding: 'utf8' }).trim();
  await page_instance.goto(login_url);
  await page_instance.goto('http://jurenites.local/node/111/edit');
  await page_instance.waitForFunction(() => [...(window.Drupal?.CKEditor5Instances?.values() || [])].some(editor_instance => editor_instance.getData().includes('data-phone-preview')));
  const preview_count = await page_instance.evaluate(() => {
    let preview_count = 0;
    for (const editor_instance of Drupal.CKEditor5Instances.values()) {
      for (const model_element of editor_instance.model.document.getRoot().getChildren()) {
        if (model_element.name !== 'phonePreview') continue;
        const original_html = model_element.getAttribute('preview_html');
        editor_instance.model.change(model_writer => model_writer.setSelection(model_element, 'on'));
        for (const alignment_name of ['right', 'left', 'center']) {
          editor_instance.execute('alignment', { value: alignment_name });
          if (editor_instance.commands.get('alignment').value !== alignment_name) throw new Error(`Alignment failed: ${alignment_name}`);
          if (model_element.getAttribute('preview_html') !== original_html) throw new Error('Preview artwork changed');
        }
        preview_count++;
      }
      if (!editor_instance.getData().includes('data-phone-preview')) continue;
      const initial_data = editor_instance.getData();
      const source_plugin = editor_instance.plugins.get('SourceEditing');
      source_plugin.isSourceEditingMode = true;
      source_plugin.isSourceEditingMode = false;
      if (editor_instance.getData() !== initial_data) throw new Error('Source roundtrip changed alignment or markup');
    }
    return preview_count;
  });
  assert.ok(preview_count > 0);
  const preview_widget = page_instance.locator('.phone-preview-editor').first();
  await preview_widget.click();
  const editor_container = preview_widget.locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " ck-editor ")][1]');
  for (const alignment_name of ['right', 'left', 'center']) {
    await editor_container.getByRole('button', { name: `Align ${alignment_name}`, exact: true }).click();
    assert.equal(await preview_widget.evaluate(widget_element => getComputedStyle(widget_element).textAlign), alignment_name);
  }
  await preview_widget.scrollIntoViewIfNeeded();
  await page_instance.screenshot({ path: '/tmp/editor-alignment.png' });
  await page_instance.locator('input[name="revision"]').check();
  await page_instance.locator('textarea[name="revision_log[0][value]"]').fill('Center the iPhone previews using the rich-text alignment controls.');
  await page_instance.locator('input[type="submit"][value="Save"]').first().click();
  await page_instance.waitForURL(url_value => !url_value.pathname.endsWith('/edit'));
  const preview_cards = page_instance.locator('[data-phone-preview] > .card');
  assert.equal(await preview_cards.count(), preview_count);
  for (const preview_card of await preview_cards.all()) {
    const center_delta = await preview_card.evaluate(card_element => {
      const card_bounds = card_element.getBoundingClientRect();
      const wrapper_bounds = card_element.parentElement.getBoundingClientRect();
      return Math.abs(card_bounds.x + card_bounds.width / 2 - wrapper_bounds.x - wrapper_bounds.width / 2);
    });
    assert.ok(center_delta < 1, `Card is off center by ${center_delta}px`);
  }
  await page_instance.waitForTimeout(6000);
  await preview_cards.first().scrollIntoViewIfNeeded();
  await page_instance.waitForTimeout(1000);
  await page_instance.screenshot({ path: '/tmp/phone-alignment-public.png' });
  await page_instance.goto('http://jurenites.local/node/111/edit');
  await page_instance.waitForFunction(() => [...(window.Drupal?.CKEditor5Instances?.values() || [])].some(editor_instance => editor_instance.getData().includes('data-phone-preview')));
  const saved_count = await page_instance.evaluate(() => [...Drupal.CKEditor5Instances.values()].flatMap(editor_instance => [...editor_instance.model.document.getRoot().getChildren()]).filter(model_element => model_element.name === 'phonePreview' && model_element.getAttribute('alignment') === 'center').length);
  assert.equal(saved_count, preview_count);
  assert.deepEqual(runtime_errors, []);
  console.log(`PASS: ${preview_count} previews aligned, source roundtrip stable, save/reload preserved center, public geometry centered.`);
} finally {
  await browser_instance.close();
}
