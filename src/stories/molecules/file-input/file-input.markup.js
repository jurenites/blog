import file_input_template from './file-input.template.html?raw';
import { button_markup } from '../../atoms/button/button.markup.js';
import { escape_html, render_template } from '../../template.js';

export function file_input_markup({
  field_id, field_name, field_label, accepted_types = '',
  button_label = 'Choose file', drop_label = 'Drop a file here',
  hint_text = '', is_disabled = false,
}) {
  return render_template(file_input_template, {
    field_id: escape_html(field_id),
    field_name: escape_html(field_name),
    field_label: escape_html(field_label),
    accepted_types: escape_html(accepted_types),
    drop_label: escape_html(drop_label),
    hint_text: escape_html(hint_text),
    disabled_attribute: is_disabled ? ' disabled' : '',
    choose_button: button_markup({
      button_label, button_type: 'button', style_variant: 'secondary', is_disabled,
      button_accessible_label: `${button_label}: ${field_label}`,
      additional_class_names: 'file-input__choose',
    }),
  });
}
