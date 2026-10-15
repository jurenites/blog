import { button_markup } from '../stories/atoms/button/button.markup.js';

// Keep the project's Button atom and preserve the control's behavior attributes.
export function use_project_buttons(root_element) {
  for (const old_button of root_element.querySelectorAll('button[data-project-button]')) {
    const template_element = document.createElement('template');
    template_element.innerHTML = button_markup({ button_label: old_button.textContent, button_type: old_button.getAttribute('type') || 'button', style_variant: old_button.dataset.projectButton || 'secondary', is_disabled: old_button.disabled, additional_class_names: old_button.className });
    const next_button = template_element.content.firstElementChild;
    for (const attribute_item of old_button.attributes) if (!['class', 'data-project-button'].includes(attribute_item.name)) next_button.setAttribute(attribute_item.name, attribute_item.value);
    old_button.replaceWith(next_button);
  }
}

export function monospace_numbers(root_element) {
  const text_walker = document.createTreeWalker(root_element, NodeFilter.SHOW_TEXT);
  const text_nodes = [];
  while (text_walker.nextNode()) {
    const text_node = text_walker.currentNode;
    if (/\d/.test(text_node.nodeValue) && !text_node.parentElement.closest('.testing-number, pre, code, textarea, select, script, style, svg, [contenteditable]')) text_nodes.push(text_node);
  }
  for (const text_node of text_nodes) {
    const number_fragment = document.createDocumentFragment();
    for (const [part_index, text_part] of text_node.nodeValue.split(/(\d+(?:[.,:/-]\d+)*)/).entries()) {
      if (part_index % 2) {
        const number_span = document.createElement('span');
        number_span.className = 'testing-number';
        number_span.textContent = text_part;
        number_fragment.append(number_span);
      } else number_fragment.append(document.createTextNode(text_part));
    }
    text_node.replaceWith(number_fragment);
  }
}
