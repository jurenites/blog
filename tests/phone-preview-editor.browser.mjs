import { chromium } from 'playwright';
import { execFileSync as exec_file_sync } from 'node:child_process';
import assert from 'node:assert/strict';

// Integration check against the existing local ScatchApp node. Saves revisions.
const browser_instance = await chromium.launch();
const page_instance = await browser_instance.newPage({ viewport: { width: 1440, height: 1100 } });
const runtime_errors = [];
page_instance.on('pageerror', error_value => runtime_errors.push(error_value.message));
const login_url = exec_file_sync('docker', ['exec', 'blog_jurenites_web', 'vendor/bin/drush', 'user:login', '--uid=1', '--uri=http://jurenites.local'], { encoding: 'utf8' }).trim();
try {
  await page_instance.goto(login_url);
  let saved_preview = '';
  for (const save_number of [1, 2]) {
    await page_instance.goto('http://jurenites.local/node/106/edit');
    await page_instance.waitForFunction(() => [...(window.Drupal?.CKEditor5Instances?.values() || [])].some(editor_instance => editor_instance.getData().includes('data-scatchapp-sequence')));
    const preview_result = await page_instance.evaluate(() => {
      const editor_instance = [...Drupal.CKEditor5Instances.values()].find(editor_item => editor_item.getData().includes('data-scatchapp-sequence'));
      const initial_data = editor_instance.getData();
      const source_plugin = editor_instance.plugins.get('SourceEditing');
      source_plugin.isSourceEditingMode = true;
      source_plugin.isSourceEditingMode = false;
      const preview_document = new DOMParser().parseFromString(editor_instance.getData(), 'text/html');
      const preview_wrapper = preview_document.querySelector('[data-scatchapp-sequence]');
      const preview_html = preview_wrapper.innerHTML;
      // Intentional removal must remain possible; restoring source is explicit.
      preview_wrapper.remove();
      editor_instance.setData(preview_document.body.innerHTML);
      const removal_preserved = !editor_instance.getData().includes('data-scatchapp-sequence');
      editor_instance.setData(initial_data);
      return {
        plugin_enabled: editor_instance.plugins.has('PhonePreview'),
        preview_html,
        removal_preserved,
        phone_count: new DOMParser().parseFromString(preview_html, 'text/html').querySelectorAll('[data-card-phone]').length,
        video_count: new DOMParser().parseFromString(preview_html, 'text/html').querySelectorAll('[data-card-phone] > [data-screen-sequence] > [data-screen-frame] video').length,
        stable_source: editor_instance.getData() === initial_data,
      };
    });
    assert.equal(preview_result.plugin_enabled, true);
    assert.equal(preview_result.removal_preserved, true);
    assert.equal(preview_result.phone_count, 1);
    assert.equal(preview_result.video_count, 2);
    assert.equal(preview_result.stable_source, true);
    if (saved_preview) assert.equal(preview_result.preview_html, saved_preview);
    saved_preview = preview_result.preview_html;
    if (save_number === 1) {
      await page_instance.locator('.phone-preview-editor').scrollIntoViewIfNeeded();
      await page_instance.screenshot({ path: '/tmp/phone-preview-protected-editor.png' });
    }
    // Change a different field, exactly the regression trigger, without changing copy.
    const revision_field = page_instance.locator('textarea[name="revision_log[0][value]"]');
    await revision_field.fill(`Verify protected phone preview survives node save ${save_number}.`);
    await page_instance.locator('input[type="submit"][value="Save"]').first().click();
    await page_instance.waitForURL(url_value => !url_value.pathname.endsWith('/edit'));
    const preview_card = page_instance.locator('[data-scatchapp-sequence] .card');
    await preview_card.scrollIntoViewIfNeeded();
    assert.equal(await preview_card.locator('[data-card-phone]').count(), 1);
    assert.equal(await preview_card.locator('[data-screen-frame] video').count(), 2);
    await page_instance.mouse.move(1400, 20);
    await page_instance.waitForFunction(() => document.querySelector('[data-scatchapp-sequence] video')?.currentTime > 0);
    await preview_card.locator('video').first().evaluate(video_element => { video_element.currentTime = video_element.duration - 0.25; });
    await page_instance.waitForFunction(() => {
      const video_element = document.querySelectorAll('[data-scatchapp-sequence] video')[1];
      return video_element.currentTime > 0 && !video_element.paused;
    });
    console.log(`PASS save ${save_number}: protected source, one phone, two nested videos, both playing in sequence.`);
  }
  assert.deepEqual(runtime_errors, []);
} finally {
  await browser_instance.close();
}
