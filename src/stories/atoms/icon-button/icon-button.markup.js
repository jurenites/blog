import { button_markup } from '../button/button.markup.js';

// Reuse Button behavior while its icon-only layout is owned by the Icon-button atom.
export function icon_button_markup({ button_type = 'button', ...button_options }) {
  return button_markup({ ...button_options, button_type, button_label: '' });
}
