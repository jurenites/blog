import { escape_html } from '../stories/template.js';

function image_reference(component_row, check_key, image_label) {
  const check_result = component_row.checks.find((check_item) => check_item.check_key === check_key);
  return check_result?.artifacts?.find((artifact_item) => artifact_item.artifact_label === image_label)?.artifact_path ?? '';
}

export function review_panel_markup(component_row, case_config, saved_case) {
  const review_case = saved_case ?? {};
  const story_url = review_case.story_url ?? `/storybook/iframe.html?id=${encodeURIComponent(component_row.story_ids[0])}&viewMode=story`;
  const field_value = (field_name, fallback_value = '') => escape_html(String(review_case[field_name] ?? case_config[field_name] ?? fallback_value));
  const website_image = image_reference(component_row, 'drupal', 'Actual website');
  const story_image = image_reference(component_row, 'storybook', 'Storybook');
  const figma_image = review_case.figma_baseline ?? '';
  const check_result = component_row.checks.find((check_item) => check_item.check_key === 'integration');
  const figure_markup = (figure_title, artifact_path, missing_text) => `<figure class="visual-review__figure"><figcaption>${figure_title}</figcaption>${artifact_path ? `<a href="/${escape_html(artifact_path)}" target="_blank" rel="noopener"><img class="visual-review__image" src="/${escape_html(artifact_path)}" alt="${figure_title}"></a>` : `<p class="visual-review__empty">${missing_text}</p>`}</figure>`;
  return `<section class="visual-review" aria-label="Visual comparison">
    <h3>Compare this component</h3>
    <p>Choose the real page and the region to capture. Website captures keep the page’s CSS, inherited styles, and surrounding layout. Match the text, language, state, and available component width in Storybook.</p>
    <form id="visual-review-form" class="visual-review__form">
      <label class="visual-review__field">Website URL or path<input class="text-input__control" name="drupal_url" required value="${field_value('drupal_url')}" placeholder="/portfolio/4pixel"></label>
      <label class="visual-review__field">Website component selector<input class="text-input__control" name="drupal_selector" required value="${field_value('drupal_selector')}" placeholder=".font-preview--4pixel"></label>
      <label class="visual-review__field">Storybook URL / args<input class="text-input__control" name="story_url" required value="${escape_html(story_url)}"></label>
      <label class="visual-review__field">Storybook component selector<input class="text-input__control" name="story_selector" required value="${field_value('story_selector')}" placeholder=".font-preview--4pixel"></label>
      <label class="visual-review__field">Viewport width<select name="viewport_width">${[360, 768, 1280, 1920].map((pixel_width) => `<option value="${pixel_width}" ${pixel_width === Number(review_case.viewport_width ?? case_config.viewport_widths?.[0] ?? 1280) ? 'selected' : ''}>${pixel_width}px</option>`).join('')}</select></label>
      <label class="visual-review__field">Viewport height<input class="text-input__control" name="viewport_height" type="number" min="320" max="2560" step="1" required value="${field_value('viewport_height', 900)}"></label>
      <label class="visual-review__field">Figma frame link (optional)<input class="text-input__control" name="figma_url" type="url" value="${field_value('figma_url')}" placeholder="https://www.figma.com/design/…"></label>
      <label class="visual-review__field">Figma reference PNG (optional, 1×)<input name="figma_png" type="file" accept="image/png">${figma_image ? '<span>Saved reference available. A new file replaces it.</span>' : '<span>Missing is fine: website / Storybook comparison works without Figma.</span>'}</label>
      ${figma_image ? '<label class="visual-review__checkbox"><input name="remove_baseline" type="checkbox">Remove saved Figma reference</label>' : ''}
      <label class="visual-review__checkbox"><input name="inputs_matched" type="checkbox" ${review_case.inputs_matched ? 'checked' : ''}>I checked that content, language, and state match across the selected references.</label>
      <div class="visual-review__actions"><button class="status-dashboard__refresh" type="submit">Capture and compare</button><span id="visual-review-message" role="status">Captures use a fresh browser session. Unchecked content matching produces an exploratory diff.</span></div>
    </form>
    <p class="status-dashboard__meta">${check_result?.checked_at ? `Last comparison: ${escape_html(new Date(check_result.checked_at).toLocaleString())}${check_result.is_stale ? ' · stale; capture again' : ''}.` : 'No comparison has run for this component yet.'} These are fitted previews; their scales can differ. Use the 1:1 overlay or open an image for precise comparison. Open live HTML below to interact.</p>
    <div class="visual-review__three-up">${figure_markup('Figma · expected design', figma_image, 'Missing — no Figma PNG yet.')}${figure_markup('Storybook · component', story_image, 'Not captured — choose a selector and run.')}${figure_markup('Website · actual page region', website_image, 'Not captured — choose the page and region.')}</div>
    ${story_image && website_image ? `<div class="visual-review__comparison"><h3>Overlay and differences</h3><div class="visual-review__actions"><label class="visual-review__field">Compare<select id="comparison-pair"><option value="implementation">Storybook / website</option>${figma_image ? '<option value="figma-story">Figma / Storybook</option><option value="figma-web">Figma / website</option>' : ''}</select></label><label class="visual-review__field">View<select id="comparison-mode"><option value="overlay">Overlay</option><option value="wipe">Wipe</option><option value="difference">Pixel difference</option></select></label><label class="visual-review__field">Layer balance<input id="comparison-balance" type="range" min="0" max="100" value="50"></label><button id="comparison-toggle" class="status-dashboard__refresh" type="button">Toggle layer</button></div><p id="comparison-message" role="status"></p><div class="visual-review__canvas-scroll"><canvas id="comparison-canvas" class="visual-review__canvas" aria-label="Aligned visual comparison"></canvas></div></div>` : ''}
    <details class="visual-review__live"><summary>Live HTML views</summary><p>Storybook is interactive below. Drupal uses a separate live tab because its frame policy blocks embedding here. The website capture above comes from the complete page. Figma is a design canvas, not website HTML.</p><nav class="status-dashboard__source-links"><a id="live-story-link" href="${escape_html(story_url)}" target="_blank" rel="noopener">Open Storybook ↗</a><a id="live-website-link" href="${field_value('drupal_url', 'http://jurenites.local')}" target="_blank" rel="noopener">Open real website ↗</a></nav><p>The live preview uses the URL above; edits to the capture form apply on the next capture. Its viewport width matches the selected preset; it scrolls rather than shrinking the component.</p><div class="visual-review__frame-scroll"><iframe class="visual-review__frame visual-review__frame--${review_case.viewport_width ?? case_config.viewport_widths?.[0] ?? 1280}" src="${escape_html(story_url)}" title="${escape_html(component_row.component_name)} live Storybook" loading="lazy"></iframe></div></details>
  </section>`;
}

export function connect_review_panel({ component_row, saved_case, review_token, refresh_results, set_busy }) {
  const review_form = document.querySelector('#visual-review-form');
  review_form.addEventListener('submit', async (submit_event) => {
    submit_event.preventDefault();
    const message_element = document.querySelector('#visual-review-message');
    const submit_button = review_form.querySelector('button[type="submit"]');
    const form_data = new FormData(review_form);
    const input_data = Object.fromEntries(form_data.entries());
    input_data.component_id = component_row.component_id;
    input_data.inputs_matched = form_data.has('inputs_matched');
    input_data.remove_baseline = form_data.has('remove_baseline');
    delete input_data.figma_png;
    set_busy(true);
    submit_button.disabled = true;
    message_element.textContent = 'Loading the complete website and Storybook pages, waiting for fonts and images, then comparing…';
    try {
      const image_file = form_data.get('figma_png');
      if (image_file?.size) {
        if (image_file.size > 8 * 1024 * 1024) throw new Error('Choose a PNG under 8 MB.');
        input_data.png_data = await new Promise((resolve_file, reject_file) => {
          const file_reader = new FileReader();
          file_reader.onload = () => resolve_file(file_reader.result);
          file_reader.onerror = () => reject_file(new Error('Could not read the PNG.'));
          file_reader.readAsDataURL(image_file);
        });
      }
      const response_data = await fetch('/api/review', { method: 'POST', headers: { 'content-type': 'application/json', 'x-review-token': review_token }, body: JSON.stringify(input_data) });
      const report_data = await response_data.json();
      if (!response_data.ok) throw new Error(report_data.error ?? 'Capture could not run.');
      set_busy(false);
      await refresh_results(true);
      const next_message = document.querySelector('#visual-review-message');
      if (next_message) next_message.textContent = 'Capture finished. Review the images and individual results below.';
    } catch (request_error) {
      message_element.textContent = request_error.message;
    } finally { set_busy(false); submit_button.disabled = false; }
  });
  const canvas_element = document.querySelector('#comparison-canvas');
  if (!canvas_element) return;
  const image_sources = { implementation: [image_reference(component_row, 'storybook', 'Storybook'), image_reference(component_row, 'drupal', 'Actual website')], 'figma-story': [saved_case?.figma_baseline, image_reference(component_row, 'storybook', 'Storybook')], 'figma-web': [saved_case?.figma_baseline, image_reference(component_row, 'drupal', 'Actual website')] };
  let image_pair = [], render_sequence = 0;
  const pair_select = document.querySelector('#comparison-pair');
  const mode_select = document.querySelector('#comparison-mode');
  const balance_input = document.querySelector('#comparison-balance');
  const comparison_message = document.querySelector('#comparison-message');
  let pixel_compare;
  async function draw_comparison() {
    if (image_pair.length !== 2) return;
    const [first_image, second_image] = image_pair;
    canvas_element.width = Math.max(first_image.naturalWidth, second_image.naturalWidth);
    canvas_element.height = Math.max(first_image.naturalHeight, second_image.naturalHeight);
    const canvas_context = canvas_element.getContext('2d');
    canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
    const same_bounds = first_image.naturalWidth === second_image.naturalWidth && first_image.naturalHeight === second_image.naturalHeight;
    comparison_message.textContent = `${first_image.naturalWidth} × ${first_image.naturalHeight} vs ${second_image.naturalWidth} × ${second_image.naturalHeight}. ${same_bounds ? 'Aligned at 1:1 pixels.' : 'Different dimensions; images are aligned at the top left without resizing.'}`;
    canvas_context.drawImage(first_image, 0, 0);
    if (mode_select.value === 'difference') {
      if (!same_bounds) { comparison_message.textContent += ' Pixel difference requires equal bounds.'; return; }
      const reference_data = canvas_context.getImageData(0, 0, canvas_element.width, canvas_element.height);
      canvas_context.clearRect(0, 0, canvas_element.width, canvas_element.height);
      canvas_context.drawImage(second_image, 0, 0);
      const actual_data = canvas_context.getImageData(0, 0, canvas_element.width, canvas_element.height);
      const difference_data = canvas_context.createImageData(canvas_element.width, canvas_element.height);
      pixel_compare ??= (await import('pixelmatch')).default;
      const different_pixels = pixel_compare(reference_data.data, actual_data.data, difference_data.data, canvas_element.width, canvas_element.height, { threshold: 0, includeAA: true });
      canvas_context.putImageData(difference_data, 0, 0);
      comparison_message.textContent += ` ${different_pixels.toLocaleString()} pixels differ. This view does not approve a baseline.`;
    } else {
      canvas_context.save();
      if (mode_select.value === 'wipe') { canvas_context.beginPath(); canvas_context.rect(0, 0, canvas_element.width * Number(balance_input.value) / 100, canvas_element.height); canvas_context.clip(); }
      else canvas_context.globalAlpha = Number(balance_input.value) / 100;
      canvas_context.drawImage(second_image, 0, 0);
      canvas_context.restore();
    }
  }
  async function load_pair() {
    const request_sequence = ++render_sequence;
    try {
      const loaded_pair = await Promise.all(image_sources[pair_select.value].map(async (image_path) => {
        const image_element = new Image();
        image_element.src = `/${image_path}`;
        await image_element.decode();
        return image_element;
      }));
      if (request_sequence !== render_sequence) return;
      image_pair = loaded_pair;
      await draw_comparison();
    } catch { comparison_message.textContent = 'Comparison images could not be loaded.'; }
  }
  pair_select.addEventListener('change', load_pair);
  mode_select.addEventListener('change', draw_comparison);
  balance_input.addEventListener('input', draw_comparison);
  document.querySelector('#comparison-toggle').addEventListener('click', () => { mode_select.value = 'overlay'; balance_input.value = Number(balance_input.value) === 0 ? '100' : '0'; draw_comparison(); });
  load_pair();
}
