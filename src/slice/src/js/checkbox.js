// indeterminate is a DOM property, not an HTML attribute. Initialize once so
// later Drupal AJAX attaches cannot overwrite a visitor's current selection.
const initialized_checkboxes = new WeakSet();

export function initialize_checkboxes(input_context = document) {
  const input_selector = 'input[type="checkbox"][data-checkbox-state="partially"]';
  const checkbox_inputs = [...input_context.querySelectorAll(input_selector)];
  if (input_context.matches?.(input_selector)) checkbox_inputs.unshift(input_context);
  checkbox_inputs.forEach((checkbox_input) => {
    if (initialized_checkboxes.has(checkbox_input)) return;
    checkbox_input.indeterminate = true;
    initialized_checkboxes.add(checkbox_input);
  });
}
