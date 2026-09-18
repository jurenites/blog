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
    const reduced_motion = owner_document.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
    const expand_button = owner_document.createElement('button');
    const collapse_button = owner_document.createElement('button');
    const original_label = term_label.textContent;
    const collapse_label = typeof Drupal !== 'undefined' ? Drupal.t('Collapse explanation: @term', { '@term': original_label }) : `Collapse explanation: ${original_label}`;
    expand_button.type = collapse_button.type = 'button';
    expand_button.className = 'expandable-term__trigger';
    expand_button.textContent = original_label;
    expand_button.dataset.tooltipTrigger = '';
    const expand_label = typeof Drupal !== 'undefined' ? Drupal.t('Expand') : 'Expand';
    const close_label = typeof Drupal !== 'undefined' ? Drupal.t('Collapse') : 'Collapse';
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
    term_element.append(collapse_button);
    let transition_sequence = 0;
    let expanded_state = false;
    const set_expanded = (is_expanded, animate_change = true) => {
      const current_transition = ++transition_sequence;
      expanded_state = is_expanded;
      expand_button.setAttribute('aria-expanded', String(is_expanded));
      expand_button.dataset.tooltipLabel = is_expanded ? close_label : expand_label;
      const tooltip_element = expand_button.jurenites_tooltip_element;
      if (tooltip_element) {
        tooltip_element.textContent = expand_button.dataset.tooltipLabel;
        tooltip_element.classList.remove('is-visible');
      }
      term_explanation.classList.remove('is-expanding', 'is-collapsing');
      term_explanation.inert = !is_expanded;
      collapse_button.hidden = !is_expanded;
      if (!is_expanded && animate_change) expand_button.focus({ preventScroll: true });
      if (!animate_change || reduced_motion.matches) {
        term_explanation.hidden = !is_expanded;
        return;
      }
      term_explanation.hidden = false;
      term_explanation.classList.add(is_expanded ? 'is-expanding' : 'is-collapsing');
      // Animate only presentation; the inline text retains its natural layout.
      const transition_animations = term_explanation.getAnimations();
      Promise.all(transition_animations.map((term_animation) => term_animation.finished.catch(() => {})))
        .then(() => {
          if (current_transition !== transition_sequence) return;
          term_explanation.hidden = !expanded_state;
          term_explanation.classList.remove('is-expanding', 'is-collapsing');
        });
    };
    expand_button.addEventListener('click', () => set_expanded(!expanded_state));
    collapse_button.addEventListener('click', () => set_expanded(false));
    term_element.addEventListener('keydown', (key_event) => {
      if (key_event.key === 'Escape' && expanded_state && key_event.target.closest('.expandable-term') === term_element) {
        key_event.stopPropagation();
        set_expanded(false);
      }
    });
    term_element.dataset.termReady = 'true';
    set_expanded(false, false);
  });
}
