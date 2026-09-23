// Reveal a temporary copy in normal inline flow; preserve the original nested
// controls and authored markup, restoring them when typing ends or is cancelled.
export function type_term_explanation(term_content, reduced_motion) {
  const owner_document = term_content.ownerDocument;
  const browser_window = owner_document.defaultView;
  const duration_value = browser_window.getComputedStyle(term_content)
    .getPropertyValue('--motion-duration-medium-default').trim();
  const typing_duration = parseFloat(duration_value) * (duration_value.endsWith('ms') ? 1 : 1000);
  if (reduced_motion.matches || !Number.isFinite(typing_duration) || typing_duration <= 0) return () => {};

  const character_segmenter = new Intl.Segmenter(owner_document.documentElement.lang || undefined, { granularity: 'grapheme' });
  const text_walker = owner_document.createTreeWalker(term_content, browser_window.NodeFilter.SHOW_TEXT);
  const character_boundaries = [];
  while (text_walker.nextNode()) {
    const text_node = text_walker.currentNode;
    if (text_node.parentElement.closest('[hidden], [aria-hidden="true"], svg, .expandable-term__collapse')) continue;
    for (const text_segment of character_segmenter.segment(text_node.textContent)) {
      character_boundaries.push({ text_node, end_offset: text_segment.index + text_segment.segment.length });
    }
  }
  if (!character_boundaries.length) return () => {};

  const typing_preview = owner_document.createElement('span');
  typing_preview.className = 'expandable-term__typing';
  typing_preview.setAttribute('aria-hidden', 'true');
  typing_preview.inert = true;
  const term_explanation = term_content.parentElement;
  term_explanation.setAttribute('aria-busy', 'true');
  term_content.before(typing_preview);
  term_content.hidden = true;
  const content_range = owner_document.createRange();
  content_range.setStart(term_content, 0);
  const start_time = browser_window.performance.now();
  let frame_request;
  let finish_timer;
  let visible_count = 0;

  const finish_typing = () => {
    browser_window.cancelAnimationFrame(frame_request);
    browser_window.clearTimeout(finish_timer);
    reduced_motion.removeEventListener('change', finish_typing);
    typing_preview.remove();
    term_content.hidden = false;
    term_explanation.removeAttribute('aria-busy');
  };
  const reveal_characters = (frame_time) => {
    if (!term_content.isConnected || frame_time - start_time >= typing_duration) {
      finish_typing();
      return;
    }
    // Batch characters per frame so even a long explanation finishes in one
    // token duration rather than accumulating a delay for every character.
    const next_count = Math.floor(character_boundaries.length * (frame_time - start_time) / typing_duration);
    if (next_count > visible_count) {
      const { text_node, end_offset } = character_boundaries[next_count - 1];
      content_range.setEnd(text_node, end_offset);
      const preview_content = content_range.cloneContents();
      preview_content.querySelectorAll('[id]').forEach((copied_element) => copied_element.removeAttribute('id'));
      typing_preview.replaceChildren(preview_content);
      visible_count = next_count;
    }
    frame_request = browser_window.requestAnimationFrame(reveal_characters);
  };
  reduced_motion.addEventListener('change', finish_typing, { once: true });
  frame_request = browser_window.requestAnimationFrame(reveal_characters);
  finish_timer = browser_window.setTimeout(finish_typing, typing_duration);
  return finish_typing;
}
