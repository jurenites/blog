import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const TRACKER_SOURCE = (await readFile(new URL('../web/modules/custom/jurenites_metrika/js/metrika-counter.js', import.meta.url), 'utf8')).replaceAll('METRIKA_COUNTER_ID', '113437271');
const TRACKER_URL = 'https://mc.yandex.ru/metrika/tag.js?id=113437271';

function create_browser_context(existing_scripts = []) {
  const script_elements = [...existing_scripts];
  const browser_window = { location: { href: 'https://jurenites.com/ru' } };
  const page_document = {
    scripts: script_elements,
    referrer: 'https://example.org/',
    createElement: () => ({}),
    head: { appendChild: (script_element) => script_elements.push(script_element) },
  };
  return { browser_window, page_document, script_elements };
}

test('queues the supplied counter and options and loads the tracker asynchronously', () => {
  const { browser_window, page_document, script_elements } = create_browser_context();
  vm.runInNewContext(TRACKER_SOURCE, { window: browser_window, document: page_document });
  assert.equal(script_elements.length, 1);
  assert.equal(script_elements[0].src, TRACKER_URL);
  assert.equal(script_elements[0].async, true);
  const [counter_id, method_name, counter_options] = browser_window.ym.a[0];
  assert.equal(counter_id, 113437271);
  assert.equal(method_name, 'init');
  assert.deepEqual(JSON.parse(JSON.stringify(counter_options)), {
    ssr: true, webvisor: true, clickmap: true, ecommerce: 'dataLayer',
    referrer: page_document.referrer, url: browser_window.location.href,
    accurateTrackBounce: true, trackLinks: true,
  });
});

test('reuses an existing tracker script and preserves the existing command queue', () => {
  const { browser_window, page_document, script_elements } = create_browser_context([{ src: TRACKER_URL }]);
  const queued_commands = [];
  browser_window.ym = (...command_args) => queued_commands.push(command_args);
  browser_window.ym.l = 12345;
  vm.runInNewContext(TRACKER_SOURCE, { window: browser_window, document: page_document });
  assert.equal(script_elements.length, 1);
  assert.equal(browser_window.ym.l, 12345);
  assert.equal(queued_commands[0][0], 113437271);
});
