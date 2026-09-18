import { file_input_markup } from './file-input.markup.js';

const FIELD_ID = 'reference-file';
const FIELD_NAME = 'reference_file';
const FIELD_LABEL = 'Figma reference PNG (optional, 1×)';
const ACCEPTED_TYPES = 'image/png';
const BUTTON_LABEL = 'Choose file';
const DROP_LABEL = 'Drop a PNG here';
const HINT_TEXT = 'PNG at 1×. Choose a file or drag it into the field.';
const IS_DISABLED = false;

export default {
  title: 'Molecules/Input fields/File Input',
  tags: ['autodocs'],
  render: file_input_markup,
  parameters: { docs: { description: { component: 'A single-file input with a 40px secondary button and 40px drop area. Selecting or dropping a file updates the native form input; it does not upload automatically.' } } },
  argTypes: {
    field_id: { control: 'text' },
    field_name: { control: 'text' },
    field_label: { control: 'text' },
    accepted_types: { control: 'text' },
    button_label: { control: 'text' },
    drop_label: { control: 'text' },
    hint_text: { control: 'text' },
    is_disabled: { control: 'boolean' },
  },
  args: {
    field_id: FIELD_ID, field_name: FIELD_NAME, field_label: FIELD_LABEL,
    accepted_types: ACCEPTED_TYPES, button_label: BUTTON_LABEL, drop_label: DROP_LABEL,
    hint_text: HINT_TEXT, is_disabled: IS_DISABLED,
  },
};

export const default_story = {};
