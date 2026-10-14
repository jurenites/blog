// Bounded, read-only inspection of explicit website routes. No links or forms are activated.
export async function discover_examples({ browser_instance, page_urls, component_selectors }) {
  const discovered_examples = [];
  const discovery_errors = [];
  for (const page_url of page_urls) {
    const page_instance = await browser_instance.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page_instance.addInitScript(() => document.addEventListener('play', (play_event) => { if (play_event.target instanceof HTMLMediaElement) play_event.target.muted = true; }, true));
    try {
      const page_response = await page_instance.goto(page_url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!page_response?.ok()) throw new Error(`HTTP ${page_response?.status()}`);
      await page_instance.evaluate(() => document.fonts.ready);
      const page_examples = await page_instance.evaluate((selector_rows) => {
        function unique_selector(target_element) {
          if (target_element.id) return `#${CSS.escape(target_element.id)}`;
          const class_selector = [...target_element.classList].map((class_name) => `.${CSS.escape(class_name)}`).join('');
          if (class_selector && document.querySelectorAll(class_selector).length === 1) return class_selector;
          const path_parts = [];
          let current_element = target_element;
          while (current_element && current_element !== document.body) {
            if (current_element.id) { path_parts.unshift(`#${CSS.escape(current_element.id)}`); break; }
            const element_tag = current_element.tagName.toLowerCase();
            const sibling_elements = [...current_element.parentElement.children].filter((sibling_element) => sibling_element.tagName === current_element.tagName);
            path_parts.unshift(`${element_tag}:nth-of-type(${sibling_elements.indexOf(current_element) + 1})`);
            current_element = current_element.parentElement;
          }
          return path_parts.join(' > ');
        }
        return Object.entries(selector_rows).flatMap(([component_id, selector_value]) => [...document.querySelectorAll(selector_value)].filter((component_element) => {
          const element_bounds = component_element.getBoundingClientRect();
          const element_style = getComputedStyle(component_element);
          return element_bounds.width > 0 && element_bounds.height > 0 && element_style.visibility !== 'hidden' && !component_element.closest('[hidden]');
        }).slice(0, 8).map((component_element) => ({
          component_id, page_url: location.href, page_title: document.title,
          component_selector: unique_selector(component_element),
          text_content: (component_element.matches('input') ? component_element.value : component_element.innerText ?? '').trim().slice(0, 180),
          class_names: component_element.className,
          link_url: component_element.closest('a')?.getAttribute('href') ?? '',
          inspected_at: new Date().toISOString(),
        })));
      }, component_selectors);
      discovered_examples.push(...page_examples);
    } catch (capture_error) { discovery_errors.push({ page_url, message: capture_error.message }); }
    finally { await page_instance.close(); }
  }
  return { discovered_examples, discovery_errors };
}
