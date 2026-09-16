let expansion_sequence = 0;

export function initialize_expandable_terms(page_context = document) {
  const term_elements = [...page_context.querySelectorAll('.expandable-term')];
  if (page_context.matches?.('.expandable-term')) term_elements.unshift(page_context);
  term_elements.forEach((term_element) => {
    if (term_element.dataset.termReady || term_element.closest('.ck-editor')) return;
    const term_label = term_element.querySelector(':scope > .expandable-term__label');
    const term_explanation = term_element.querySelector(':scope > .expandable-term__explanation');
    if (!term_label || !term_explanation) return;
    const owner_document = term_element.ownerDocument;
    const expand_button = owner_document.createElement('button');
    const collapse_button = owner_document.createElement('button');
    const original_label = term_label.textContent;
    const collapse_label = typeof Drupal !== 'undefined' ? Drupal.t('Collapse explanation: @term', { '@term': original_label }) : `Collapse explanation: ${original_label}`;
    expand_button.type = collapse_button.type = 'button';
    expand_button.className = 'expandable-term__trigger';
    expand_button.textContent = original_label;
    collapse_button.className = 'expandable-term__collapse';
    collapse_button.textContent = '↶';
    collapse_button.setAttribute('aria-label', collapse_label);
    term_explanation.id = `term-explanation-${++expansion_sequence}`;
    term_explanation.tabIndex = -1;
    expand_button.setAttribute('aria-controls', term_explanation.id);
    collapse_button.setAttribute('aria-controls', term_explanation.id);
    collapse_button.setAttribute('aria-expanded', 'true');
    term_label.hidden = true;
    term_label.after(expand_button);
    term_explanation.append(collapse_button);
    const set_expanded = (is_expanded, move_focus = true) => {
      term_explanation.hidden = !is_expanded;
      expand_button.hidden = is_expanded;
      expand_button.setAttribute('aria-expanded', String(is_expanded));
      if (move_focus) (is_expanded ? term_explanation : expand_button).focus({ preventScroll: true });
    };
    expand_button.addEventListener('click', () => set_expanded(true));
    collapse_button.addEventListener('click', () => set_expanded(false));
    term_explanation.addEventListener('keydown', (key_event) => {
      if (key_event.key === 'Escape' && key_event.target.closest('.expandable-term') === term_element) {
        key_event.stopPropagation();
        set_expanded(false);
      }
    });
    term_element.dataset.termReady = 'true';
    set_expanded(false, false);
  });
}
