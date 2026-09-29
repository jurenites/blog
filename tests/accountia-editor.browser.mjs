import { chromium } from 'playwright';
import { execFileSync as exec_file_sync } from 'node:child_process';
import assert from 'node:assert/strict';

// Exercise the real editor pipeline without saving or changing the stored node.
const browser_instance = await chromium.launch();
const page_instance = await browser_instance.newPage();
const login_url = exec_file_sync('docker', ['exec', 'blog_jurenites_web', 'vendor/bin/drush', 'user:login', '--uid=1', '--uri=http://jurenites.local'], { encoding: 'utf8' }).trim();
try {
  await page_instance.goto(login_url);
  await page_instance.goto('http://jurenites.local/node/105/edit');
  await page_instance.waitForFunction(() => window.Drupal?.CKEditor5Instances?.size > 0);
  const roundtrip_result = await page_instance.evaluate(() => {
    const editor_instance = [...Drupal.CKEditor5Instances.values()][0];
    const source_plugin = editor_instance.plugins.get('SourceEditing');
    const preview_selector = '.accountia-preview__phones, [data-accountia-gallery], [data-accountia-video]';
    const original_data = editor_instance.getData();
    function preview_snapshot(html_value) {
      const content_document = new DOMParser().parseFromString(html_value, 'text/html');
      return [...content_document.querySelectorAll(preview_selector)].map(preview_element => preview_element.outerHTML);
    }
    const original_previews = preview_snapshot(original_data);
    for (let cycle_index = 0; cycle_index < 2; cycle_index += 1) {
      source_plugin.isSourceEditingMode = true;
      source_plugin.isSourceEditingMode = false;
      editor_instance.setData(editor_instance.getData());
    }
    const saved_data = editor_instance.getData();
    const saved_document = new DOMParser().parseFromString(saved_data, 'text/html');
    const result_values = {
      original_previews,
      saved_previews: preview_snapshot(saved_data),
      phone_count: saved_document.querySelectorAll('[data-card-phone]').length,
      frame_count: saved_document.querySelectorAll('[data-screen-frame]').length,
      svg_count: saved_document.querySelectorAll('svg image').length,
    };
    // Raw blocks can still be deliberately removed by the author.
    saved_document.querySelector('.accountia-preview__phones').remove();
    editor_instance.setData(saved_document.body.innerHTML);
    result_values.removal_preserved = !editor_instance.getData().includes('accountia-preview__phones');
    editor_instance.setData(original_data);
    return result_values;
  });
  assert.equal(roundtrip_result.original_previews.length, 6);
  assert.deepEqual(roundtrip_result.saved_previews, roundtrip_result.original_previews);
  assert.equal(roundtrip_result.phone_count, 3);
  assert.equal(roundtrip_result.frame_count, 30);
  assert.equal(roundtrip_result.svg_count, 30);
  assert.equal(roundtrip_result.removal_preserved, true);
  console.log('PASS: Accountia preview structure survives visual/source reloads; intentional removal remains possible.');
} finally {
  await browser_instance.close();
}
